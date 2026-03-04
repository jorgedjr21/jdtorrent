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
})