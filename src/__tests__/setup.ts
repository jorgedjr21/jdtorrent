import { vi } from 'vitest'

window.electronAPI = {
  platform: 'linux',
  torrent: {
    addFile: vi.fn(),
    addMagnet: vi.fn(),
    list: vi.fn().mockResolvedValue([]),
    pause: vi.fn().mockResolvedValue(undefined),
    resume: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
  },
  settings: {
    get: vi.fn().mockResolvedValue({ downloadPath: '/downloads' , ytsApiUrl: 'http://fake-api'}),
    set: vi.fn().mockResolvedValue(undefined),
    chooseFolder: vi.fn().mockResolvedValue('/novo/caminho'),
  }
} as any