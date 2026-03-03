import { ipcMain, dialog, app } from "electron";
import path from 'path'
import fs from 'fs'

import { loadSettings } from "./settings";

type StoredTorrent = { magnetURI: string, savePath: string, addedAt: number}

let client: any

const getTorrentsStorePath = () => path.join(app.getPath('appData'), 'torrents.json')

function loadStoredTorrents(): StoredTorrent[] {
  try {
    return JSON.parse(fs.readFileSync(getTorrentsStorePath(), 'utf-8'))
  } catch {
    return []
  }
}

function saveStoredTorrents(list: StoredTorrent[]) {
  fs.writeFileSync(getTorrentsStorePath(), JSON.stringify(list,null, 2))
}

const torrentMeta = new Map<string, StoredTorrent>()
const pausedSet = new Set<string>()

function toTorrentInfo(t: any) {
  const progress = t.progress
  const meta = torrentMeta.get(t.infoHash)
  const isPaused = pausedSet.has(t.infoHash)
  let status: string
  if (isPaused) status = 'paused'
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
  }
}

function addTorrentPaused(source: string, savePath: string, addedAt: number): Promise<any> {
  return new Promise((resolve, reject) => {
    client.add(source, { path: savePath }, (torrent: any) => {
      torrent.on('error', reject)
      torrent.pause()
      pausedSet.add(torrent.infoHash)
      torrentMeta.set(torrent.infoHash, { addedAt, savePath, magnetURI: torrent.magnetURI })
      resolve(toTorrentInfo(torrent))
    })
  })
}

export function registerTorrentHandlers() {
  ipcMain.handle('torrent:add-file', async (_event, savePath: string) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Torrent', extensions: ['torrent'] }],
    })
    if (result.canceled || result.filePaths.length === 0) return null

    const addedAt = Date.now()
    const resolvedPath = savePath || loadSettings().downloadPath
    const info = await addTorrentPaused(result.filePaths[0], resolvedPath, addedAt)

    const meta = torrentMeta.get(info.infoHash)!
    const stored = loadStoredTorrents()
    stored.push({ magnetURI: meta.magnetURI, savePath: resolvedPath, addedAt })
    saveStoredTorrents(stored)

    return info
  })

  ipcMain.handle('torrent:add-magnet', async (_event, uri: string, savePath: string) => {
    const addedAt = Date.now()
    const resolvedPath = savePath || loadSettings().downloadPath
    const info = await addTorrentPaused(uri, resolvedPath, addedAt)

    const stored = loadStoredTorrents()
    stored.push({ magnetURI: uri, savePath: resolvedPath, addedAt })
    saveStoredTorrents(stored)

    return info
  })

  ipcMain.handle('torrent:list', async () => {
    return client.torrents.map(toTorrentInfo)
  })

  ipcMain.handle('torrent:pause', async (_event, infoHash: string) => {
    const torrent = client.torrents.find((t: any) => t.infoHash === infoHash)
    if (torrent) {
      torrent.pause()
      pausedSet.add(infoHash)
    }
  })

  ipcMain.handle('torrent:resume', async (_event, infoHash: string) => {
    const torrent = client.torrents.find((t: any) => t.infoHash === infoHash)
    if (torrent) {
      torrent.resume()
      pausedSet.delete(infoHash)
    }
  })
}

const dynamicImport = new Function('specifier', 'return import(specifier)') as (s: string) =>
  Promise<any>

export async function initTorrentClient() {
  const { default: WebTorrent } = await dynamicImport('webtorrent')
  client = new WebTorrent()

  const stored = loadStoredTorrents()
  for (const entry of stored) {
    try {
      await addTorrentPaused(entry.magnetURI, entry.savePath, entry.addedAt)
    } catch {}
  }
}