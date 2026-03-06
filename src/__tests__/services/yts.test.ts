import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { listMovies, getMovieDetails } from '../../services/yts'

const mockResponse = {
  movie_count: 100,
  limit: 30,
  page_number: 1,
  movies: [
    { id: 1, title: 'Movie A', year: 2021, rating: 7.5, genres: [], torrents: [] }
  ]
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    json: () => Promise.resolve({ data: mockResponse })
  }))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('listMovies', () => {
  it('calls the correct URL with page and limit params', async () => {
    await listMovies(1, '', 'http://fake-api')
    expect(fetch).toHaveBeenCalledWith(
      'http://fake-api/list_movies.json?limit=30&page=1'
    )
  })

  it('includes query_term param when query is provided', async () => {
    await listMovies(2, 'inception', 'http://fake-api')
    expect(fetch).toHaveBeenCalledWith(
      'http://fake-api/list_movies.json?limit=30&page=2&query_term=inception'
    )
  })

  it('does not include query_term when query is empty', async () => {
    await listMovies(1, '', 'http://fake-api')
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).not.toContain('query_term')
  })

  it('returns the data from the response', async () => {
    const result = await listMovies(1, '', 'http://fake-api')
    expect(result).toEqual(mockResponse)
  })

  it('propagates error when fetch fails', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))
    await expect(listMovies(1, '', 'http://fake-api')).rejects.toThrow('Network error')
  })
})

describe('getMovieDetails', () => {
  it('calls the correct URL with movie_id, with_images and with_cast params', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: () => Promise.resolve({ data: { movie: {} } })
    } as any)
    await getMovieDetails(123, 'http://fake-api')
    expect(fetch).toHaveBeenCalledWith(
      'http://fake-api/movie_details.json?movie_id=123&with_images=true&with_cast=true'
    )
  })

  it('returns the movie data from the response', async () => {
    const mockData = { movie: { id: 123, title: 'Inception' } }
    vi.mocked(fetch).mockResolvedValueOnce({
      json: () => Promise.resolve({ data: mockData })
    } as any)
    const result = await getMovieDetails(123, 'http://fake-api')
    expect(result).toEqual(mockData)
  })

  it('propagates error when fetch fails', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))
    await expect(getMovieDetails(123, 'http://fake-api')).rejects.toThrow('Network error')
  })
})