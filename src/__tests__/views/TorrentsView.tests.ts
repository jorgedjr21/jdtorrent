import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import TorrentsView from '../../views/TorrentsView.vue'
import type { TorrentInfo } from '../../types/torrent'

const stubs = { FontAwesomeIcon: true, AddTorrentModal: true }

const makeTorrent = (overrides: Partial<TorrentInfo>): TorrentInfo => ({
  infoHash: 'abc',
  name: 'Test',
  totalSize: 1024,
  progress: 0.5,
  downloadSpeed: 0,
  uploadSpeed: 0,
  numPeers: 0,
  status: 'downloading',
  files: [],
  addedAt: Date.now(),
  timeRemaining: 0,
  ...overrides
})

beforeEach(() => {
  vi.mocked(window.electronAPI.torrent.list).mockResolvedValue([])
})

describe('TorrentsView', () => {
  it('shows an info message when no torrent is available', async () => {
    const wrapper = mount(TorrentsView, { global: { stubs } })
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Nenhum torrent aqui')
  })

  it('filter the torrents by status', async () => {
    const torrents = [
      makeTorrent({ infoHash: '1', status: 'downloading' }),
      makeTorrent({ infoHash: '2', status: 'paused' }),
    ]
    vi.mocked(window.electronAPI.torrent.list).mockResolvedValue(torrents)
    const wrapper = mount(TorrentsView, { global: { stubs } })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    await wrapper.findAll('.tabs li a')[3].trigger('click') // aba Pausado
    const boxes = wrapper.findAll('.box')
    expect(boxes).toHaveLength(1)
  })

  it('shows the correct torrent count by status', async () => {
    const torrents = [
      makeTorrent({ infoHash: '1', status: 'downloading' }),
      makeTorrent({ infoHash: '2', status: 'downloading' }),
      makeTorrent({ infoHash: '3', status: 'paused' }),
    ]
    vi.mocked(window.electronAPI.torrent.list).mockResolvedValue(torrents)
    const wrapper = mount(TorrentsView, { global: { stubs } })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Baixando (2)')
    expect(wrapper.text()).toContain('Pausado (1)')
  })

  it('shows pause button when torrent is downloading', async () => {
    vi.mocked(window.electronAPI.torrent.list).mockResolvedValue([
      makeTorrent({ status: 'downloading' })
    ])
    const wrapper = mount(TorrentsView, { global: { stubs } })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.box button').text()).toContain('Pausar')
  })

  it('shows start button when torrent is paused', async () => {
    vi.mocked(window.electronAPI.torrent.list).mockResolvedValue([
      makeTorrent({ status: 'paused' })
    ])
    const wrapper = mount(TorrentsView, { global: { stubs } })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.box button').text()).toContain('Iniciar')
  })

  it('button have a loading state when pausing/starting', async () => {
    vi.mocked(window.electronAPI.torrent.pause).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    )
    vi.mocked(window.electronAPI.torrent.list).mockResolvedValue([
      makeTorrent({ status: 'downloading' })
    ])
    const wrapper = mount(TorrentsView, { global: { stubs } })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    wrapper.find('.box button').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.box button').classes()).toContain('is-loading')
  })
})