import { vi } from 'vitest'

window.electronAPI = {
  platform: 'linux',
  torrent: {
    addFile: vi.fn(),
    addMagnet: vi.fn(),
    peekFiles: vi.fn().mockResolvedValue([]),
    list: vi.fn().mockResolvedValue([]),
    pause: vi.fn().mockResolvedValue(undefined),
    resume: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
  },
  settings: {
    get: vi.fn().mockResolvedValue({ downloadPath: '/downloads', ytsApiUrl: 'http://fake-api', trackers: ['udp://tracker.opentrackr.org:1337/announce'] }),
    set: vi.fn().mockResolvedValue(undefined),
    chooseFolder: vi.fn().mockResolvedValue('/novo/caminho'),
  }
} as any