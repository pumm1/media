const { contextBridge, ipcRenderer } = require('electron');

// Expose ipcRenderer to the renderer process through contextBridge
contextBridge.exposeInMainWorld('electronAPI', {
  openFile: (filePath) => ipcRenderer.send('open-file-or-folder', filePath),
});
