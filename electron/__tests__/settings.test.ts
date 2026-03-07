import { describe, it, expect, vi } from 'vitest'

vi.mock('electron', () => ({
  app: { getPath: vi.fn((key: string) => key === 'appData' ? '/mock/appdata' : '/mock/downloads') },
  ipcMain: { handle: vi.fn() },
  dialog: { showOpenDialog: vi.fn() }
}))

const { mockReadFileSync, mockWriteFileSync } = vi.hoisted(() => ({
  mockReadFileSync: vi.fn(),
  mockWriteFileSync: vi.fn()
}))

vi.mock('fs', () => ({
  default: { readFileSync: mockReadFileSync, writeFileSync: mockWriteFileSync }
}))
import { loadSettings, saveSettings } from '../settings'

describe('loadSettings', () => {
  it('returns the configs when exists', () => {
    mockReadFileSync.mockReturnValue(JSON.stringify({ downloadPath: '/meus/downloads' }))
    const settings = loadSettings()
    expect(settings.downloadPath).toBe('/meus/downloads')
  })

  it('returns the default download path when does not exists', () => {
    mockReadFileSync.mockImplementation(() => { throw new Error('ENOENT') })
    const settings = loadSettings()
    expect(settings.downloadPath).toBe('/mock/downloads')
  })
})

describe('saveSettings', () => {
  it('writes the config to the json file', () => {
    saveSettings({ downloadPath: '/new/path', ytsApiUrl: 'http://fake-api', trackers: [] })
    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.stringContaining('settings.json'),
      expect.stringContaining('/new/path')
    )
    const json = mockWriteFileSync.mock.calls[0][1]
    expect(json).toContain('http://fake-api')
  })
})