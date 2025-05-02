# Chrome Screenshot Capture Extension

This Chrome extension allows you to capture screenshots of the current tab and send them to a backend server.

## Setup Instructions

### Backend Server
1. Install Node.js if you haven't already
2. Navigate to the project directory
3. Run `npm install` to install dependencies
4. Run `npm start` to start the server
5. The server will run on http://localhost:3000

### Chrome Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" and select the directory containing the extension files
4. The extension icon should appear in your Chrome toolbar

## Usage
1. Click the extension icon in your Chrome toolbar
2. Click the "Capture Screenshot" button
3. The screenshot will be automatically captured and sent to the backend server
4. The screenshot will be saved in the `uploads` directory on the server

## Files Structure
- `manifest.json` - Extension configuration
- `popup.html` - Extension popup interface
- `popup.js` - Extension popup logic
- `background.js` - Extension background script
- `server.js` - Backend server
- `package.json` - Backend dependencies

## Note
Make sure to update the `backendUrl` in `popup.js` if your backend server is running on a different URL.