import { contextBridge, ipcRenderer } from 'electron';

  try {
    contextBridge.exposeInMainWorld('electronAPI', {
      platform: process.platform,
      app: {
        quit: () => ipcRenderer.invoke('app:quit')
      },
      torrent: {
        addFile: (savePath: string) => ipcRenderer.invoke('torrent:add-file', savePath),
        addMagnet: (uri: string, savePath: string, selectedFiles?: string[]) => ipcRenderer.invoke('torrent:add-magnet', uri,savePath, selectedFiles),
        peekFiles: (uri: string) =>ipcRenderer.invoke('torrent:peek-files', uri),
        list: () => ipcRenderer.invoke('torrent:list'),
        pause: (infoHash: string) => ipcRenderer.invoke('torrent:pause', infoHash),
        resume: (infoHash: string) => ipcRenderer.invoke('torrent:resume', infoHash),
        remove: (infoHash: string, deleteFiles: boolean) => ipcRenderer.invoke('torrent:remove', infoHash, deleteFiles)
      },
      settings: {
        get: () => ipcRenderer.invoke('settings:get'),
        set: (s: { downloadPath: string}) => ipcRenderer.invoke('settings:set', s),
        chooseFolder: () => ipcRenderer.invoke('settings:choose-folder')
      },
      updater: {
        onUpdateAvailable: (cb: (version: string) => void) =>
          ipcRenderer.on('updater:update-available', (_e, version) => cb(version)),
        onUpdateDownloaded: (cb: () => void) =>
          ipcRenderer.on('updater:update-downloaded', () => cb()),
        install: () => ipcRenderer.send('updater:install')
      }
    });
    console.log('preload OK, ipcRenderer:', typeof ipcRenderer);
  } catch (e) {
    console.error('preload ERRO:', e);
  }
