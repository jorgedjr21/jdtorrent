import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn() },
  dialog: { showOpenDialog: vi.fn() },
  app: { getPath: vi.fn(() => '/mock/appdata') }
}))
vi.mock('fs')
vi.mock('path')

import { toTorrentInfo, torrentMeta, pausedSet, pausedTorrentsInfo } from '../torrent'

const mockMeta = {
  magnetURI: 'magnet:?xt=urn:btih:abc123',
  savePath: '/downloads',
  addedAt: 1000,
  name: 'Test Torrent',
  totalSize: 1024 * 1024 * 1024,
  files: [{ name: 'file.mkv', path: '/downloads/file.mkv', length: 1024 * 1024 * 1024 }],
  progress: 0.5
}

const mockTorrent = (overrides = {}) => ({
  infoHash: 'abc123',
  name: 'Test Torrent',
  length: 1024 * 1024 * 1024,
  progress: 0.5,
  downloadSpeed: 1024,
  uploadSpeed: 512,
  numPeers: 5,
  timeRemaining: 60000,
  files: [{ name: 'file.mkv', path: '/downloads/file.mkv', length: 1024 * 1024 * 1024 }],
  ...overrides
})

beforeEach(() => {
  torrentMeta.clear()
  pausedSet.clear()
  pausedTorrentsInfo.clear()
  torrentMeta.set('abc123', mockMeta)
})

describe('toTorrentInfo', () => {
  it('returns downloading until progress < 1', () => {
    const info = toTorrentInfo(mockTorrent())
    expect(info.status).toBe('downloading')
    expect(info.progress).toBe(0.5)
    expect(info.downloadSpeed).toBe(1024)
  })

  it('returns seeding when progress === 1', () => {
    const info = toTorrentInfo(mockTorrent({ progress: 1 }))
    expect(info.status).toBe('seeding')
  })

  it('returns paused and 0 speed when stopped', () => {
    pausedSet.add('abc123')
    const info = toTorrentInfo(mockTorrent())
    expect(info.status).toBe('paused')
    expect(info.downloadSpeed).toBe(0)
    expect(info.uploadSpeed).toBe(0)
    expect(info.numPeers).toBe(0)
    expect(info.timeRemaining).toBe(0)
  })

  it('uses fallback for name/totalSize/files when metadata is no ready', () => {
    const info = toTorrentInfo(mockTorrent({ name: undefined, length: 0, files: [] }))
    expect(info.name).toBe('Test Torrent')
    expect(info.totalSize).toBe(1024 * 1024 * 1024)
    expect(info.files).toHaveLength(1)
  })

  it('uses meta progress as fallback when torrent.progress is 0', () => {
    const info = toTorrentInfo(mockTorrent({ progress: 0 }))
    expect(info.progress).toBe(0.5)
  })

  it('returns selectedFiles from meta when present', () => {
    torrentMeta.set('abc123', { ...mockMeta, selectedFiles: ['file.mkv'] })
    const info = toTorrentInfo(mockTorrent())
    expect(info.selectedFiles).toEqual(['file.mkv'])
  })

  it('returns undefined for selectedFiles when not set in meta', () => {
    const info = toTorrentInfo(mockTorrent())
    expect(info.selectedFiles).toBeUndefined()
  })
})

describe('toTorrentInfo — progress with selectedFiles', () => {
  const mp4Size = 1000
  const txtSize = 100

  const filesWithDownloaded = (mp4Downloaded: number, txtDownloaded = 0) => [
    { name: 'movie.mp4', path: '/movie.mp4', length: mp4Size, downloaded: mp4Downloaded },
    { name: 'info.txt',  path: '/info.txt',  length: txtSize,  downloaded: txtDownloaded },
  ]

  beforeEach(() => {
    torrentMeta.set('abc123', {
      ...mockMeta,
      selectedFiles: ['movie.mp4'],
      files: filesWithDownloaded(0),
    })
  })

  it('calculates progress based on selected file bytes, ignoring deselected files', () => {
    // overall torrent progress would be ~45% but selected file is 50%
    const t = mockTorrent({
      progress: 500 / (mp4Size + txtSize),
      files: filesWithDownloaded(500),
    })
    const info = toTorrentInfo(t)
    expect(info.progress).toBeCloseTo(0.5)
    expect(info.status).toBe('downloading')
  })

  it('returns seeding when selected file is fully downloaded even if overall torrent progress < 1', () => {
    // deselected txt file was never downloaded — WebTorrent reports ~90% overall
    const t = mockTorrent({
      progress: mp4Size / (mp4Size + txtSize),
      files: filesWithDownloaded(mp4Size),
    })
    const info = toTorrentInfo(t)
    expect(info.progress).toBe(1)
    expect(info.status).toBe('seeding')
  })

  it('returns 1 when meta.progress is 1 regardless of torrent.progress or f.downloaded', () => {
    // simulates the case where done event fired but WebTorrent still reports < 1
    torrentMeta.set('abc123', { ...mockMeta, selectedFiles: ['movie.mp4'], progress: 1 })
    const t = mockTorrent({
      progress: 0.9996,
      files: filesWithDownloaded(999), // slightly under full
    })
    const info = toTorrentInfo(t)
    expect(info.progress).toBe(1)
    expect(info.status).toBe('seeding')
  })

  it('falls back to torrent.progress when no selectedFiles are set', () => {
    torrentMeta.set('abc123', { ...mockMeta }) // no selectedFiles
    const t = mockTorrent({ progress: 0.75, files: filesWithDownloaded(750) })
    const info = toTorrentInfo(t)
    expect(info.progress).toBe(0.75)
  })
})