// Background script for the extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Screenshot Capture extension installed');
});

// Handle keyboard shortcut
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
                  background: rgba(0, 0, 0, 0.9);
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  z-index: 999999;
                `;

                const closeButton = document.createElement('button');
                closeButton.textContent = '×';
                closeButton.style.cssText = `
                  position: absolute;
                  top: 20px;
                  right: 20px;
                  background: none;
                  border: none;
                  color: white;
                  font-size: 30px;
                  cursor: pointer;
                  padding: 10px;
                `;

                const imageContainer = document.createElement('div');
                imageContainer.style.cssText = `
                  max-width: 90%;
                  max-height: 90%;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                `;

                const image = document.createElement('img');
                image.src = imageData;
                image.style.cssText = `
                  max-width: 100%;
                  max-height: 100%;
                  object-fit: contain;
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
        });
      }
    });
  }
}); 