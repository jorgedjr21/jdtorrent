import { ipcMain, dialog, app } from "electron";
import path from 'path'
import fs from 'fs'

import { loadSettings } from './settings';

type StoredTorrent = { 
  magnetURI: string 
  savePath: string 
  addedAt: number
  infoHash: string
  name: string
  totalSize: number
  files: { name: string, path: string, length: number}[]
  progress: number,
  selectedFiles?: string[],
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
  progress?: number,
  selectedFiles?: string[]
}>()
export const pausedSet = new Set<string>()
export const pausedTorrentsInfo = new Map<string, any>()

function mapFiles(files: any[]): { name: string; path: string; length: number }[] {
  return (files || []).map((f) => ({ name: f.name, path: f.path, length: f.length }))
}

function getPiecesMap(torrent: any, buckets = 200): number[] {
  // pieces[i] === null  → complete
  // pieces[i] !== null  → not complete (pending or downloading)
  // wire.requests       → pieces actively being fetched from peers right now
  if (!torrent.pieces || torrent.pieces.length === 0) return []
  const total = torrent.pieces.length

  const active = new Set<number>()
  ;(torrent.wires || []).forEach((wire: any) => {
    ;(wire.requests || []).forEach((req: any) => active.add(req.piece))
  })

  const state = (i: number): number => {
    if (torrent.pieces[i] === null) return 1
    if (active.has(i)) return 0.5
    return 0
  }

  if (total <= buckets) return Array.from({ length: total }, (_, i) => state(i))

  const sums = new Array(buckets).fill(0)
  const counts = new Array(buckets).fill(0)
  const bucketSize = total / buckets

  for (let i = 0; i < total; i++) {
    const b = Math.min(Math.floor(i / bucketSize), buckets - 1)
    counts[b]++
    sums[b] += state(i)
  }

  return sums.map((s, i) => counts[i] > 0 ? s / counts[i] : 0)
}

function calculateProgress(torrent: any, selectedFiles?: string[]): number {
  if (!selectedFiles || selectedFiles.length === 0 || !torrent.files?.length) {
    return torrent.progress
  }
  const selected = torrent.files.filter((f: any) => selectedFiles.includes(f.name))
  if (selected.length === 0) return torrent.progress
  const totalBytes = selected.reduce((sum: number, f: any) => sum + f.length, 0)
  const downloadedBytes = selected.reduce((sum: number, f: any) => sum + f.downloaded, 0)
  return totalBytes > 0 ? downloadedBytes / totalBytes : 0
}

export function toTorrentInfo(t: any) {
  const meta = torrentMeta.get(t.infoHash)
  const isPaused = pausedSet.has(t.infoHash)
  let status: string
  const progress = meta?.progress === 1 ? 1 : (calculateProgress(t, meta?.selectedFiles) || meta?.progress || 0)
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
    files: t.files?.length > 0 ? mapFiles(t.files) : (meta?.files || []),
    addedAt: meta?.addedAt ?? Date.now(),
    timeRemaining: isPaused ? 0 : t.timeRemaining,
    selectedFiles: meta?.selectedFiles,
    piecesMap: isPaused ? [] : getPiecesMap(t)
  }
}

function addTorrentPaused(source: string, savePath: string, addedAt: number, selectedFiles?: string[]): Promise<any> {
  return new Promise((resolve, reject) => {
    client.add(source, { path: savePath }, (torrent: any) => {
      torrent.on('error', reject)
      const { infoHash, magnetURI } = torrent
      torrentMeta.set(infoHash, {
        magnetURI, savePath, addedAt,
        name: torrent.name,
        totalSize: torrent.length,
        files: mapFiles(torrent.files),
        progress: torrent.progress,
        selectedFiles: selectedFiles
      })
      pausedSet.add(infoHash)
      const info = toTorrentInfo(torrent)
      pausedTorrentsInfo.set(infoHash, info)
      torrent.destroy({destroyStore: false}, () => resolve(info))
    })
  })
}

