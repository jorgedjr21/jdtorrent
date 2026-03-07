import { vi } from 'vitest'
import { config } from '@vue/test-utils'
import { i18n } from '../i18n'

config.global.plugins = [i18n]

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
    get: vi.fn().mockResolvedValue({ downloadPath: '/downloads', ytsApiUrl: 'http://fake-api', trackers: ['udp://tracker.opentrackr.org:1337/announce'], locale: 'pt-BR' }),
    set: vi.fn().mockResolvedValue(undefined),
    chooseFolder: vi.fn().mockResolvedValue('/novo/caminho'),
  }
} as any