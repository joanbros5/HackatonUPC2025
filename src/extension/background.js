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
    boxElement.addEventListener('click', async (event) => {
      event.stopPropagation();
      // Store reference to the selected box
      const selectedBox = boxElement;
      // Remove all other bounding boxes except the clicked one
      const allBoxes = Array.from(container.children);
      allBoxes.forEach(child => {
        if (child !== boxElement) {
          child.remove();
        }
      });

      // Crop the image as before
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = Math.round((x2 - x1) * scaleX);
      canvas.height = Math.round((y2 - y1) * scaleY);
      ctx.drawImage(img, x1, y1, x2 - x1, y2 - y1, 0, 0, canvas.width, canvas.height);

      // Directly send to /search-products (skip /get-contour)
      canvas.toBlob(async (blob) => {
        // Show loading spinner
        let loader = document.getElementById('popup-loader');
        if (!loader) {
          loader = document.createElement('div');
          loader.id = 'popup-loader';
          loader.style.cssText = `
            position: fixed;
            top: 36px;
            right: 36px;
            z-index: 2147483647;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
            background: rgba(255,255,255,0.85);
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.10);
          `;
          loader.innerHTML = `
            <svg width="28" height="28" viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="20" fill="none" stroke="#e60023" stroke-width="5" stroke-linecap="round" stroke-dasharray="31.4 31.4" transform="rotate(-90 25 25)">
                <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.8s" repeatCount="indefinite"/>
              </circle>
            </svg>
          `;
          document.body.appendChild(loader);
        }
        // Send to /search-products
        const formData2 = new FormData();
        formData2.append('file', blob, 'cropped.png');
        const response2 = await fetch('http://localhost:8000/search-products', {
          method: 'POST',
          body: formData2
        });
        const data2 = await response2.json();
        console.log('Search results:', data2);

        const popup = document.createElement('div');
        popup.style.cssText = `
          position: fixed;
          top: 24px;
          right: 24px;
          width: 270px;
          max-height: 88vh;
          overflow-y: auto;
          background: #f9f9fb;
          padding: 8px 8px 18px 8px;
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
          .custom-popup .try-on-btn {
            margin-top: 0px;
            margin-bottom: 2px;
            padding: 5px 16px;
            background: linear-gradient(90deg, #ff5858 0%, #f857a6 100%);
            color: #fff;
            border: none;
            border-radius: 6px;
            font-size: 12.5px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 1px 4px rgba(248,87,166,0.08);
            transition: background 0.18s, box-shadow 0.18s;
            outline: none;
            letter-spacing: 0.01em;
          }
          .custom-popup .try-on-btn:hover {
            background: linear-gradient(90deg, #f857a6 0%, #ff5858 100%);
            box-shadow: 0 2px 8px rgba(248,87,166,0.16);
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
            ${data2.results.map((result, idx) => `
              <div style="display: flex; flex-direction: column; align-items: center;">
                <a href="${result.link}" target="_blank" class="image-card" style="display: flex; flex-direction: column; align-items: center; text-align: center; text-decoration: none; margin-bottom: 0; padding-bottom: 0;">
                  <img src="${result.image_url}" class="product-img" style="max-width: 180px; max-height: 180px; object-fit: contain; display: block;">
                  <div class="product-name"><strong>${result.name}</strong></div>
                  <div class="product-brand">${result.brand}</div>
                  <div class="product-price">${result.price}</div>
                </a>
                <button class="try-on-btn" type="button" data-idx="${idx}">Try it on</button>
              </div>
            `).join('')}
          </div>
        `;
        // Attach the event handler programmatically
        popup.querySelectorAll('.try-on-btn').forEach((btn, idx) => {
          btn.onclick = async (e) => {
            e.preventDefault();
            const product = data2.results[idx];
            const formData = new FormData();
            formData.append('clothing_image_url', product["image_url"]);
            formData.append('avatar_image_url', "https://tmpfiles.org/dl/26996531/e7d08d30-ec2b-46af-83af-48b989c02c29.png");
            
            // Create a popup overlay for the try-on result immediately
            let tryOnPopup = document.getElementById('try-on-popup');
            if (tryOnPopup) tryOnPopup.remove();
            tryOnPopup = document.createElement('div');
            tryOnPopup.id = 'try-on-popup';
            tryOnPopup.style.cssText = `
              position: fixed;
              top: 0; left: 0; width: 100vw; height: 100vh;
              background: rgba(30,30,30,0.55);
              z-index: 2147483647;
              display: flex; align-items: center; justify-content: center;
            `;
            tryOnPopup.innerHTML = `
              <div style="background: #fff; border-radius: 14px; box-shadow: 0 4px 24px rgba(0,0,0,0.18); padding: 24px 24px 16px 24px; display: flex; flex-direction: column; align-items: center; max-width: 90vw; max-height: 90vh;">
                <img src="https://tmpfiles.org/dl/26996531/e7d08d30-ec2b-46af-83af-48b989c02c29.png" alt="Try On Result" style="max-width: 320px; max-height: 420px; border-radius: 10px; box-shadow: 0 2px 12px rgba(0,0,0,0.10); margin-bottom: 18px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 18px;">
                  <svg width="24" height="24" viewBox="0 0 50 50">
                    <circle cx="25" cy="25" r="20" fill="none" stroke="#e60023" stroke-width="5" stroke-linecap="round" stroke-dasharray="31.4 31.4" transform="rotate(-90 25 25)">
                      <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.8s" repeatCount="indefinite"/>
                    </circle>
                  </svg>
                  <span style="color: #666; font-size: 14px; font-weight: 500;">Generating try-on result...</span>
                </div>
                <button style="padding: 6px 18px; border-radius: 6px; background: #e60023; color: #fff; border: none; font-size: 14px; font-weight: 600; cursor: pointer;">Close</button>
              </div>
            `;
            document.body.appendChild(tryOnPopup);

            // Attach close handler programmatically
            const closeBtn = tryOnPopup.querySelector('button');
            closeBtn.onclick = () => {
              tryOnPopup.remove();
              // Resume all videos on the page
              const videos = document.querySelectorAll('video');
              videos.forEach(video => {
                if (video.paused) {
                  video.play();
                }
              });
            };

            // Fetch the try-on result
            fetch('http://localhost:8000/try-clothing', {
              method: 'POST',
              body: formData
            })
              .then(response => response.json())
              .then(data => {
                const tryOnImg = data.url;
                // Update the image in the popup
                const imgElement = tryOnPopup.querySelector('img');
                imgElement.src = tryOnImg;
                // Remove the loading indicator
                const loadingDiv = tryOnPopup.querySelector('div');
                loadingDiv.remove();
              })
              .catch(error => {
                console.error("Error fetching try-clothing:", error);
                // Show error message
                const loadingDiv = tryOnPopup.querySelector('div');
                loadingDiv.innerHTML = '<span style="color: #e60023; font-size: 14px; font-weight: 500;">Error generating try-on result. Please try again.</span>';
              });
          };
        });
        // Move close button to the top
        const closeButton = popup.querySelector('.close-btn');
        closeButton.onclick = () => {
            popup.remove();
            // Remove the selected bounding box
            if (selectedBox) {
                selectedBox.remove();
            }
            // Remove the dark overlay if it exists
            const overlay = document.getElementById('bb-overlay-shadow');
            if (overlay) {
                overlay.remove();
            }
            // Resume all videos on the page
            const videos = document.querySelectorAll('video');
            videos.forEach(video => {
                if (video.paused) {
                    video.play();
                }
            });
        };
        // Remove loading spinner if present
        const loader2 = document.getElementById('popup-loader');
        if (loader2) loader2.remove();
        document.body.appendChild(popup);
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
  const pausedVideos = [];
  videos.forEach(video => {
    if (!video.paused) {
      video.pause();
      pausedVideos.push(video);
    }
  });
  return pausedVideos;
}

// Function to resume paused videos
function resumeVideos(pausedVideos) {
  pausedVideos.forEach(video => {
    video.play();
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
        }, (result) => {
          const pausedVideos = result[0].result;
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
                }).then(response => response.json()).then(data => ({ data, dataUrl, pausedVideos }));
              })
              .then(({ data, dataUrl, pausedVideos }) => {
                console.log('API Response:', data); // Debug log
                // Inject the drawing logic into the page context
                chrome.scripting.executeScript({
                  target: { tabId: tabs[0].id },
                  function: (boxes, dataUrl, pausedVideos) => {
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
                          border: 2.5px solid #fff;
                          background: rgba(255,255,255,0.13);
                          border-radius: 8px;
                          box-shadow: 0 8px 32px 0 rgba(0,0,0,0.22);
                          pointer-events: auto;
                          cursor: pointer;
                          transition: border-color 0.18s, border-width 0.18s, box-shadow 0.18s, background 0.18s;
                          box-sizing: border-box;
                        `;
                        // Add hover effect
                        boxElement.addEventListener('mouseover', () => {
                          boxElement.style.borderColor = '#e60023';
                          boxElement.style.borderWidth = '3px';
                          boxElement.style.background = 'rgba(255,255,255,0.18)';
                          boxElement.style.boxShadow = '0 12px 36px 0 rgba(230,0,35,0.22)';
                        });
                        boxElement.addEventListener('mouseout', () => {
                          boxElement.style.borderColor = '#fff';
                          boxElement.style.borderWidth = '2.5px';
                          boxElement.style.background = 'rgba(255,255,255,0.13)';
                          boxElement.style.boxShadow = '0 8px 32px 0 rgba(0,0,0,0.22)';
                        });

                        // Add click handler to crop and search
                        boxElement.addEventListener('click', async (event) => {
                          event.stopPropagation();
                          // Store reference to the selected box
                          const selectedBox = boxElement;
                          // Remove all other bounding boxes except the clicked one
                          const allBoxes = Array.from(container.children);
                          allBoxes.forEach(child => {
                            if (child !== boxElement) {
                              child.remove();
                            }
                          });

                          // Crop the image as before
                          const canvas = document.createElement('canvas');
                          const ctx = canvas.getContext('2d');
                          canvas.width = Math.round((x2 - x1) * scaleX);
                          canvas.height = Math.round((y2 - y1) * scaleY);
                          ctx.drawImage(img, x1, y1, x2 - x1, y2 - y1, 0, 0, canvas.width, canvas.height);

                          // Directly send to /search-products (skip /get-contour)
                          canvas.toBlob(async (blob) => {
                            // Show loading spinner
                            let loader = document.getElementById('popup-loader');
                            if (!loader) {
                              loader = document.createElement('div');
                              loader.id = 'popup-loader';
                              loader.style.cssText = `
                                position: fixed;
                                top: 36px;
                                right: 36px;
                                z-index: 2147483647;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                width: 48px;
                                height: 48px;
                                background: rgba(255,255,255,0.85);
                                border-radius: 50%;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.10);
                              `;
                              loader.innerHTML = `
                                <svg width="28" height="28" viewBox="0 0 50 50">
                                  <circle cx="25" cy="25" r="20" fill="none" stroke="#e60023" stroke-width="5" stroke-linecap="round" stroke-dasharray="31.4 31.4" transform="rotate(-90 25 25)">
                                    <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.8s" repeatCount="indefinite"/>
                                  </circle>
                                </svg>
                              `;
                              document.body.appendChild(loader);
                            }
                            // Send to /search-products
                            const formData2 = new FormData();
                            formData2.append('file', blob, 'cropped.png');
                            const response2 = await fetch('http://localhost:8000/search-products', {
                              method: 'POST',
                              body: formData2
                            });
                            const data2 = await response2.json();
                            console.log('Search results:', data2);

                            const popup = document.createElement('div');
                            popup.style.cssText = `
                              position: fixed;
                              top: 24px;
                              right: 24px;
                              width: 270px;
                              max-height: 88vh;
                              overflow-y: auto;
                              background: #f9f9fb;
                              padding: 8px 8px 18px 8px;
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
                              .custom-popup .try-on-btn {
                                margin-top: 0px;
                                margin-bottom: 2px;
                                padding: 5px 16px;
                                background: linear-gradient(90deg, #ff5858 0%, #f857a6 100%);
                                color: #fff;
                                border: none;
                                border-radius: 6px;
                                font-size: 12.5px;
                                font-weight: 600;
                                cursor: pointer;
                                box-shadow: 0 1px 4px rgba(248,87,166,0.08);
                                transition: background 0.18s, box-shadow 0.18s;
                                outline: none;
                                letter-spacing: 0.01em;
                              }
                              .custom-popup .try-on-btn:hover {
                                background: linear-gradient(90deg, #f857a6 0%, #ff5858 100%);
                                box-shadow: 0 2px 8px rgba(248,87,166,0.16);
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
                                ${data2.results.map((result, idx) => `
                                  <div style="display: flex; flex-direction: column; align-items: center;">
                                    <a href="${result.link}" target="_blank" class="image-card" style="display: flex; flex-direction: column; align-items: center; text-align: center; text-decoration: none; margin-bottom: 0; padding-bottom: 0;">
                                      <img src="${result.image_url}" class="product-img" style="max-width: 180px; max-height: 180px; object-fit: contain; display: block;">
                                      <div class="product-name"><strong>${result.name}</strong></div>
                                      <div class="product-brand">${result.brand}</div>
                                      <div class="product-price">${result.price}</div>
                                    </a>
                                    <button class="try-on-btn" type="button" data-idx="${idx}">Try it on</button>
                                  </div>
                                `).join('')}
                              </div>
                            `;
                            // Attach the event handler programmatically
                            popup.querySelectorAll('.try-on-btn').forEach((btn, idx) => {
                              btn.onclick = async (e) => {
                                e.preventDefault();
                                const product = data2.results[idx];
                                const formData = new FormData();
                                formData.append('clothing_image_url', product["image_url"]);
                                formData.append('avatar_image_url', "https://tmpfiles.org/dl/26996531/e7d08d30-ec2b-46af-83af-48b989c02c29.png");
                                
                                // Create a popup overlay for the try-on result immediately
                                let tryOnPopup = document.getElementById('try-on-popup');
                                if (tryOnPopup) tryOnPopup.remove();
                                tryOnPopup = document.createElement('div');
                                tryOnPopup.id = 'try-on-popup';
                                tryOnPopup.style.cssText = `
                                  position: fixed;
                                  top: 0; left: 0; width: 100vw; height: 100vh;
                                  background: rgba(30,30,30,0.55);
                                  z-index: 2147483647;
                                  display: flex; align-items: center; justify-content: center;
                                `;
                                tryOnPopup.innerHTML = `
                                  <div style="background: #fff; border-radius: 14px; box-shadow: 0 4px 24px rgba(0,0,0,0.18); padding: 24px 24px 16px 24px; display: flex; flex-direction: column; align-items: center; max-width: 90vw; max-height: 90vh;">
                                    <img src="https://tmpfiles.org/dl/26996531/e7d08d30-ec2b-46af-83af-48b989c02c29.png" alt="Try On Result" style="max-width: 320px; max-height: 420px; border-radius: 10px; box-shadow: 0 2px 12px rgba(0,0,0,0.10); margin-bottom: 18px;">
                                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 18px;">
                                      <svg width="24" height="24" viewBox="0 0 50 50">
                                        <circle cx="25" cy="25" r="20" fill="none" stroke="#e60023" stroke-width="5" stroke-linecap="round" stroke-dasharray="31.4 31.4" transform="rotate(-90 25 25)">
                                          <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.8s" repeatCount="indefinite"/>
                                        </circle>
                                      </svg>
                                      <span style="color: #666; font-size: 14px; font-weight: 500;">Generating try-on result...</span>
                                    </div>
                                    <button style="padding: 6px 18px; border-radius: 6px; background: #e60023; color: #fff; border: none; font-size: 14px; font-weight: 600; cursor: pointer;">Close</button>
                                  </div>
                                `;
                                document.body.appendChild(tryOnPopup);

                                // Attach close handler programmatically
                                const closeBtn = tryOnPopup.querySelector('button');
                                closeBtn.onclick = () => {
                                  tryOnPopup.remove();
                                  // Resume all videos on the page
                                  const videos = document.querySelectorAll('video');
                                  videos.forEach(video => {
                                    if (video.paused) {
                                      video.play();
                                    }
                                  });
                                };

                                // Fetch the try-on result
                                fetch('http://localhost:8000/try-clothing', {
                                  method: 'POST',
                                  body: formData
                                })
                                  .then(response => response.json())
                                  .then(data => {
                                    const tryOnImg = data.url;
                                    // Update the image in the popup
                                    const imgElement = tryOnPopup.querySelector('img');
                                    imgElement.src = tryOnImg;
                                    // Remove the loading indicator
                                    const loadingDiv = tryOnPopup.querySelector('div');
                                    loadingDiv.remove();
                                  })
                                  .catch(error => {
                                    console.error("Error fetching try-clothing:", error);
                                    // Show error message
                                    const loadingDiv = tryOnPopup.querySelector('div');
                                    loadingDiv.innerHTML = '<span style="color: #e60023; font-size: 14px; font-weight: 500;">Error generating try-on result. Please try again.</span>';
                                  });
                              };
                            });
                            // Move close button to the top
                            const closeButton = popup.querySelector('.close-btn');
                            closeButton.onclick = () => {
                                popup.remove();
                                // Remove the selected bounding box
                                if (selectedBox) {
                                    selectedBox.remove();
                                }
                                // Remove the dark overlay if it exists
                                const overlay = document.getElementById('bb-overlay-shadow');
                                if (overlay) {
                                    overlay.remove();
                                }
                                // Resume all videos on the page
                                const videos = document.querySelectorAll('video');
                                videos.forEach(video => {
                                    if (video.paused) {
                                        video.play();
                                    }
                                });
                            };
                            // Remove loading spinner if present
                            const loader2 = document.getElementById('popup-loader');
                            if (loader2) loader2.remove();
                            document.body.appendChild(popup);
                          }, 'image/png');
                        });

                        container.appendChild(boxElement);
                      });
                      document.body.appendChild(container);

                      // Add a dark overlay to the page to highlight bounding boxes
                      let overlay = document.getElementById('bb-overlay-shadow');
                      if (!overlay) {
                        overlay = document.createElement('div');
                        overlay.id = 'bb-overlay-shadow';
                        overlay.style.cssText = `
                          position: fixed;
                          top: 0;
                          left: 0;
                          width: 100vw;
                          height: 100vh;
                          background: rgba(30, 30, 30, 0.32);
                          z-index: 999998;
                          pointer-events: none;
                        `;
                        document.body.appendChild(overlay);
                      }
                    };
                    img.src = dataUrl;
                  },
                  args: [data.boxes || [], dataUrl, pausedVideos]
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
