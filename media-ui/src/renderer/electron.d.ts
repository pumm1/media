export interface ElectronAPI {
    openFile: (filePath: string) => void;
    isElectron: boolean
  }
  
  declare global {
    interface Window {
      electronAPI: ElectronAPI;
    }
  }
  