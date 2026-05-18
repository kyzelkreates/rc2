const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, 'icon-512.png'),
    title: 'Private AI Digital Vault OS',
    backgroundColor: '#07070a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });
  win.loadFile('index.html');
  // Remove default menu bar
  win.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
