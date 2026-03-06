import { describe, it, expect } from 'vitest'
import { formatSize, formatSpeed, statusLabel, statusClass } from '../utils/torrent'

describe('formatSpeed', () => {
  it('formats to bytes per second', () => {
    expect(formatSpeed(512)).toBe('512 B/s')
  })

  it('formats to kilobytes per second', () => {
    expect(formatSpeed(1536)).toBe('1.5 KB/s')
  })

  it('formats to megabytes per second', () => {
    expect(formatSpeed(2*1024*1024)).toBe('2.0 MB/s')
  })
})

describe('formatSize', () => {
  it('formats to bytes', () => {
    expect(formatSize(100)).toBe('100 B')
  })
  it('formats to KB', () => {
    expect(formatSize(2048)).toBe('2.0 KB')
  })
  it('formats to MB', () => {
    expect(formatSize(5 * 1024 * 1024)).toBe('5.0 MB')
  })
  it('formats to GB', () => {
    expect(formatSize(1.5 * 1024 * 1024 * 1024)).toBe('1.50 GB')
  })
})

describe('statusLabel', () => {
  it('returns the correct label for each status', () => {
    expect(statusLabel('downloading')).toBe('Baixando')
    expect(statusLabel('seeding')).toBe('Semeando')
    expect(statusLabel('paused')).toBe('Pausado')
  })
})

describe('statusClass', () => {
  it('returns the correct class for each status', () => {
    expect(statusClass('downloading')).toBe('is-info')
    expect(statusClass('seeding')).toBe('is-success')
    expect(statusClass('paused')).toBe('is-warning')
  })
})