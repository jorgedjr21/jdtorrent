import { ipcMain, dialog, app } from "electron";
import path from 'path'
import fs from 'fs'

import { loadSettings } from "./settings";

type StoredTorrent = { 
  magnetURI: string 
  savePath: string 
  addedAt: number
  infoHash: string
  name: string
  totalSize: number
  files: { name: string, path: string, length: number}[]
  progress: number
}

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

export const torrentMeta = new Map<string, {
  magnetURI: string
  savePath: string
  addedAt: number
  name?: string
  totalSize?: number
  files?: { name:string, path: string, length: number }[]
  progress?: number
}>()
export const pausedSet = new Set<string>()
export const pausedTorrentsInfo = new Map<string, any>()

export function toTorrentInfo(t: any) {
  const meta = torrentMeta.get(t.infoHash)
  const isPaused = pausedSet.has(t.infoHash)
  let status: string
  const progress = t.progress || meta?.progress || 0
  if (isPaused) status = 'paused'
  else if (progress === 1) status = 'seeding'
  else status = 'downloading'
  return {
    infoHash: t.infoHash,
    name: t.name || meta?.name || '',
    totalSize: t.length || meta?.totalSize || 0,
    progress,
    downloadSpeed: isPaused ? 0 : t.downloadSpeed,
    uploadSpeed: isPaused ? 0 : t.uploadSpeed,
    numPeers: isPaused ? 0 : t.numPeers,
    status,
    files:  (t.files?.length > 0)
    ? t.files.map((f: any) => ({ name: f.name, path: f.path, length: f.length }))
    : (meta?.files || []),
    addedAt: meta?.addedAt ?? Date.now(),
    timeRemaining: isPaused ? 0 :t.timeRemaining,
  }
}

function addTorrentPaused(source: string, savePath: string, addedAt: number): Promise<any> {
  return new Promise((resolve, reject) => {
    client.add(source, { path: savePath }, (torrent: any) => {
      torrent.on('error', reject)
      const { infoHash, magnetURI } = torrent
      torrentMeta.set(infoHash, {
        magnetURI, savePath, addedAt,
        name: torrent.name,
        totalSize: torrent.length,
        files: (torrent.files || []).map((f: any) => ({name: f.name, path: f.path, length: f.length})),
        progress: torrent.progress
      })
      pausedSet.add(infoHash)
      const info = toTorrentInfo(torrent)
      pausedTorrentsInfo.set(infoHash, info)
      torrent.destroy({destroyStore: false}, () => resolve(info))
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
    stored.push({ 
      magnetURI: meta.magnetURI, 
      savePath: resolvedPath, 
      addedAt,
      infoHash: info.infoHash,
      name: info.name,
      totalSize: info.totalSize,
      files: info.files,
      progress: info.progress 
    })
    saveStoredTorrents(stored)

    return info
  })

  ipcMain.handle('torrent:add-magnet', async (_event, uri: string, savePath: string) => {
    const addedAt = Date.now()
    const resolvedPath = savePath || loadSettings().downloadPath
    const info = await addTorrentPaused(uri, resolvedPath, addedAt)

    const stored = loadStoredTorrents()
    stored.push({ 
      magnetURI: uri, 
      savePath: resolvedPath, 
      addedAt,
      infoHash: info.infoHash,
      name: info.name,
      totalSize: info.totalSize,
      files: info.files,
      progress: info.progress 
    })
    saveStoredTorrents(stored)

    return info
  })

  ipcMain.handle('torrent:list', async () => {
   const active = client.torrents.map(toTorrentInfo)
   const paused = Array.from(pausedTorrentsInfo.values())
   return [...active, ...paused]
  })

  ipcMain.handle('torrent:pause', async (_event, infoHash: string) => {
    const torrent = client.torrents.find((t: any) => t.infoHash === infoHash)
    if (torrent) {
      pausedSet.add(infoHash)
      const info = {
        ...toTorrentInfo(torrent),
        downloadSpeed: 0,
        uploadSpeed: 0,
        numPeers: 0,
        timeRemaining: 0
      }
      pausedTorrentsInfo.set(infoHash, info)
      const existingMeta = torrentMeta.get(infoHash)
      if (existingMeta) torrentMeta.set(infoHash, { ...existingMeta, progress: info.progress })
      await new Promise<void>(resolve => torrent.destroy({destroyStore: false}, resolve))
      const stored = loadStoredTorrents()
      const idx = stored.findIndex(s => s.infoHash == infoHash)
      if(idx >= 0) {
        stored[idx].progress = info.progress
        saveStoredTorrents(stored)
      }
    }
  })

  ipcMain.handle('torrent:resume', async (_event, infoHash: string) => {
    const meta = torrentMeta.get(infoHash)
    if(meta) {
      pausedSet.delete(infoHash)
      pausedTorrentsInfo.delete(infoHash)
      const alreadyActive = client.torrents.find((t: any) => t.infoHash === infoHash)
      if (!alreadyActive) {
        client.add(meta.magnetURI, { path: meta.savePath })
      }
    }
  })
}

const dynamicImport = new Function('specifier', 'return import(specifier)') as (s: string) =>
  Promise<any>

export async function initTorrentClient() {
  const { default: WebTorrent } = await dynamicImport('webtorrent')
  client = new WebTorrent()

  for(const entry of loadStoredTorrents()) {
    pausedSet.add(entry.infoHash)
    torrentMeta.set(entry.infoHash, {
      magnetURI: entry.magnetURI,
      savePath: entry.savePath,
      addedAt: entry.addedAt,
      name: entry.name,
      totalSize: entry.totalSize,
      files: entry.files,
      progress: entry.progress
    })
    pausedTorrentsInfo.set(entry.infoHash, {
      infoHash: entry.infoHash,
      name: entry.name,
      totalSize: entry.totalSize,
      progress: entry.progress,
      downloadSpeed: 0,
      uploadSpeed: 0,
      numPeers: 0,
      status: 'paused',
      files: entry.files,
      addedAt: entry.addedAt,
      timeRemaining: 0
    })
  }
}