const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;
let splashWindow;

function createSplash() {
  splashWindow = new BrowserWindow({
    width: 600,
    height: 360,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    center: true,
    resizable: false,
    show: false,
  });
  splashWindow.loadFile(path.join(__dirname, 'dist', 'splash.html'));
  splashWindow.once('ready-to-show', () => splashWindow.show());
}

function createMain() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    icon: path.join(__dirname, 'icons', 'app-icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const url = process.env.ELECTRON_START_URL || 'http://localhost:3000';
  mainWindow.loadURL(url).catch((err) => console.error('Failed to load URL', err));

  mainWindow.once('ready-to-show', () => {
    if (splashWindow) {
      splashWindow.close();
      splashWindow = null;
    }
    mainWindow.show();
  });
}

app.whenReady().then(() => {
  createSplash();
  createMain();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createMain();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