export function deleteTorrentFiles(meta: { savePath: string, files?: { path: string }[] }) {
  if (!meta.files || meta.files.length === 0) return
  const firstFile = meta.files[0].path
  const resolvedFirst = path.isAbsolute(firstFile) ? firstFile : path.join(meta.savePath, firstFile)
  const torrentFolder = path.dirname(resolvedFirst)

  if (torrentFolder !== meta.savePath) {
    fs.rmSync(torrentFolder, { recursive: true, force: true })
  } else {
    for (const file of meta.files) {
      const filePath = path.isAbsolute(file.path) ? file.path : path.join(meta.savePath, file.path)
      try { fs.rmSync(filePath, { force: true }) } catch { /* file may not exist */ }
    }
  }
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

  ipcMain.handle('torrent:add-magnet', async (_event, uri: string, savePath: string, selectedFiles?: string[]) => {
    const addedAt = Date.now()
    const resolvedPath = savePath || loadSettings().downloadPath
    const info = await addTorrentPaused(uri, resolvedPath, addedAt, selectedFiles)

    const stored = loadStoredTorrents()
    stored.push({ 
      magnetURI: uri, 
      savePath: resolvedPath, 
      addedAt,
      infoHash: info.infoHash,
      name: info.name,
      totalSize: info.totalSize,
      files: info.files,
      progress: info.progress ,
      selectedFiles
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
        client.add(meta.magnetURI, { path: meta.savePath }, (torrent: any) => {
          if (meta.selectedFiles && meta.selectedFiles.length > 0) {
            // Deselect unwanted files first, then re-select wanted files.
            // The re-select ensures boundary pieces shared between selected and
            // deselected files stay in the download queue.
            torrent.files.forEach((f: any) => {
              if (!meta.selectedFiles!.includes(f.name)) f.deselect()
            })
            torrent.files.forEach((f: any) => {
              if (meta.selectedFiles!.includes(f.name)) f.select()
            })
          }
          torrent.on('done', () => {
            const existingMeta = torrentMeta.get(infoHash)
            if (existingMeta) torrentMeta.set(infoHash, { ...existingMeta, progress: 1 })
            const stored = loadStoredTorrents()
            const idx = stored.findIndex(s => s.infoHash === infoHash)
            if (idx >= 0) {
              stored[idx].progress = 1
              saveStoredTorrents(stored)
            }
          })
        })
      }
    }
  })

  ipcMain.handle('torrent:remove', async (_event, infoHash: string, deleteFiles: boolean) => {
    const meta = torrentMeta.get(infoHash)
    const activeTorrent = client.torrents.find((t: any) => t.infoHash === infoHash)

    if(activeTorrent) {
      await new Promise<void> (resolve => activeTorrent.destroy({destroyStore: deleteFiles}, resolve))
    }  else if (deleteFiles && meta?.files && meta.files.length > 0) {
        deleteTorrentFiles(meta)
      }

    pausedSet.delete(infoHash)
    pausedTorrentsInfo.delete(infoHash)
    torrentMeta.delete(infoHash)

    saveStoredTorrents(loadStoredTorrents().filter( s => s.infoHash !== infoHash))
  })

  ipcMain.handle('torrent:peek-files', async (_event, uri: string) => {
    return new Promise((resolve, reject) => {
      client.add(uri, (torrent: any) => {
        torrent.on('error', reject)
        const files = mapFiles(torrent.files)
        torrent.destroy({ destroyStore: false }, () => resolve(files))
      })
    })
  })
}

const dynamicImport = new Function('specifier', 'return import(specifier)') as (s: string) =>
  Promise<any>

export async function initTorrentClient() {
  const { default: WebTorrent } = await dynamicImport('webtorrent')
  const { torrentPort } = loadSettings()
  client = new WebTorrent(torrentPort ? { torrentPort } : {})
  client.on('error', (err: any) => {
    console.error('WebTorrent error:', err)
  })
  populateFromStoredTorrents(loadStoredTorrents())
}

export function populateFromStoredTorrents(entries: StoredTorrent[]) {
  for (const entry of entries) {
    pausedSet.add(entry.infoHash)
    torrentMeta.set(entry.infoHash, {
      magnetURI: entry.magnetURI,
      savePath: entry.savePath,
      addedAt: entry.addedAt,
      name: entry.name,
      totalSize: entry.totalSize,
      files: entry.files,
      progress: entry.progress,
      selectedFiles: entry.selectedFiles
    })
    pausedTorrentsInfo.set(entry.infoHash, {
      infoHash: entry.infoHash,
      name: entry.name,
      totalSize: entry.totalSize,
      progress: entry.progress,
      downloadSpeed: 0,
      uploadSpeed: 0,
      numPeers: 0,
      status: entry.progress === 1 ? 'seeding' : 'paused',
      files: entry.files,
      addedAt: entry.addedAt,
      timeRemaining: 0,
      selectedFiles: entry.selectedFiles
    })
  }
}
