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
    // Mock API response with bounding boxes
    const mockApiResponse = {
      image: dataUrl,
      boxes: [
        { x: 50, y: 50, width: 100, height: 100, label: 'Object 1' },
        { x: 200, y: 100, width: 150, height: 80, label: 'Object 2' },
        { x: 100, y: 200, width: 120, height: 90, label: 'Object 3' }
      ]
    };

    // Create a canvas to draw the boxes
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the original image
      ctx.drawImage(img, 0, 0);
      
      // Draw the bounding boxes
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 2;
      ctx.font = '14px Arial';
      ctx.fillStyle = '#FF0000';
      
      mockApiResponse.boxes.forEach(box => {
        // Draw rectangle
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        
        // Draw label background
        const textWidth = ctx.measureText(box.label).width;
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fillRect(box.x, box.y - 20, textWidth + 10, 20);
        
        // Draw label text
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(box.label, box.x + 5, box.y - 5);
      });
      
      // Show the overlay with the processed image
      showOverlay(canvas.toDataURL());
    };

    img.src = dataUrl;
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
      function: (dataUrl) => {
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

        // Process the screenshot
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw the original image
          ctx.drawImage(img, 0, 0);
          
          // Draw mock bounding boxes
          const boxes = [
            { x: 50, y: 50, width: 100, height: 100, label: 'Object 1' },
            { x: 200, y: 100, width: 150, height: 80, label: 'Object 2' },
            { x: 100, y: 200, width: 120, height: 90, label: 'Object 3' }
          ];
          
          ctx.strokeStyle = '#FF0000';
          ctx.lineWidth = 2;
          ctx.font = '14px Arial';
          
          boxes.forEach(box => {
            ctx.strokeRect(box.x, box.y, box.width, box.height);
            const textWidth = ctx.measureText(box.label).width;
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fillRect(box.x, box.y - 20, textWidth + 10, 20);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(box.label, box.x + 5, box.y - 5);
          });
          
          // Show the overlay
          showOverlay(canvas.toDataURL());
        };
        
        img.src = dataUrl;
      },
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