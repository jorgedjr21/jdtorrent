import type { MoviesResponse } from "../types/movie";

export async function listMovies(page: number, query = '', baseUrl: string): Promise<MoviesResponse> {
  const params = new URLSearchParams({limit: '30', page: String(page)})
  if(query) params.set('query_term', query)
  const res = await fetch(`${baseUrl}/list_movies.json?${params}`)
  const data = await res.json()
  return data.data
}