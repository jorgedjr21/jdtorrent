"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
try {
    electron_1.contextBridge.exposeInMainWorld('electronAPI', {
        platform: process.platform,
        torrent: {
            chooseFolder: () => electron_1.ipcRenderer.invoke('torrent:choose-folder'),
            addFile: (savePath) => electron_1.ipcRenderer.invoke('torrent:add-file', savePath),
            addMagnet: (uri, savePath) => electron_1.ipcRenderer.invoke('torrent:add-magnet', uri, savePath),
            list: () => electron_1.ipcRenderer.invoke('torrent:list'),
            pause: (infoHash) => electron_1.ipcRenderer.invoke('torrent:pause', infoHash),
            resume: (infoHash) => electron_1.ipcRenderer.invoke('torrent:resume', infoHash)
        }
    });
    console.log('preload OK, ipcRenderer:', typeof electron_1.ipcRenderer);
}
catch (e) {
    console.error('preload ERRO:', e);
}
