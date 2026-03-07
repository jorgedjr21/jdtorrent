import { describe, it, expect, beforeEach, vi } from 'vitest'

  vi.mock('electron', () => ({
    ipcMain: { handle: vi.fn() },
    dialog: { showOpenDialog: vi.fn() },
    app: { getPath: vi.fn(() => '/mock/appdata') }
  }))

  vi.mock('path', () => ({
    default: { join: (...args: string[]) => args.join('/') }
  }))

  vi.mock('fs', () => ({
    default: { readFileSync: vi.fn(), writeFileSync: vi.fn() }
  }))

  import { populateFromStoredTorrents, pausedTorrentsInfo, pausedSet, torrentMeta } from '../torrent'

  const completedTorrent = {
    infoHash: 'hash1',
    magnetURI: 'magnet:?xt=urn:btih:hash1',
    savePath: '/downloads',
    addedAt: 1000,
    name: 'Caveat (2020)',
    totalSize: 1_500_000_000,
    files: [{ name: 'caveat.mkv', path: '/downloads/caveat.mkv', length: 1_500_000_000 }],
    progress: 1
  }

  const incompleteTorrent = {
    infoHash: 'hash2',
    magnetURI: 'magnet:?xt=urn:btih:hash2',
    savePath: '/downloads',
    addedAt: 2000,
    name: 'The Witch (2015)',
    totalSize: 1_400_000_000,
    files: [{ name: 'witch.mkv', path: '/downloads/witch.mkv', length: 1_400_000_000 }],
    progress: 0.31
  }

  beforeEach(() => {
    torrentMeta.clear()
    pausedSet.clear()
    pausedTorrentsInfo.clear()
    populateFromStoredTorrents([completedTorrent, incompleteTorrent])
  })

  describe('populateFromStoredTorrents', () => {
    it('restores completed torrent (progress=1) with seeding status', () => {
      expect(pausedTorrentsInfo.get('hash1')?.status).toBe('seeding')
    })

    it('restores incomplete torrent (progress<1) with paused status', () => {
      expect(pausedTorrentsInfo.get('hash2')?.status).toBe('paused')
    })

    it('adds all restored torrents to pausedSet', () => {
      expect(pausedSet.has('hash1')).toBe(true)
      expect(pausedSet.has('hash2')).toBe(true)
    })

    it('restores progress correctly', () => {
      expect(pausedTorrentsInfo.get('hash1')?.progress).toBe(1)
      expect(pausedTorrentsInfo.get('hash2')?.progress).toBe(0.31)
    })

    it('restores name and totalSize correctly', () => {
      expect(pausedTorrentsInfo.get('hash1')?.name).toBe('Caveat (2020)')
      expect(pausedTorrentsInfo.get('hash2')?.totalSize).toBe(1_400_000_000)
    })

    it('zeroes out speeds and timeRemaining on restored torrents', () => {
      const info = pausedTorrentsInfo.get('hash1')!
      expect(info.downloadSpeed).toBe(0)
      expect(info.uploadSpeed).toBe(0)
      expect(info.numPeers).toBe(0)
      expect(info.timeRemaining).toBe(0)
    })

    it('restores selectedFiles in torrentMeta when present', () => {
      torrentMeta.clear()
      pausedSet.clear()
      pausedTorrentsInfo.clear()
      populateFromStoredTorrents([{ ...incompleteTorrent, selectedFiles: ['witch.mkv'] }])
      expect(torrentMeta.get('hash2')?.selectedFiles).toEqual(['witch.mkv'])
    })

    it('restores selectedFiles in pausedTorrentsInfo when present', () => {
      torrentMeta.clear()
      pausedSet.clear()
      pausedTorrentsInfo.clear()
      populateFromStoredTorrents([{ ...incompleteTorrent, selectedFiles: ['witch.mkv'] }])
      expect(pausedTorrentsInfo.get('hash2')?.selectedFiles).toEqual(['witch.mkv'])
    })

    it('leaves selectedFiles undefined when not in stored torrent', () => {
      expect(torrentMeta.get('hash1')?.selectedFiles).toBeUndefined()
      expect(pausedTorrentsInfo.get('hash1')?.selectedFiles).toBeUndefined()
    })
  })