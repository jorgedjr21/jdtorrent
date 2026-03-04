import type { TorrentInfo } from "./torrent";

declare global {
  interface Window {
    electronAPI: {
      platform: string,
      torrent: {
        chooseFolder: () => Promise<string | null>
        addFile: (savePath: string) => Promise<TorrentInfo | null>
        addMagnet: (uri: string, savePath: string) => Promise<TorrentInfo>
        list: () => Promise<TorrentInfo[]>
        pause: (infoHash: string) => Promise<void>
        resume: (infoHash: string) => Promise<void>
      },
      settings: {
        get: () => Promise<{downloadPath: string, ytsApiUrl: string}>,
        set: (s: {downloadPath: string, ytsApiUrl: string}) => Promise<void>,
        chooseFolder: () => Promise<string | null>
      }
    }
  }
}