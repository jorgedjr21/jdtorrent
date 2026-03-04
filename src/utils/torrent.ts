import type { TorrentInfo } from '../types/torrent'

export function formatSpeed(bytes: number): string {
  if (bytes < 1024) return `${bytes} B/s`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB/s`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB/s`
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

export function statusLabel(status: TorrentInfo['status']): string {
  const map = {
    downloading: 'Baixando',
    seeding: 'Semeando',
    paused: 'Pausado',
    completed: 'Concluído'
  }
  return map[status]
}

export function statusClass(status: TorrentInfo['status']): string {
  const map = {
    downloading: 'is-info',
    seeding: 'is-success',
    paused: 'is-warning',
    completed: 'is-success'
  }
  return map[status]
}