import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import MoviesView from '../../views/MoviesView.vue'
import * as yts from '../../services/yts'
import type { MoviesResponse } from '../../types/movie'

vi.mock('../../services/yts')

const stubs = { FontAwesomeIcon: true }

const mockMovies: MoviesResponse = {
  movie_count: 45,
  limit: 30,
  page_number: 1,
  movies: [
    {
      id: 1,
      title: 'Inception',
      year: 2010,
      rating: 8.8,
      runtime: 148,
      genres: ['Action', 'Sci-Fi'],
      summary: 'A thief who steals corporate secrets.',
      medium_cover_image: 'http://img/inception.jpg',
      large_cover_image: 'http://img/inception_large.jpg',
      torrents: [{ url: '', hash: '', quality: '1080p', type: 'bluray', seeds: 100, peers: 50, size:
'2GB' }]
    }
  ]
}

beforeEach(() => {
  vi.mocked(yts.listMovies).mockResolvedValue(mockMovies)
})

describe('MoviesView', () => {
  it('shows skeleton cards while loading', async () => {
    vi.mocked(yts.listMovies).mockReturnValue(new Promise(() => {}))
    const wrapper = mount(MoviesView, { global: { stubs } })
    await Promise.resolve()
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.skeleton-image').length).toBe(15)
  })

  it('shows movie cards after loading', async () => {
    const wrapper = mount(MoviesView, { global: { stubs } })
    await flushPromises()
    expect(wrapper.findAll('.movie-card').length).toBe(1)
    expect(wrapper.text()).toContain('Inception')
  })

  it('shows quality tag for each torrent', async () => {
    const wrapper = mount(MoviesView, { global: { stubs } })
    await flushPromises()
    expect(wrapper.text()).toContain('1080p bluray')
  })

  it('shows genre tags (up to 2)', async () => {
    const wrapper = mount(MoviesView, { global: { stubs } })
    await flushPromises()
    expect(wrapper.text()).toContain('Action')
    expect(wrapper.text()).toContain('Sci-Fi')
  })

  it('shows error message when fetch fails', async () => {
    vi.spyOn(console, 'error').mockImplementationOnce(() => {})
    vi.mocked(yts.listMovies).mockRejectedValueOnce(new Error('fail'))
    const wrapper = mount(MoviesView, { global: { stubs } })
    await flushPromises()
    expect(wrapper.text()).toContain('Erro ao carregar filmes')
  })

  it('shows empty state when movies list is empty', async () => {
    vi.mocked(yts.listMovies).mockResolvedValueOnce({ ...mockMovies, movies: [], movie_count: 0 })
    const wrapper = mount(MoviesView, { global: { stubs } })
    await flushPromises()
    expect(wrapper.text()).toContain('Nenhum filme encontrado')
  })

  it('loads ytsApiUrl from settings on mount', async () => {
    mount(MoviesView, { global: { stubs } })
    await flushPromises()
    expect(window.electronAPI.settings.get).toHaveBeenCalled()
    expect(yts.listMovies).toHaveBeenCalledWith(1, '', 'http://fake-api')
  })

  it('resets to page 1 and fetches when search button is clicked', async () => {
    const wrapper = mount(MoviesView, { global: { stubs } })
    await flushPromises()
    vi.mocked(yts.listMovies).mockClear()
    await wrapper.find('input[type="text"]').setValue('matrix')
    await wrapper.find('button.is-info').trigger('click')
    await flushPromises()
    expect(yts.listMovies).toHaveBeenCalledWith(1, 'matrix', 'http://fake-api')
  })

  it('triggers search when Enter key is pressed', async () => {
    const wrapper = mount(MoviesView, { global: { stubs } })
    await flushPromises()
    vi.mocked(yts.listMovies).mockClear()
    await wrapper.find('input[type="text"]').setValue('avatar')
    await wrapper.find('input[type="text"]').trigger('keyup.enter')
    await flushPromises()
    expect(yts.listMovies).toHaveBeenCalledWith(1, 'avatar', 'http://fake-api')
  })

  it('shows pagination when there are multiple pages', async () => {
    const wrapper = mount(MoviesView, { global: { stubs } })
    await flushPromises()
    expect(wrapper.text()).toContain('Página 1 de 3')
  })

  it('navigates to next page when Próxima is clicked', async () => {
    const wrapper = mount(MoviesView, { global: { stubs } })
    await flushPromises()
    vi.mocked(yts.listMovies).mockClear()
    const proximaBtn = wrapper.findAll('button').find(b => b.text() === 'Próxima')
    await proximaBtn!.trigger('click')
    await flushPromises()
    expect(yts.listMovies).toHaveBeenCalledWith(2, '', 'http://fake-api')
  })

  it('disables Anterior button on first page', async () => {
    const wrapper = mount(MoviesView, { global: { stubs } })
    await flushPromises()
    const anteriorBtn = wrapper.findAll('button').find(b => b.text() === 'Anterior')
    expect(anteriorBtn?.attributes('disabled')).toBeDefined()
  })
})
