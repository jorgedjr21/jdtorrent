import { app, BrowserWindow, ipcMain, Menu } from 'electron'
import path from 'path'
import { autoUpdater } from 'electron-updater'
import { registerSettingsHandlers } from './settings'
import { registerTorrentHandlers, initTorrentClient } from './torrent'

const isDev = !app.isPackaged

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
    Menu.setApplicationMenu(null)
    win.loadFile(path.join(__dirname, '../dist/index.html'))
    autoUpdater.checkForUpdates()
  }

  autoUpdater.on('update-available', (info) => {
    win.webContents.send('updater:update-available', info.version)
  })

  autoUpdater.on('update-downloaded', () => {
    win.webContents.send('updater:update-downloaded')
  })
}

app.whenReady().then(async () => {
  registerSettingsHandlers()
  registerTorrentHandlers()
  await initTorrentClient()
  createWindow()
})

ipcMain.handle('app:quit', () => app.quit())
ipcMain.on('updater:install', () => autoUpdater.quitAndInstall())

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
