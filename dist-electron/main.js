"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const isDev = process.env.NODE_ENV === 'development';
let client;
const getTorrentsStorePath = () => path_1.default.join(electron_1.app.getPath('userData'), 'torrents.json');
const getSettingsPath = () => path_1.default.join(electron_1.app.getPath('appData'), 'settings.json');
function loadStoredTorrents() {
    try {
        const data = fs_1.default.readFileSync(getTorrentsStorePath(), 'utf-8');
        return JSON.parse(data);
    }
    catch {
        return [];
    }
}
function saveStoredTorrents(list) {
    fs_1.default.writeFileSync(getTorrentsStorePath(), JSON.stringify(list, null, 2));
}
function loadSettings() {
    try {
        return JSON.parse(fs_1.default.readFileSync(getSettingsPath(), 'utf-8'));
    }
    catch {
        return { downloadPath: electron_1.app.getPath('downloads') };
    }
}
function saveSettings(s) {
    fs_1.default.writeFileSync(getSettingsPath(), JSON.stringify(s, null, 2));
}
const torrentMeta = new Map();
const pausedSet = new Set();
function toTorrentInfo(t) {
    const progress = t.progress;
    const meta = torrentMeta.get(t.infoHash);
    const isPaused = pausedSet.has(t.infoHash);
    let status;
    if (isPaused)
        status = 'paused';
    else if (progress === 1)
        status = 'seeding';
    else
        status = 'downloading';
    return {
        infoHash: t.infoHash,
        name: t.name,
        totalSize: t.length,
        progress,
        downloadSpeed: t.downloadSpeed,
        uploadSpeed: t.uploadSpeed,
        numPeers: t.numPeers,
        status,
        files: t.files.map((f) => ({ name: f.name, path: f.path, length: f.length })),
        addedAt: meta?.addedAt ?? Date.now(),
        timeRemaining: t.timeRemaining,
    };
}
function addTorrentPaused(source, savePath, addedAt) {
    return new Promise((resolve, reject) => {
        client.add(source, { path: savePath }, (torrent) => {
            torrent.on('error', reject);
            torrent.files.forEach((f) => f.deselect());
            pausedSet.add(torrent.infoHash);
            torrentMeta.set(torrent.infoHash, { addedAt, savePath });
            resolve(toTorrentInfo(torrent));
        });
    });
}
function createWindow() {
    const win = new electron_1.BrowserWindow({
        width: 1920,
        height: 1080,
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
    });
    if (isDev) {
        win.loadURL('http://localhost:5173');
        win.webContents.on('did-finish-load', () => {
            win.webContents.openDevTools();
        });
    }
    else {
        win.loadFile(path_1.default.join(__dirname, '../dist/index.html'));
    }
}
electron_1.ipcMain.handle('settings:get', async () => loadSettings());
electron_1.ipcMain.handle('settings:set', async (_event, s) => saveSettings(s));
electron_1.ipcMain.handle('settings:choose-folder', async () => {
    const result = await electron_1.dialog.showOpenDialog({ properties: ['openDirectory'] });
    return result.canceled ? null : result.filePaths[0];
});
electron_1.ipcMain.handle('torrent:add-file', async (_event, savePath) => {
    const result = await electron_1.dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Torrent', extensions: ['torrent'] }],
    });
    if (result.canceled || result.filePaths.length === 0)
        return null;
    const addedAt = Date.now();
    const info = await addTorrentPaused(result.filePaths[0], savePath || loadSettings().downloadPath, addedAt);
    const torrent = client.get(info.infoHash);
    const stored = loadStoredTorrents();
    stored.push({ magnetURI: torrent.magnetURI, savePath: savePath || loadSettings().downloadPath, addedAt });
    saveStoredTorrents(stored);
    return info;
});
electron_1.ipcMain.handle('torrent:add-magnet', async (_event, uri, savePath) => {
    const addedAt = Date.now();
    const info = await addTorrentPaused(uri, savePath || loadSettings().downloadPath, addedAt);
    const stored = loadStoredTorrents();
    stored.push({ magnetURI: uri, savePath: savePath || loadSettings().downloadPath, addedAt });
    saveStoredTorrents(stored);
    return info;
});
electron_1.ipcMain.handle('torrent:list', async () => {
    return client.torrents.map(toTorrentInfo);
});
electron_1.ipcMain.handle('torrent:pause', async (_event, infoHash) => {
    const torrent = client.torrents.find((t) => t.infoHash == infoHash);
    if (torrent) {
        torrent.files.forEach((f) => f.deselect());
        pausedSet.add(infoHash);
    }
});
electron_1.ipcMain.handle('torrent:resume', async (_event, infoHash) => {
    const torrent = client.torrents.find((t) => t.infoHash == infoHash);
    if (torrent && torrent.files) {
        torrent.files.forEach((f) => f.select());
        pausedSet.delete(torrent.infoHash);
    }
});
const dynamicImport = new Function('specifier', 'return import(specifier)');
electron_1.app.whenReady().then(async () => {
    const { default: WebTorrent } = await dynamicImport('webtorrent');
    client = new WebTorrent();
    const stored = loadStoredTorrents();
    for (const entry of stored) {
        try {
            await addTorrentPaused(entry.magnetURI, entry.savePath, entry.addedAt);
        }
        catch { }
    }
    createWindow();
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
