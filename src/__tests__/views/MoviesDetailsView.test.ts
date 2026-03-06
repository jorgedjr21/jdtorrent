import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createWebHashHistory } from 'vue-router'
import MovieDetailsView from '../../views/MovieDetailsView.vue'
import * as yts from '../../services/yts'

vi.mock('../../services/yts')

const stubs = { FontAwesomeIcon: true }

const mockMovie = {
  id: 123,
  title: 'Inception',
  year: 2010,
  runtime: 148,
  rating: 8.8,
  genres: ['Action', 'Sci-Fi'],
  background_image_original: 'http://img/bg.jpg',
  large_cover_image: 'http://img/inception.jpg',
  yt_trailer_code: '',
  medium_screenshot_image1: '',
  description_full: 'A thief who steals corporate secrets.',
  summary: '',
  torrents: [
    { hash: 'abc', quality: '1080p', type: 'bluray', size: '2.1 GB', url: '', seeds: 100, peers: 50 },
    { hash: 'def', quality: '720p', type: 'web', size: '1.2 GB', url: '', seeds: 80, peers: 30 }
  ],
  cast: []
}

function createTestRouter() {
  return createRouter({
    history: createWebHashHistory(),
    routes: [{ path: '/movies/:id', component: MovieDetailsView }]
  })
}

beforeEach(() => {
  vi.mocked(yts.getMovieDetails).mockResolvedValue({ movie: mockMovie } as any)
  vi.mocked(window.electronAPI.torrent.list).mockResolvedValue([])
})

describe('MovieDetailsView', () => {
  it('shows loading state while fetching', async () => {
    vi.mocked(yts.getMovieDetails).mockReturnValue(new Promise(() => {}))
    const router = createTestRouter()
    await router.push('/movies/123')
    const wrapper = mount(MovieDetailsView, { global: { plugins: [router], stubs } })
    await Promise.resolve()
    expect(wrapper.text()).toContain('Carregando...')
  })

  it('shows movie title, year and rating after loading', async () => {
    const router = createTestRouter()
    await router.push('/movies/123')
    await router.isReady()
    const wrapper = mount(MovieDetailsView, { global: { plugins: [router], stubs } })
    await flushPromises()
    expect(wrapper.text()).toContain('Inception')
    expect(wrapper.text()).toContain('2010')
    expect(wrapper.text()).toContain('8.8')
  })

  it('shows genre tags', async () => {
    const router = createTestRouter()
    await router.push('/movies/123')
    await router.isReady()
    const wrapper = mount(MovieDetailsView, { global: { plugins: [router], stubs } })
    await flushPromises()
    expect(wrapper.text()).toContain('Action')
    expect(wrapper.text()).toContain('Sci-Fi')
  })

  it('shows torrent buttons for each quality', async () => {
    const router = createTestRouter()
    await router.push('/movies/123')
    await router.isReady()
    const wrapper = mount(MovieDetailsView, { global: { plugins: [router], stubs } })
    await flushPromises()
    expect(wrapper.text()).toContain('1080p bluray')
    expect(wrapper.text()).toContain('720p web')
  })

  it('shows error message when fetch fails', async () => {
    vi.spyOn(console, 'error').mockImplementationOnce(() => {})
    vi.mocked(yts.getMovieDetails).mockRejectedValueOnce(new Error('fail'))
    const router = createTestRouter()
    await router.push('/movies/123')
    await router.isReady()
    const wrapper = mount(MovieDetailsView, { global: { plugins: [router], stubs } })
    await flushPromises()
    expect(wrapper.text()).toContain('Erro ao carregar detalhes do filme')
  })

  it('disables torrent button if hash already exists in torrent list', async () => {
    vi.mocked(window.electronAPI.torrent.list).mockResolvedValue([
      { infoHash: 'abc', name: 'Inception', progress: 1, status: 'seeding', totalSize: 0,
downloadSpeed: 0, uploadSpeed: 0, numPeers: 0, files: [], addedAt: 0, timeRemaining: 0 }
    ])
    const router = createTestRouter()
    await router.push('/movies/123')
    await router.isReady()
    const wrapper = mount(MovieDetailsView, { global: { plugins: [router], stubs } })
    await flushPromises()
    const buttons = wrapper.findAll('button.torrent-btn')
    expect(buttons[0].attributes('disabled')).toBeDefined()
    expect(buttons[1].attributes('disabled')).toBeUndefined()
  })

  it('calls addMagnet and shows toast when torrent button is clicked', async () => {
    vi.mocked(window.electronAPI.torrent.addMagnet).mockResolvedValue({} as any)
    const router = createTestRouter()
    await router.push('/movies/123')
    await router.isReady()
    const wrapper = mount(MovieDetailsView, { global: { plugins: [router], stubs } })
    await flushPromises()
    await wrapper.findAll('button.torrent-btn')[0].trigger('click')
    await flushPromises()
    expect(window.electronAPI.torrent.addMagnet).toHaveBeenCalledWith(
      expect.stringContaining('magnet:?xt=urn:btih:abc'),
      '/downloads'
    )
    expect(wrapper.text()).toContain('1080p bluray adicionado!')
  })

  it('calls router.go(-1) when back button is clicked', async () => {
    const router = createTestRouter()
    await router.push('/movies/123')
    await router.isReady()
    const goSpy = vi.spyOn(router, 'go')
    const wrapper = mount(MovieDetailsView, { global: { plugins: [router], stubs } })
    await flushPromises()
    await wrapper.find('button.button').trigger('click')
    expect(goSpy).toHaveBeenCalledWith(-1)
  })
})