<template>
  <div class="details-layout">
    <div v-if="loading" class="has-text-centered mt-6">
      <p class="has-text-grey">Carregando...</p>
    </div>

    <div v-else-if="error" class="has-text-centered mt-6">
      <p class="has-text-danger">{{ error }}</p>
    </div>

    <div v-else-if="movie" class="details-content">
      <div 
        class="details-backdrop"
        :style="movie.background_image_original
          ? `background-image: url(${movie.background_image_original})`
          : ''"
        ></div>

      <div class="details-body">
        <div class="mb-4" style="position: relative;">
          <button class="button is-small" @click="router.go(-1)">
            ← Voltar para Filmes
          </button>
        </div>
         <div class="details-top">
          <img :src="movie.large_cover_image" :alt="movie.title" class="details-poster" />

          <div class="details-info">
            <h1 class="title is-4 mb-1 has-text-white">{{ movie.title }}</h1>
            <p class="details-meta mb-2">
              {{ movie.year }}
              <span class="mx-2">·</span>
              {{ movie.runtime }} min
              <span class="mx-2">·</span>
              <font-awesome-icon icon="star" class="has-text-warning" />
              {{ movie.rating }}
            </p>

            <div class="mb-3">
              <span v-for="genre in movie.genres" :key="genre" class="tag is-dark is-small mr-1">
                {{ genre }}
              </span>
            </div>
          </div>

          <div v-if="movie.yt_trailer_code" class="details-trailer">
            <iframe
              :src="`https://www.youtube.com/embed/${movie.yt_trailer_code}`"
              frameborder="0"
              allowfullscreen
              width="480"
              height="300"
            ></iframe>
          </div>
        </div>

        <div class="details-lower">
          <div v-if="movie.medium_screenshot_image1" class="screenshots-row mb-4">
            <img :src="movie.medium_screenshot_image1" alt="screenshot 1" />
            <img v-if="movie.medium_screenshot_image2" :src="movie.medium_screenshot_image2" alt="screenshot2" />
            <img v-if="movie.medium_screenshot_image3" :src="movie.medium_screenshot_image3" alt="screenshot3" />
          </div>
          <p v-if="movie.description_full || movie.summary" class="details-summary mb-4">
            {{ movie.description_full || movie.summary }}
          </p>

          <div>
            <p class="is-size-7 has-text-weight-bold mb-2">Torrents</p>
            <div class="is-flex is-flex-wrap-wrap" style="gap: 0.5rem;">
              <button
                v-for="torrent in movie.torrents"
                :key="torrent.quality + torrent.type"
                class="tag is-info torrent-btn"
                :class="{
                  'is-light': existingHashes.includes(torrent.hash.toLowerCase()),
                  'torrent-added': existingHashes.includes(torrent.hash.toLowerCase())
                }"
                :disabled="loadingTorrent !== '' || existingHashes.includes(torrent.hash.toLowerCase())"
                :data-tooltip="existingHashes.includes(torrent.hash.toLowerCase()) ? 'Já adicionado para download' :
              undefined"
                @click="addTorrent(torrent.hash, torrent.quality, torrent.type)"
              >
                <span v-if="loadingTorrent === torrent.hash" class="icon is-small mr-1">
                  <font-awesome-icon icon="spinner" spin />
                </span>
                {{ torrent.quality }} {{ torrent.type }} · {{ torrent.size }}
              </button>
            </div>
          </div>
        </div>

        <div v-if="movie.cast && movie.cast.length" class="mt-5">
          <h2 class="title is-6 mb-3">Elenco</h2>

          <div class="cast-grid">
            <div v-for="member in movie.cast" :key="member.imdb_code" class="card-card">
              <img 
                v-if="member.url_small_image"
                :src="member.url_small_image"
                :alt="member.name"
                class="cast-photo"
              />
              <div v-else class="cast-photo cast-placeholder">
                  <font-awesome-icon icon="user"/>
              </div>

              <p class="cast-name">{{ member.name }}</p>
              <p class="cast-character">{{ member.character_name }}</p>
            </div>
          </div>
        </div>
      </div>

      <transition name="toast">
        <div v-if="addedFeedback" class="toast">
          <span class="icon has-text-success mr-2">✓</span>
          {{ addedFeedback }}
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
  import {ref, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router';
  import { getMovieDetails } from '../services/yts';
  import type { Movie } from '../types/movie';
  
  const route = useRoute()
  const router = useRouter()
  const movie = ref<Movie | null>(null)
  const loading = ref(false)
  const error = ref('')
  const ytsApiUrl = ref('')
  const downloadPath = ref('')
  const addedFeedback = ref('')
  const loadingTorrent = ref('')
  const existingHashes = ref<string[]>([])
  const trackers = [
    'udp://tracker.opentrackr.org:1337/announce,',
    'udp://tracker.torrent.eu.org:451/announce',
    'udp://tracker.dler.org:6969/announce',
    'udp://open.stealth.si:80/announce',
    'udp://open.demonii.com:1337/announce',
    'https://tracker.moeblog.cn:443/announce',
    'udp://open.dstud.io:6969/announce',
    'udp://tracker.srv00.com:6969/announce',
    'https://tracker.zhuqiy.com:443/announce',
    'https://tracker.pmman.tech:443/announce',
  ]

  async function addTorrent(hash: string, quality: string, type: string) {
    loadingTorrent.value = hash
    try {
      const dn = encodeURIComponent(movie.value?.title ?? '')
      const trackerParams = trackers.map(t => `tr=${encodeURIComponent(t)}`).join('&')
      const magnet = `magnet:?xt=urn:btih:${hash}&dn=${dn}&${trackerParams}`
      await window.electronAPI.torrent.addMagnet(magnet, downloadPath.value)
      existingHashes.value.push(hash.toLowerCase())
      addedFeedback.value = `${quality} ${type} adicionado!`
      setTimeout(() => { addedFeedback.value = '' }, 3000)
    } finally {
      loadingTorrent.value = ''
    }
  }

  onMounted(async () => {
    loading.value = true
    const s = await window.electronAPI.settings.get()
    ytsApiUrl.value = s.ytsApiUrl
    downloadPath.value = s.downloadPath

    const torrents = await window.electronAPI.torrent.list()
    existingHashes.value = torrents.map((t: any) => t.infoHash.toLowerCase())

    try {
      const data = await getMovieDetails(Number(route.params.id), ytsApiUrl.value)
      movie.value = data.movie
    } catch (e: any) {
      error.value = 'Erro ao carregar detalhes do filme'
      console.error(e)
    } finally {
      loading.value = false
    }
  })
</script>

<style scoped>
  .details-layout {
    height: calc(100% + 3rem);
    margin: -1.5rem;
    overflow-y: auto;
    position: relative;
  }

  .details-backdrop {
    width: 100%;
    height: 220px;
    background-size: cover;
    background-position: center top;
    background-color: #1a1a2e;
    filter: brightness(0.4);
    position: absolute;
    top: 0;
    left: 0;
  }

  .details-body {
    position: relative;
    padding: 1.5rem;
  }

  .details-top {
    display: flex;
    gap: 1.5rem;
    align-items: flex-start;
    padding-top: 1rem;
  }

  .details-poster {
    width: 185px;
    min-width: 185px;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  }

  .details-info {
    padding-top: 5rem;
  }

  .details-trailer {
    margin-left: auto;
    align-self: flex-end;
    padding-bottom: 0.5rem;
  }

  .details-trailer iframe {
    border-radius: 8px;
    display: block;
  }

  .screenshots-row {
    display: flex;
    gap: 0.75rem;
  }

  .screenshots-row img {
    flex: 1;
    border-radius: 6px;
    object-fit: cover;
    max-height: 140px;
    width: 0;
  }

  .details-meta {
    color: #ccc;
  }

  .details-lower {
    padding: 1.25rem 0;
  }

  .details-summary {
    line-height: 1.6;
    color: #333;
    font-size: 1rem;
    word-break: normal;
    overflow-wrap: break-word;
  }

  .cast-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    gap: 1rem;
  }

  .cast-card {
    text-align: center;
  }

  .cast-photo {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    object-fit: cover;
    display: block;
    margin: 0 auto 0.4rem;
  }

  .cast-placeholder {
    background: #ddd;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #aaa;
    font-size: 1.5rem;
  }

  .cast-name {
    font-size: 0.7rem;
    font-weight: 600;
    line-height: 1.2;
  }

  .cast-character {
    font-size: 0.65rem;
    color: #888;
    line-height: 1.2;
  }

  .torrent-btn {
    cursor: pointer;
    border: none;
    font-size: 0.75rem;
  }

  .torrent-btn:hover {
    filter: brightness(1.15);
  }

  .torrent-btn:disabled {
    cursor: not-allowed;
    opacity: 0.6;
    pointer-events: auto;
  }

  .torrent-added {
    background-color: #aaa !important;
    border-color: #aaa !important;
  }

  .toast {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    background: #1a1a2e;
    color: #fff;
    padding: 0.85rem 1.25rem;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    font-size: 0.9rem;
    z-index: 100;
    border-left: 4px solid #48c78e;
  }

  .toast-enter-active, .toast-leave-active {
    transition: all 0.3s ease;
  }

  .toast-enter-from, .toast-leave-to {
    opacity: 0;
    transform: translateY(1rem);
  }

  [data-tooltip] {
    position: relative;
  }

  [data-tooltip]:hover::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    background: #1a1a2e;
    color: #fff;
    font-size: 0.7rem;
    padding: 0.3rem 0.6rem;
    border-radius: 4px;
    white-space: nowrap;
    z-index: 10;
    pointer-events: none;
  }
</style>