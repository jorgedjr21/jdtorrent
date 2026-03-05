export interface MovieTorrent {
  url: string
  hash: string
  quality: string
  seeds: number
  peers: number
  size: string
  type: string
}

export interface CastMember {
  name: string
  character_name: string
  url_small_image: string
  imdb_code: string
}

export interface Movie {
  id: number
  title: string
  year: number
  rating: number
  runtime: number
  genres: string[]
  summary: string
  description_full: string
  language: string
  yt_trailer_code: string
  background_image: string
  background_image_original: string
  small_cover_image: string
  medium_cover_image: string
  large_cover_image: string
  medium_screenshot_image1?: string
  medium_screenshot_image2?: string
  medium_screenshot_image3?: string
  torrents: MovieTorrent[]
  cast?: CastMember[]
}

export interface MoviesResponse {
  movie_count: number
  limit: number
  page_number: number
  movies: Movie[]
}

export interface MovieDetailsResponse {
  movie: Movie
}