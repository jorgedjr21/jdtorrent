import { app, ipcMain, dialog } from 'electron'
import path from 'path'
import fs from 'fs'

type AppSettings = { downloadPath: string }

const getSettingsPath = () => path.join(app.getPath('appData'), 'settings.json')

export function loadSettings(): AppSettings {
  try {
    return JSON.parse(fs.readFileSync(getSettingsPath(), 'utf-8'))
  } catch {
    return { downloadPath: app.getPath('downloads') }
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