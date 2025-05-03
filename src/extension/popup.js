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
      
      // Draw mock bounding boxes
      const boxes = [
        { x: 50, y: 50, width: 200, height: 200, label: 'Object 1' },
        { x: 300, y: 100, width: 250, height: 180, label: 'Object 2' },
        { x: 200, y: 300, width: 220, height: 190, label: 'Object 3' }
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

      // Add click event listener to the canvas
      canvas.style.cursor = 'pointer';
      canvas.addEventListener('click', (event) => {
        console.log('Canvas clicked!');
        
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        console.log('Click coordinates:', { x, y });
        
        // Remove any existing info panel
        const existingInfo = document.querySelector('.box-info-panel');
        if (existingInfo) {
          existingInfo.remove();
        }
        
        // Check if click is inside any box
        let boxClicked = false;
        boxes.forEach(box => {
          if (x >= box.x && x <= box.x + box.width &&
              y >= box.y && y <= box.y + box.height) {
            boxClicked = true;
            console.log('Box clicked:', box);
            
            // Create info panel
            const infoPanel = document.createElement('div');
            infoPanel.className = 'box-info-panel';
            infoPanel.style.cssText = `
              position: fixed;
              top: 20px;
              left: 20px;
              background: rgba(0, 0, 0, 0.8);
              color: white;
              padding: 15px;
              border-radius: 8px;
              font-family: Arial, sans-serif;
              z-index: 1000000;
              max-width: 300px;
            `;
            
            infoPanel.innerHTML = `
              <h3 style="margin: 0 0 10px 0;">Box Information</h3>
              <p style="margin: 5px 0;">Label: ${box.label}</p>
              <p style="margin: 5px 0;">X: ${box.x}</p>
              <p style="margin: 5px 0;">Y: ${box.y}</p>
              <p style="margin: 5px 0;">Width: ${box.width}</p>
              <p style="margin: 5px 0;">Height: ${box.height}</p>
            `;
            
            document.body.appendChild(infoPanel);
            
            // Add close button to info panel
            const closeButton = document.createElement('button');
            closeButton.innerHTML = '&times;';
            closeButton.style.cssText = `
              position: absolute;
              top: 5px;
              right: 5px;
              background: none;
              border: none;
              color: white;
              font-size: 20px;
              cursor: pointer;
              padding: 5px;
            `;
            closeButton.onclick = () => infoPanel.remove();
            infoPanel.appendChild(closeButton);
          }
        });
        
        if (!boxClicked) {
          console.log('No box was clicked');
        }
      });

      // Make sure the canvas is properly positioned
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';

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
        // Create a simple overlay with the image
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

        // Create close button
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
        `;

        // Create image container
        const imageContainer = document.createElement('div');
        imageContainer.style.cssText = `
          max-width: 90%;
          max-height: 90%;
          position: relative;
        `;

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.style.cssText = `
          max-width: 100%;
          max-height: 100%;
          cursor: pointer;
        `;

        // Create debug panel
        const debugPanel = document.createElement('div');
        debugPanel.style.cssText = `
          position: fixed;
          top: 20px;
          left: 20px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 15px;
          border-radius: 8px;
          font-family: Arial, sans-serif;
          z-index: 1000000;
        `;
        debugPanel.innerHTML = 'Debug Panel - Click on the image';

        // Load and process the image
        const img = new Image();
        img.onload = () => {
          // Set canvas size
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Get context and draw image
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          
          // Draw boxes
          const boxes = [
            { x: 50, y: 50, width: 200, height: 200, label: 'Object 1' },
            { x: 300, y: 100, width: 250, height: 180, label: 'Object 2' },
            { x: 200, y: 300, width: 220, height: 190, label: 'Object 3' }
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

          // Add click handler
          canvas.addEventListener('click', (event) => {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            // Update debug panel with coordinates and API button
            debugPanel.innerHTML = `
              <h3 style="margin: 0 0 10px 0;">Click Coordinates</h3>
              <p style="margin: 5px 0;">X: ${x}</p>
              <p style="margin: 5px 0;">Y: ${y}</p>
              <button style="
                margin-top: 10px;
                padding: 8px 16px;
                background: #4CAF50;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
              " onclick="
                // This is where you would make the API call
                const coordinates = {
                  x: ${x},
                  y: ${y}
                };
                console.log('API call would be made with:', coordinates);
                // Replace this with your actual API call
                fetch('YOUR_API_ENDPOINT', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(coordinates)
                })
                .then(response => response.json())
                .then(data => {
                  console.log('API Response:', data);
                  alert('Coordinates sent to API');
                })
                .catch(error => {
                  console.error('API Error:', error);
                  alert('Error sending coordinates to API');
                });
              ">
                Send Coordinates to API
              </button>
            `;
          });

          // Assemble everything
          imageContainer.appendChild(canvas);
          overlay.appendChild(closeButton);
          overlay.appendChild(imageContainer);
          overlay.appendChild(debugPanel);
          document.body.appendChild(overlay);

          // Close button functionality
          closeButton.onclick = () => {
            document.body.removeChild(overlay);
          };

          // Close on escape key
          document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
              document.body.removeChild(overlay);
            }
          });
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