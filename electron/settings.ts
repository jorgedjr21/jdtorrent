import { app, ipcMain, dialog } from 'electron'
import path from 'path'
import fs from 'fs'

const DEFAULT_TRACKERS = [
  'udp://tracker.opentrackr.org:1337/announce',
  'udp://tracker.torrent.eu.org:451/announce',
  'udp://tracker.dler.org:6969/announce',
  'udp://open.stealth.si:80/announce',
  'udp://open.demonii.com:1337/announce',
  'https://tracker.moeblog.cn:443/announce',
  'udp://open.dstud.io:6969/announce',
  'udp://tracker.srv00.com:6969/announce',
  'https://tracker.zhuqiy.com:443/announce',
  'https://tracker.pmman.tech:443/announce',
]

type AppSettings = {
  downloadPath: string
  ytsApiUrl: string
  trackers: string[]
  locale: string
}

const getSettingsPath = () => path.join(app.getPath('appData'), 'settings.json')

export function loadSettings(): AppSettings {
  const defaults: AppSettings = {
    downloadPath: app.getPath('downloads'),
    ytsApiUrl: 'https://movies-api.accel.li/api/v2',
    trackers: DEFAULT_TRACKERS,
    locale: 'pt-BR',
  }
  try {
    return { ...defaults, ...JSON.parse(fs.readFileSync(getSettingsPath(), 'utf-8')) }
  } catch {
    return defaults
  }
}

export function saveSettings(s: AppSettings) {
  fs.writeFileSync(getSettingsPath(), JSON.stringify(s, null, 2))
}

export function registerSettingsHandlers() {
  ipcMain.handle('settings:get', async () => loadSettings())
  ipcMain.handle('settings:set', async (_event, s: AppSettings) => saveSettings(s))
  ipcMain.handle('settings:choose-folder', async () => {
    const result = await dialog.showOpenDialog({properties: ['openDirectory']})
    return result.canceled ? null : result.filePaths[0]
  })
}