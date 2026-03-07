<template>
  <div class="movies-layout">
    <div class="movies-header">
      <div class="is-flex is-justify-content-space-between is-align-items-center mb-4">
        <h1 class="title is-5 mb-0">{{ $t('movies.title') }}</h1>
      </div>

      <div class="field has-addons mb-4 search-sticky">
        <div class="control is-expanded">
          <input
            v-model="searchInput"
            type="text"
            class="input"
            :placeholder="$t('movies.searchPlaceholder')"
            @keyup.enter="search"
          />
        </div>
        <div class="control">
          <button
            class="button is-info"
            :class="{ 'is-loading': loading }"
            :disabled="loading"
            @click="search"
          >
            <span class="icon">
              <font-awesome-icon icon="magnifying-glass" />
            </span>
          </button>
        </div>
      </div>
    </div>

    <div class="movies-body">
      <div v-if="loading" class="movies-grid">
        <div v-for="n in 15" :key="n" class="movie-card">
          <div class="skeleton-image"></div>
          <div class="movie-info">
            <div class="skeleton-text"></div>
            <div class="skeleton-text short"></div>
          </div>
        </div>
      </div>

      <div v-else-if="error" class="has-text-centered mt-6">
        <p class="has-text-danger">{{ error }}</p>
      </div>

      <div v-else-if="movies.length === 0" class="has-text-centered mt-6">
        <p class="is-size-4 has-text-grey">{{ $t('movies.empty') }}</p>
      </div>

      <div v-else class="movies-grid">
        <div v-for="movie in movies" :key="movie.id" class="movie-card"
          @click="router.push(`/movies/${movie.id}`)">
          <img :src="movie.medium_cover_image" :alt="movie.title" />
          <div class="movie-info">
            <p class="movie-title">{{ movie.title }}</p>
            <p class="movie-meta">
              {{ movie.year }}
              <span class="ml-2">
                <font-awesome-icon icon="star" class="has-text-warning"/>
                {{ movie.rating }}
              </span>
            </p>

            <div class="mb-1">
              <span 
                v-for="torrent in movie.torrents" 
                :key="torrent.quality + torrent.type"
                class="tag is-info is-small mr-1"
              >
                {{ torrent.quality }} {{ torrent.type }}
              </span>
            </div>

            <div class="movie-genres mt-3">
              <span v-for="genre in movie.genres?.slice(0,2)" :key="genre" class="tag is-dark is-small mr-1">
                {{ genre }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="totalPages" class="is-flex is-justify-content-center is-align-items-center mt-5" style="gap: 1rem;">
        <button class="button is-small" :disabled="page === 1" @click="changePage(page - 1)">{{ $t('movies.prev') }}</button>
        <span class="has-text-grey is-size-7">{{ $t('movies.page', { page, total: totalPages }) }}</span>
        <button class="button is-small" :disabled="page === totalPages" @click="changePage(page + 1)">{{ $t('movies.next') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()
  import { listMovies } from '../services/yts';
  import type { Movie } from '../types/movie';
  import { useRouter } from 'vue-router';

  const router = useRouter();
  const movies = ref<Movie[]>([])
  const loading = ref(false)
  const error = ref('')
  const page = ref(1)
  const totalPages = ref(1)
  const searchInput = ref('')
  const ytsApiUrl = ref('')
  
  function search() {
    page.value = 1
    fetchMovies()
  }

  async function fetchMovies() {
    loading.value = true
    error.value = ''

    try {
      const data = await listMovies(page.value, searchInput.value, ytsApiUrl.value)
      movies.value = data.movies ?? []
      totalPages.value = Math.ceil(data.movie_count / 15)
      const moviesBody = document.querySelector('.movies-body')
      if(moviesBody) moviesBody.scrollTop = 0
    } catch (e: any) {
      error.value = t('movies.error')
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  function changePage(newPage: number) {
    page.value = newPage
    fetchMovies()
  }

  onMounted(async () => {
    const s = await window.electronAPI.settings.get()
    ytsApiUrl.value = s.ytsApiUrl
    fetchMovies()
  })
</script>

<style scoped>
  .movies-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 1rem;
  }

  .movie-card {
    background: #fff;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    cursor: pointer;
    transition: transform 0.2s;
  }

  .movie-card:hover {
    transform: translateY(-4px);
  }

  .movie-card img {
    width: 100%;
    height: 280px;
    object-fit: cover;
    display: block;
  }

  .movie-info {
    padding: 0.6rem;
  }

  .movie-title {
    font-size: 0.8rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .movie-meta {
    font-size: 0.75rem;
    color: #888;
    margin-bottom: 0.25rem;
  }

  .movie-genres {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem
  }

  .skeleton-image {
    width: 100%;
    height: 280px;
    background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  .skeleton-text {
    height: 12px;
    border-radius: 4px;
    margin-bottom: 0.5rem;
    background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  .skeleton-text.short {
    width: 60%;
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  .movies-layout {
    display: flex;
    flex-direction: column;
    height: calc(100% + 3rem);
    margin: -1.5rem;
    overflow: hidden;
  }

  .movies-header {
    flex-shrink: 0;
    padding: 1.5rem 1.5rem 0.75rem;
    background-color: #f5f5f5;
  }

  .movies-body {
    flex: 1;
    overflow-y: auto;
    padding: 0 1.5rem 1.5rem;
  }

</style>