export interface TorrentFile {
  name: string
  path: string
  length: number
}

export interface TorrentInfo {
  infoHash: string
  name: string
  totalSize: number
  progress: number
  downloadSpeed: number
  uploadSpeed: number
  numPeers: number
  status: 'downloading' | 'seeding' | 'paused'
  files: TorrentFile[]
  addedAt: number
  timeRemaining: number
  selectedFiles?: string[]
}
