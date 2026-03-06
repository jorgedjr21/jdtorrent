import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn() },
  dialog: { showOpenDialog: vi.fn() },
  app: { getPath: vi.fn(() => '/mock/appdata') }
}))

vi.mock('path', () => ({
  default: {
    join: (...args: string[]) => args.join('/'),
    isAbsolute: (p: string) => p.startsWith('/'),
    dirname: (p: string) => p.split('/').slice(0, -1).join('/') || '/'
  }
}))

const { mockRmSync } = vi.hoisted(() => ({ mockRmSync: vi.fn() }))

vi.mock('fs', () => ({
  default: { readFileSync: vi.fn(() => '[]'), writeFileSync: vi.fn(), rmSync: mockRmSync }
}))

import { deleteTorrentFiles } from '../torrent'

beforeEach(() => mockRmSync.mockReset())

describe('deleteTorrentFiles', () => {
  it('deletes torrent folder for multi-file torrent with absolute paths', () => {
    deleteTorrentFiles({
      savePath: '/downloads',
      files: [
        { path: '/downloads/Movie Name/movie.mkv' },
        { path: '/downloads/Movie Name/subtitle.srt' }
      ]
    })
    expect(mockRmSync).toHaveBeenCalledOnce()
    expect(mockRmSync).toHaveBeenCalledWith('/downloads/Movie Name', { recursive: true, force: true })
  })

  it('deletes torrent folder for multi-file torrent with relative paths', () => {
    deleteTorrentFiles({
      savePath: '/downloads',
      files: [
        { path: 'Movie Name/movie.mkv' },
        { path: 'Movie Name/subtitle.srt' }
      ]
    })
    expect(mockRmSync).toHaveBeenCalledOnce()
    expect(mockRmSync).toHaveBeenCalledWith('/downloads/Movie Name', { recursive: true, force: true })
  })

  it('deletes individual file for single-file torrent with absolute path', () => {
    deleteTorrentFiles({
      savePath: '/downloads',
      files: [{ path: '/downloads/movie.mkv' }]
    })
    expect(mockRmSync).toHaveBeenCalledWith('/downloads/movie.mkv', { force: true })
  })

  it('deletes individual file for single-file torrent with relative path', () => {
    deleteTorrentFiles({
      savePath: '/downloads',
      files: [{ path: 'movie.mkv' }]
    })
    expect(mockRmSync).toHaveBeenCalledWith('/downloads/movie.mkv', { force: true })
  })

  it('does nothing when files list is empty', () => {
    deleteTorrentFiles({ savePath: '/downloads', files: [] })
    expect(mockRmSync).not.toHaveBeenCalled()
  })
})