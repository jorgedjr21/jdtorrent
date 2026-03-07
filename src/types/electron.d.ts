import type { TorrentInfo } from "./torrent";

declare global {
  interface Window {
    electronAPI: {
      platform: string,
      app: {
        quit: () => Promise<void>
      },
      torrent: {
        addFile: (savePath: string) => Promise<TorrentInfo | null>
        addMagnet: (uri: string, savePath: string) => Promise<TorrentInfo>
        peekFiles: (uri: string) => Promise<{ name: string, path: string, length: number }[]>
        list: () => Promise<TorrentInfo[]>
        pause: (infoHash: string) => Promise<void>
        resume: (infoHash: string) => Promise<void>
        remove: (infoHash: string, deleteFiles: boolean) => Promise<void>
      },
      settings: {
        get: () => Promise<{downloadPath: string, ytsApiUrl: string}>,
        set: (s: {downloadPath: string, ytsApiUrl: string}) => Promise<void>,
        chooseFolder: () => Promise<string | null>
      },
      updater: {
        onUpdateAvailable: (cb: (version: string) => void) => void
        onUpdateDownloaded: (cb: () => void) => void
        install: () => void
      }
    }
  }
}
