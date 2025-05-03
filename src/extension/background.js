// Background script for the extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Screenshot Capture extension installed');
});

// Track extension state
let isExtensionActive = false;

// Function to inject bounding boxes into the page
function injectBoundingBoxes(boxes) {
  // Create a container for the boxes
  const container = document.createElement('div');
  container.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 999999;
  `;

  // Create boxes
  boxes.forEach(([x1, y1, x2, y2]) => {
    const boxElement = document.createElement('div');
    boxElement.style.cssText = `
      position: absolute;
      left: ${Math.round(x1)}px;
      top: ${Math.round(y1)}px;
      width: ${Math.round(x2 - x1)}px;
      height: ${Math.round(y2 - y1)}px;
      border: 2px solid red;
      pointer-events: auto;
      cursor: pointer;
      transition: all 0.2s ease;
      box-sizing: border-box;
    `;

    // Add hover effect
    boxElement.addEventListener('mouseover', () => {
      boxElement.style.border = '2px solid #00ff00';
      boxElement.style.boxShadow = '0 0 10px rgba(0,255,0,0.5)';
    });

    boxElement.addEventListener('mouseout', () => {
      boxElement.style.border = '2px solid red';
      boxElement.style.boxShadow = 'none';
    });

    container.appendChild(boxElement);
  });

  document.body.appendChild(container);
}

// Function to show/hide recording indicator
function toggleRecordingIndicator(show) {
  // Remove existing indicator if any
  const existingIndicator = document.getElementById('recording-indicator');
  if (existingIndicator) {
    existingIndicator.remove();
  }

  if (show) {
    // Create recording indicator
    const indicator = document.createElement('div');
    indicator.id = 'recording-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 8px;
      height: 8px;
      background: #00ff00;
      border-radius: 50%;
      box-shadow: 0 0 10px rgba(0,255,0,0.5);
      animation: pulse 1.5s infinite;
      z-index: 1000000;
    `;

    // Add pulse animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.2); opacity: 0.7; }
        100% { transform: scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(indicator);
  }
}

// Listen for extension icon click
chrome.action.onClicked.addListener((tab) => {
  isExtensionActive = !isExtensionActive; // Toggle state
  
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: toggleRecordingIndicator,
    args: [isExtensionActive]
  });
});

// Listen for keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
  if (command === 'capture-screenshot' && isExtensionActive) {
    // Get the current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        // Capture the screenshot
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
          // Convert data URL to blob
          fetch(dataUrl)
            .then(res => res.blob())
            .then(blob => {
              // Create form data
              const formData = new FormData();
              formData.append('file', blob, 'screenshot.png');

              // Send to API
              return fetch('http://localhost:8000/boxes', {
                method: 'POST',
                body: formData
              }).then(response => response.json()).then(data => ({ data, dataUrl }));
            })
            .then(({ data, dataUrl }) => {
              console.log('API Response:', data); // Debug log
              // Inject the drawing logic into the page context
              chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                function: (boxes, dataUrl) => {
                  // This code runs in the page context!
                  const img = new Image();
                  img.onload = function() {
                    const screenshotWidth = img.width;
                    const screenshotHeight = img.height;
                    const pageWidth = document.documentElement.clientWidth;
                    const pageHeight = document.documentElement.clientHeight;
                    const scaleX = pageWidth / screenshotWidth;
                    const scaleY = pageHeight / screenshotHeight;

                    // Draw boxes
                    const container = document.createElement('div');
                    container.style.cssText = `
                      position: absolute;
                      top: 0;
                      left: 0;
                      width: 100%;
                      height: 100%;
                      pointer-events: none;
                      z-index: 999999;
                    `;
                    boxes.forEach(([x1, y1, x2, y2]) => {
                      const boxElement = document.createElement('div');
                      boxElement.style.cssText = `
                        position: absolute;
                        left: ${Math.round(x1 * scaleX)}px;
                        top: ${Math.round(y1 * scaleY)}px;
                        width: ${Math.round((x2 - x1) * scaleX)}px;
                        height: ${Math.round((y2 - y1) * scaleY)}px;
                        border: 2px solid red;
                        pointer-events: auto;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        box-sizing: border-box;
                      `;
                      // Add hover effect
                      boxElement.addEventListener('mouseover', () => {
                        boxElement.style.border = '2px solid #00ff00';
                        boxElement.style.boxShadow = '0 0 10px rgba(0,255,0,0.5)';
                      });
                      boxElement.addEventListener('mouseout', () => {
                        boxElement.style.border = '2px solid red';
                        boxElement.style.boxShadow = 'none';
                      });
                      container.appendChild(boxElement);
                    });
                    document.body.appendChild(container);
                  };
                  img.src = dataUrl;
                },
                args: [data.boxes || [], dataUrl]
              });
            })
            .catch(error => {
              console.error('Error:', error);
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