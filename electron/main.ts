import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';

const isDev = process.env.NODE_ENV === 'development';
let client: any;

const getStorePath = () => path.join(app.getPath('userData'), 'torrents.json')
type StoredTorrent = { magnetURI: string; savePath: string; addedAt: number }

function loadStored(): StoredTorrent[] {
  try {
    const data = fs.readFileSync(getStorePath(), 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

function saveStored(list: StoredTorrent[]) {
  fs.writeFileSync(getStorePath(), JSON.stringify(list, null, 2))
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

ipcMain.handle('torrent:choose-folder', async () => {
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
  const info = await addTorrentPaused(result.filePaths[0], savePath || app.getPath('downloads'),addedAt)

  const torrent = client.get(info.infoHash)
  const stored = loadStored()
  stored.push({ magnetURI: torrent.magnetURI, savePath: savePath || app.getPath('downloads'), addedAt})
  saveStored(stored)

  return info
});

ipcMain.handle('torrent:add-magnet', async (_event, uri: string, savePath: string) => {
  const addedAt = Date.now()
  const info = await addTorrentPaused(uri, savePath || app.getPath('downloads'), addedAt)

  const stored = loadStored()
  stored.push({ magnetURI: uri, savePath: savePath || app.getPath('downloads'), addedAt })
  saveStored(stored)

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

  const stored = loadStored()
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