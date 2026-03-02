import { contextBridge, ipcRenderer } from 'electron';

  try {
    contextBridge.exposeInMainWorld('electronAPI', {
      platform: process.platform,
      torrent: {
        chooseFolder: () => ipcRenderer.invoke('torrent:choose-folder'),
        addFile: (savePath: string) => ipcRenderer.invoke('torrent:add-file', savePath),
        addMagnet: (uri: string, savePath: string) => ipcRenderer.invoke('torrent:add-magnet', uri,savePath),
        list: () => ipcRenderer.invoke('torrent:list'),
        pause: (infoHash: string) => ipcRenderer.invoke('torrent:pause', infoHash),
        resume: (infoHash: string) => ipcRenderer.invoke('torrent:resume', infoHash)
      }
    });
    console.log('preload OK, ipcRenderer:', typeof ipcRenderer);
  } catch (e) {
    console.error('preload ERRO:', e);
  }