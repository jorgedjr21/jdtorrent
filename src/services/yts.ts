import type { MovieDetailsResponse, MoviesResponse } from "../types/movie";

export async function listMovies(page: number, query = '', baseUrl: string): Promise<MoviesResponse> {
  const params = new URLSearchParams({limit: '30', page: String(page)})
  if(query) params.set('query_term', query)
  const res = await fetch(`${baseUrl}/list_movies.json?${params}`)
  const data = await res.json()
  return data.data
}

export async function getMovieDetails(movieId: number, baseUrl: string): Promise<MovieDetailsResponse> {
  const params = new URLSearchParams({movie_id: String(movieId), with_images: 'true', with_cast: 'true'})
  const res = await fetch(`${baseUrl}/movie_details.json?${params}`)
  const data = await res.json()
  return data.data
}