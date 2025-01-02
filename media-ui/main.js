import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';


// Dynamically import electron-is-dev (ESM syntax)
const isDev = await import('electron-is-dev');

// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 2000,
    height: 1800,
    fullscreen: true,  // This makes the app open in full-screen mode
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,   // Recommended for security
      enableRemoteModule: false, // Security measure
      nodeIntegration: false,    // Disable nodeIntegration in renderer
    },
  });

  // Load the React app in dev or production mode
  mainWindow.loadURL(
    isDev.default
      ? 'http://localhost:3000'  // In development, load from React dev server
      : `file://${path.join(__dirname, 'build', 'index.html')}`  // In production, load the React build
  );
}

app.on('ready', createWindow);


ipcMain.on('open-file-or-folder', (event, filePath) => {
  shell.openPath(filePath);  // Opens the file/folder using the system's default application
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
