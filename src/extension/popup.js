document.getElementById('captureBtn').addEventListener('click', async () => {
  const statusDiv = document.getElementById('status');
  const previewImg = document.getElementById('preview');
  
  try {
    // Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Capture the visible tab
    const dataUrl = await chrome.tabs.captureVisibleTab();
    
    // Display the screenshot in the popup
    previewImg.src = dataUrl;
    previewImg.style.display = 'block';
    
    // Show success message
    statusDiv.textContent = 'Screenshot captured successfully!';
    statusDiv.className = 'success';
    
    // Mock API call (for testing)
    console.log('Mock API call - Screenshot would be sent to backend here');
    
  } catch (error) {
    statusDiv.textContent = `Error: ${error.message}`;
    statusDiv.className = 'error';
    console.error('Error:', error);
  }
}); 