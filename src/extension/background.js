// Background script for the extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Screenshot Capture extension installed');
});

// Listen for keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
  if (command === 'capture-screenshot') {
    // Get the current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        // Capture the screenshot
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
          // Execute the processing directly in the current tab
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: async (dataUrl) => {
              try {
                // Fetch boxes from API
                const response = await chrome.runtime.sendMessage({ type: 'get_boxes' });
                if (!response || !response.boxes) {
                  throw new Error('Invalid response format from API');
                }
                const boxes = response.boxes;
                
                // Create a container for the boxes
                const container = document.createElement('div');
                container.style.cssText = `
                  position: fixed;
                  top: 0;
                  left: 0;
                  width: 100%;
                  height: 100%;
                  pointer-events: none;
                  z-index: 999999;
                `;

                // Create boxes
                boxes.forEach(([x1, y1, x2, y2]) => {
                  const box = document.createElement('div');
                  box.style.cssText = `
                    position: absolute;
                    left: ${x1}px;
                    top: ${y1}px;
                    width: ${x2 - x1}px;
                    height: ${y2 - y1}px;
                    border: 2px solid red;
                    pointer-events: auto;
                    cursor: pointer;
                    transition: all 0.2s ease;
                  `;

                  // Add hover effect
                  box.addEventListener('mouseover', () => {
                    box.style.border = '2px solid #00ff00';
                    box.style.boxShadow = '0 0 10px rgba(0,255,0,0.5)';
                  });

                  box.addEventListener('mouseout', () => {
                    box.style.border = '2px solid red';
                    box.style.boxShadow = 'none';
                  });

                  container.appendChild(box);
                });

                document.body.appendChild(container);
              } catch (error) {
                console.error('Error:', error);
              }
            },
            args: [dataUrl]
          });
        });
      }
    });
  }
});

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'get_boxes') {
    fetch('http://localhost:8000/boxes')
      .then(response => response.json())
      .then(data => {
        sendResponse(data);
      })
      .catch(error => {
        console.error('Error fetching boxes:', error);
        sendResponse({ error: 'Failed to fetch boxes' });
      });
    return true; // Required for async response
  }
});

// Function to inject bounding boxes into the page
function injectBoundingBoxes(boxes) {
  // Create a container for the boxes
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 999999;
  `;

  // Create boxes
  boxes.forEach(([x1, y1, x2, y2]) => {
    const box = document.createElement('div');
    box.style.cssText = `
      position: absolute;
      left: ${x1}px;
      top: ${y1}px;
      width: ${x2 - x1}px;
      height: ${y2 - y1}px;
      border: 2px solid red;
      pointer-events: auto;
      cursor: pointer;
      transition: all 0.2s ease;
    `;

    // Add hover effect
    box.addEventListener('mouseover', () => {
      box.style.border = '2px solid #00ff00';
      box.style.boxShadow = '0 0 10px rgba(0,255,0,0.5)';
    });

    box.addEventListener('mouseout', () => {
      box.style.border = '2px solid red';
      box.style.boxShadow = 'none';
    });

    container.appendChild(box);
  });

  document.body.appendChild(container);
}

// Listen for the capture button click
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'capture') {
    // Get the current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        // Execute the script to inject bounding boxes
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: injectBoundingBoxes,
          args: [request.boxes]
        });
      }
    });
  }
}); 