import { app, BrowserWindow } from 'electron'
import path from 'path'
import { registerSettingsHandlers } from './settings'
import { registerTorrentHandlers, initTorrentClient } from './torrent'

const isDev = process.env.NODE_ENV === 'development'

function createWindow() {
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.on('did-finish-load', () => win.webContents.openDevTools())
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(async () => {
  registerSettingsHandlers()
  registerTorrentHandlers()
  await initTorrentClient()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})