import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';

const isDev = process.env.NODE_ENV === 'development';
let client: any;

const getTorrentsStorePath = () => path.join(app.getPath('userData'), 'torrents.json')
const getSettingsPath = () => path.join(app.getPath('appData'), 'settings.json')
type StoredTorrent = { magnetURI: string; savePath: string; addedAt: number }
type AppSettings = { downloadPath: string }

function loadStoredTorrents(): StoredTorrent[] {
  try {
    const data = fs.readFileSync(getTorrentsStorePath(), 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

function saveStoredTorrents(list: StoredTorrent[]) {
  fs.writeFileSync(getTorrentsStorePath(), JSON.stringify(list, null, 2))
}

function loadSettings(): AppSettings {
  try {
    return JSON.parse(fs.readFileSync(getSettingsPath(), 'utf-8'))
  } catch {
    return { downloadPath: app.getPath('downloads') }
  }
}

function saveSettings(s: AppSettings) {
  fs.writeFileSync(getSettingsPath(), JSON.stringify(s, null, 2))
}

const torrentMeta = new Map<string, { addedAt: number, savePath: string}>()
const pausedSet = new Set<string>()

function toTorrentInfo(t: any) {
  const progress = t.progress;
  const meta = torrentMeta.get(t.infoHash)
  const isPaused = pausedSet.has(t.infoHash)
  let status: string
  if(isPaused) status = 'paused'
  else if (progress === 1) status = 'seeding'
  else status = 'downloading'
  return {
    infoHash: t.infoHash,
    name: t.name,
    totalSize: t.length,
    progress,
    downloadSpeed: t.downloadSpeed,
    uploadSpeed: t.uploadSpeed,
    numPeers: t.numPeers,
    status,
    files: t.files.map((f: any) => ({ name: f.name, path: f.path, length: f.length })),
    addedAt: meta?.addedAt ?? Date.now(),
    timeRemaining: t.timeRemaining,
  };
}

function addTorrentPaused(source: string, savePath: string, addedAt: number): Promise<any> {
  return new Promise((resolve, reject) => {
    client.add(source, { path: savePath}, (torrent: any) => {
      torrent.on('error', reject)
      torrent.files.forEach( (f: any) => f.deselect());
      pausedSet.add(torrent.infoHash)
      torrentMeta.set(torrent.infoHash, {addedAt, savePath})
      resolve(toTorrentInfo(torrent))
    })
  })
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.on('did-finish-load', () => {
      win.webContents.openDevTools();
    });
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

ipcMain.handle('settings:get', async () => loadSettings())
ipcMain.handle('settings:set', async (_event, s: AppSettings ) => saveSettings(s))

ipcMain.handle('settings:choose-folder', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('torrent:add-file', async (_event, savePath: string) => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Torrent', extensions: ['torrent'] }],
  })
  if (result.canceled || result.filePaths.length === 0) return null

  const addedAt = Date.now()
  const info = await addTorrentPaused(result.filePaths[0], savePath || loadSettings().downloadPath, addedAt)

  const torrent = client.get(info.infoHash)
  const stored = loadStoredTorrents()
  stored.push({ magnetURI: torrent.magnetURI, savePath: savePath || loadSettings().downloadPath, addedAt})
  saveStoredTorrents(stored)

  return info
});

ipcMain.handle('torrent:add-magnet', async (_event, uri: string, savePath: string) => {
  const addedAt = Date.now()
  const info = await addTorrentPaused(uri, savePath || loadSettings().downloadPath, addedAt)

  const stored = loadStoredTorrents()
  stored.push({ magnetURI: uri, savePath: savePath || loadSettings().downloadPath, addedAt })
  saveStoredTorrents(stored)

  return info
});

ipcMain.handle('torrent:list', async () => {
  return client.torrents.map(toTorrentInfo);
});

ipcMain.handle('torrent:pause', async (_event, infoHash: string) => {
  const torrent = client.torrents.find((t: any) => t.infoHash == infoHash)
  if(torrent) {
    torrent.files.forEach((f: any) => f.deselect())
    pausedSet.add(infoHash)
  }
})

ipcMain.handle('torrent:resume', async (_event, infoHash: string) => {
  const torrent = client.torrents.find((t: any) => t.infoHash == infoHash)
  if (torrent && torrent.files) {
    torrent.files.forEach((f: any) => f.select())
    pausedSet.delete(torrent.infoHash)
  }
})

const dynamicImport = new Function('specifier', 'return import(specifier)') as (s: string) => Promise<any>;

app.whenReady().then(async () => {
  const { default: WebTorrent } = await dynamicImport('webtorrent');
  client = new WebTorrent();

  const stored = loadStoredTorrents()
  for(const entry of stored) {
    try {
      await addTorrentPaused(entry.magnetURI, entry.savePath, entry.addedAt)
    } catch {}
  }
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});