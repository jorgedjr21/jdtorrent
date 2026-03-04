export interface MovieTorrent {
  url: string
  hash: string
  quality: string
  seeds: number
  peers: number
  size: string
  type: string
}

export interface Movie {
  id: number
  title: string
  year: number
  rating: number
  runtime: number
  genres: string[]
  summary: string
  medium_cover_image: string
  large_cover_image: string
  torrents: MovieTorrent[]
}

export interface MoviesResponse {
  movie_count: number
  limit: number
  page_number: number
  movies: Movie[]
}