export interface ElectronAPI {
    openFile: (filePath: string) => void;
  }
  
  declare global {
    interface Window {
      electronAPI: ElectronAPI;
    }
  }
  