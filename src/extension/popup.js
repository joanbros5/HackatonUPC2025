// Function to create and show the overlay
function showOverlay(imageData) {
  // Create overlay elements
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.95);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999999;
  `;

  const closeButton = document.createElement('button');
  closeButton.innerHTML = '&times;';
  closeButton.style.cssText = `
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    padding: 8px 16px;
    border-radius: 4px;
    transition: all 0.3s ease;
  `;
  closeButton.onmouseover = () => {
    closeButton.style.background = 'rgba(255, 255, 255, 0.2)';
  };
  closeButton.onmouseout = () => {
    closeButton.style.background = 'rgba(255, 255, 255, 0.1)';
  };

  const imageContainer = document.createElement('div');
  imageContainer.style.cssText = `
    max-width: 90%;
    max-height: 90%;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
  `;

  const image = document.createElement('img');
  image.src = imageData;
  image.style.cssText = `
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: 4px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  `;

  // Assemble the overlay
  imageContainer.appendChild(image);
  overlay.appendChild(closeButton);
  overlay.appendChild(imageContainer);
  document.body.appendChild(overlay);

  // Close button functionality
  closeButton.onclick = () => {
    document.body.removeChild(overlay);
  };

  // Close on escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      document.body.removeChild(overlay);
    }
  });
}

// Function to process the screenshot
async function processScreenshot(dataUrl) {
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
}

// Handle button click
document.getElementById('captureBtn').addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const dataUrl = await chrome.tabs.captureVisibleTab();
    
    // Execute the processing directly in the current tab
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: processScreenshot,
      args: [dataUrl]
    });
  } catch (error) {
    console.error('Error:', error);
  }
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'screenshot-captured') {
    // Execute the processing in the current tab
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      function: processScreenshot,
      args: [message.dataUrl]
    });
  }
}); 