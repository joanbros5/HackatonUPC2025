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

    // Add click handler to crop and search
    boxElement.addEventListener('click', async () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = Math.round((x2 - x1) * scaleX);
      canvas.height = Math.round((y2 - y1) * scaleY);
      ctx.drawImage(img, x1, y1, x2 - x1, y2 - y1, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(async (blob) => {
        const formData = new FormData();
        formData.append('file', blob, 'cropped.png');
        try {
          const response = await fetch('http://localhost:8000/search-products', {
            method: 'POST',
            body: formData
          });
          const data = await response.json();
          console.log('Search results:', data);
          
          const popup = document.createElement('div');
          popup.style.cssText = `
            position: fixed;
            top: 24px;
            right: 24px;
            width: 270px;
            max-height: 88vh;
            overflow-y: auto;
            background: #f9f9fb;
            padding: 18px 8px 18px 8px;
            border-radius: 14px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.10);
            z-index: 2147483647;
            display: flex;
            flex-direction: column;
            align-items: stretch;
            scrollbar-width: thin;
            scrollbar-color: #bbb #f5f5f5;
            border: 1px solid #ececec;
          `;
          // Add custom scrollbar for Webkit browsers
          const style = document.createElement('style');
          style.textContent = `
            .custom-popup::-webkit-scrollbar {
              width: 6px;
            }
            .custom-popup::-webkit-scrollbar-thumb {
              background: #bbb;
              border-radius: 3px;
            }
            .custom-popup::-webkit-scrollbar-track {
              background: #f5f5f5;
            }
            .custom-popup a.image-card {
              border: none !important;
              background: #fff !important;
              border-radius: 10px !important;
              box-shadow: 0 1px 6px rgba(0,0,0,0.04);
              margin-bottom: 2px;
              transition: box-shadow 0.18s, transform 0.18s;
            }
            .custom-popup a.image-card:hover {
              box-shadow: 0 4px 16px rgba(0,0,0,0.10);
              transform: translateY(-2px) scale(1.025);
            }
            .custom-popup img.product-img {
              border-radius: 8px;
              background: #f3f3f3;
              margin-bottom: 10px;
              box-shadow: none;
            }
            .custom-popup .product-name {
              color: #222;
              font-size: 11.5px;
              margin-bottom: 2px;
              text-transform: capitalize;
              font-weight: 500;
              letter-spacing: 0.01em;
            }
            .custom-popup .product-brand {
              color: #222;
              font-size: 14px;
              margin-bottom: 2px;
              text-transform: capitalize;
              font-weight: 600;
              letter-spacing: 0.01em;
            }
            .custom-popup .product-price {
              color: #1a7f37;
              font-size: 13.5px;
              font-weight: 600;
              margin-bottom: 0;
              letter-spacing: 0.01em;
            }
            .custom-popup .close-btn {
              position: sticky;
              top: 8px;
              right: 10px;
              float: right;
              margin-left: auto;
              background: #fff;
              border: 1px solid #e0e0e0;
              border-radius: 50%;
              width: 26px;
              height: 26px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
              color: #888;
              cursor: pointer;
              box-shadow: 0 1px 4px rgba(0,0,0,0.04);
              transition: background 0.15s, color 0.15s;
              z-index: 1000001;
            }
            .custom-popup .close-btn:hover {
              background: #f3f3f3;
              color: #222;
            }
          `;
          document.head.appendChild(style);
          popup.classList.add('custom-popup');
          popup.style.position = 'fixed';
          popup.style.top = '24px';
          popup.style.right = '24px';
          popup.style.left = '';
          popup.style.transform = '';
          popup.innerHTML = `
            <button class="close-btn" title="Close" aria-label="Close">&#10005;</button>
            <div style="display: flex; flex-direction: column; gap: 18px;">
              ${data.results.map(result => `
                <a href="${result.link}" target="_blank" class="image-card" style="display: flex; flex-direction: column; align-items: center; text-align: center; text-decoration: none;">
                  <img src="${result.image_url}" class="product-img" style="max-width: 180px; max-height: 180px; object-fit: contain; display: block;">
                  <div class="product-name"><strong>${result.name}</strong></div>
                  <div class="product-brand">${result.brand}</div>
                  <div class="product-price">${result.price}</div>
                </a>
              `).join('')}
            </div>
          `;
          // Move close button to the top
          const closeButton = popup.querySelector('.close-btn');
          closeButton.onclick = () => popup.remove();
          document.body.appendChild(popup);
        } catch (error) {
          console.error('Error searching products:', error);
        }
      }, 'image/png');
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

// Function to pause all videos on the page
function pauseAllVideos() {
  const videos = document.querySelectorAll('video');
  videos.forEach(video => {
    if (!video.paused) {
      video.pause();
    }
  });
}

// Listen for keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
  if (command === 'capture-screenshot' && isExtensionActive) {
    // Get the current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        // Inject pauseAllVideos before capturing screenshot
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: pauseAllVideos
        }, () => {
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
                      const scrollY = window.scrollY || document.documentElement.scrollTop;
                      const scrollX = window.scrollX || document.documentElement.scrollLeft;

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
                          left: ${Math.round(x1 * scaleX) + scrollX}px;
                          top: ${Math.round(y1 * scaleY) + scrollY}px;
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

                        // Add click handler to crop and search
                        boxElement.addEventListener('click', async () => {
                          const canvas = document.createElement('canvas');
                          const ctx = canvas.getContext('2d');
                          canvas.width = Math.round((x2 - x1) * scaleX);
                          canvas.height = Math.round((y2 - y1) * scaleY);
                          ctx.drawImage(img, x1, y1, x2 - x1, y2 - y1, 0, 0, canvas.width, canvas.height);
                          
                          canvas.toBlob(async (blob) => {
                            const formData = new FormData();
                            formData.append('file', blob, 'cropped.png');
                            try {
                              const response = await fetch('http://localhost:8000/search-products', {
                                method: 'POST',
                                body: formData
                              });
                              const data = await response.json();
                              console.log('Search results:', data);
                              
                              const popup = document.createElement('div');
                              popup.style.cssText = `
                                position: fixed;
                                top: 24px;
                                right: 24px;
                                width: 270px;
                                max-height: 88vh;
                                overflow-y: auto;
                                background: #f9f9fb;
                                padding: 18px 8px 18px 8px;
                                border-radius: 14px;
                                box-shadow: 0 4px 24px rgba(0,0,0,0.10);
                                z-index: 2147483647;
                                display: flex;
                                flex-direction: column;
                                align-items: stretch;
                                scrollbar-width: thin;
                                scrollbar-color: #bbb #f5f5f5;
                                border: 1px solid #ececec;
                              `;
                              // Add custom scrollbar for Webkit browsers
                              const style = document.createElement('style');
                              style.textContent = `
                                .custom-popup::-webkit-scrollbar {
                                  width: 6px;
                                }
                                .custom-popup::-webkit-scrollbar-thumb {
                                  background: #bbb;
                                  border-radius: 3px;
                                }
                                .custom-popup::-webkit-scrollbar-track {
                                  background: #f5f5f5;
                                }
                                .custom-popup a.image-card {
                                  border: none !important;
                                  background: #fff !important;
                                  border-radius: 10px !important;
                                  box-shadow: 0 1px 6px rgba(0,0,0,0.04);
                                  margin-bottom: 2px;
                                  transition: box-shadow 0.18s, transform 0.18s;
                                }
                                .custom-popup a.image-card:hover {
                                  box-shadow: 0 4px 16px rgba(0,0,0,0.10);
                                  transform: translateY(-2px) scale(1.025);
                                }
                                .custom-popup img.product-img {
                                  border-radius: 8px;
                                  background: #f3f3f3;
                                  margin-bottom: 10px;
                                  box-shadow: none;
                                }
                                .custom-popup .product-name {
                                  color: #222;
                                  font-size: 11.5px;
                                  margin-bottom: 2px;
                                  text-transform: capitalize;
                                  font-weight: 500;
                                  letter-spacing: 0.01em;
                                }
                                .custom-popup .product-brand {
                                  color: #222;
                                  font-size: 14px;
                                  margin-bottom: 2px;
                                  text-transform: capitalize;
                                  font-weight: 600;
                                  letter-spacing: 0.01em;
                                }
                                .custom-popup .product-price {
                                  color: #1a7f37;
                                  font-size: 13.5px;
                                  font-weight: 600;
                                  margin-bottom: 0;
                                  letter-spacing: 0.01em;
                                }
                                .custom-popup .close-btn {
                                  position: sticky;
                                  top: 8px;
                                  right: 10px;
                                  float: right;
                                  margin-left: auto;
                                  background: #fff;
                                  border: 1px solid #e0e0e0;
                                  border-radius: 50%;
                                  width: 26px;
                                  height: 26px;
                                  display: flex;
                                  align-items: center;
                                  justify-content: center;
                                  font-size: 16px;
                                  color: #888;
                                  cursor: pointer;
                                  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
                                  transition: background 0.15s, color 0.15s;
                                  z-index: 1000001;
                                }
                                .custom-popup .close-btn:hover {
                                  background: #f3f3f3;
                                  color: #222;
                                }
                              `;
                              document.head.appendChild(style);
                              popup.classList.add('custom-popup');
                              popup.style.position = 'fixed';
                              popup.style.top = '24px';
                              popup.style.right = '24px';
                              popup.style.left = '';
                              popup.style.transform = '';
                              popup.innerHTML = `
                                <button class="close-btn" title="Close" aria-label="Close">&#10005;</button>
                                <div style="display: flex; flex-direction: column; gap: 18px;">
                                  ${data.results.map(result => `
                                    <a href="${result.link}" target="_blank" class="image-card" style="display: flex; flex-direction: column; align-items: center; text-align: center; text-decoration: none;">
                                      <img src="${result.image_url}" class="product-img" style="max-width: 180px; max-height: 180px; object-fit: contain; display: block;">
                                      <div class="product-name"><strong>${result.name}</strong></div>
                                      <div class="product-brand">${result.brand}</div>
                                      <div class="product-price">${result.price}</div>
                                    </a>
                                  `).join('')}
                                </div>
                              `;
                              // Move close button to the top
                              const closeButton = popup.querySelector('.close-btn');
                              closeButton.onclick = () => popup.remove();
                              document.body.appendChild(popup);
                            } catch (error) {
                              console.error('Error searching products:', error);
                            }
                          }, 'image/png');
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