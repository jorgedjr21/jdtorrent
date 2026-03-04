<template>
  <div>
    <div class="is-flex is-justify-content-space-between is-align-items-center mb-4">
      <h1 class="title is-5-mb-0">Torrents</h1>
      <button class="button is-primary is-small" @click="showModal = true">
        <span class="icon"><font-awesome-icon icon="plus"/></span>
        <span>Adicionar torrent</span>
      </button>
    </div>

    <div class="tabs mb-4">
      <ul>
        <li :class="{'is-active': filter === 'all'}">
          <a @click="filter = 'all'">Todos ({{ torrents.length }})</a>
        </li>
        <li :class="{'is-active': filter === 'downloading'}">
          <a @click="filter = 'downloading'">Baixando ({{ count('downloading') }})</a>
        </li>
        <li :class="{'is-active': filter === 'seeding'}">
          <a @click="filter = 'seeding'">Semeando ({{ count('seeding') }})</a>
        </li>
        <li :class="{'is-active': filter === 'paused'}">
          <a @click="filter = 'paused'">Pausado ({{ count('paused') }})</a>
        </li>
        <li :class="{'is-active': filter === 'completed'}">
          <a @click="filter = 'completed'">Completado ({{ count('completed') }})</a>
        </li>
      </ul>
    </div>

    <div v-if="filteredTorrents.length === 0" class="has-text-centered mt-6">
      <span class="icon is-large has-text-grey-light">
        <font-awesome-icon icon="box-open" size="3x" />
      </span>
      <p class="is-size-4 has-text-grey mt-3">Nenhum torrent aqui</p>
    </div>

    <div v-for="torrent in filteredTorrents" :key="torrent.infoHash" class="box mb-3" >
      <div class="is-flex is-justify-content-space-between is-align-items-center mb-3">
        <span class="has-text-weight-semibold">{{ torrent.name }}</span>
        <span class="tag ml-2" :class="statusClass(torrent.status)"> {{ statusLabel(torrent.status) }} </span>
      </div>

      <div class="progress-wrapper mb-2">
        <div
          class="progress-fill"
          :class="torrent.status === 'seeding' ? 'is-success' : 'is-info'"
          :style="{ width: (torrent.progress * 100).toFixed(1) + '%' }"
        ></div>
        <span class="progress-label">{{ (torrent.progress * 100).toFixed(2) }}%</span>
      </div>
      
      <div class="is-flex is-flext-wrap-wrap stats-row">
        <span class="stat-item">
          <font-awesome-icon icon="download" class="mr-1" />
          {{ formatSpeed(torrent.downloadSpeed) }}
        </span>
        <span class="stat-item">
          <font-awesome-icon icon="upload" class="mr-1" />
          {{ formatSpeed(torrent.uploadSpeed) }}
        </span>
        <span class="stat-item">
          <font-awesome-icon icon="users" class="mr-1" />
          {{ torrent.numPeers }} peers
        </span>
        <span class="stat-item">{{ formatSize(torrent.totalSize) }}</span>
      </div>

      <div class="is-flex mt-3" style="gap: 0.5rem;">
        <button
          v-if="torrent.status === 'paused' || torrent.status === 'downloading'"
          class="button is-small"
          :class="[
            torrent.status === 'paused' ? 'is-success' : 'is-warning',
            { 'is-loading': transitioning.includes(torrent.infoHash) }
          ]"
          :disabled="transitioning.includes(torrent.infoHash)"
          @click="toggleTorrent(torrent)"
        >
          <span class="icon">
            <font-awesome-icon :icon="torrent.status === 'paused' ? 'play' : 'pause'" />
          </span>
          <span>{{ torrent.status === 'paused' ? 'Iniciar' : 'Pausar' }}</span>
        </button>
      </div>

      <details class="mt-3">
        <summary class="has-text-grey is-size-7 is-clickable">
          {{ torrent.files.length }} arquivo(s)
        </summary>
        <ul class="mt-2">
          <li
            v-for="file in torrent.files"
            :key="file.path"
            class="is-size-7 has-text-grey-dark"
          >
            {{ file.name }} - {{ formatSize(file.length) }}
          </li>
        </ul>
      </details>
    </div>

    <AddTorrentModal
      v-if="showModal"
      @close="showModal = false"
      @added="fetchTorrents"
    />
  </div>
</template>

<script setup lang="ts">
  import {ref, computed, onMounted, onUnmounted } from 'vue'
  import AddTorrentModal from '../components/AddTorrentModal.vue';
  import type { TorrentInfo } from '../types/torrent';

  type Filter = 'all' | 'downloading' | 'seeding' | 'paused' | 'completed'

  const torrents = ref<TorrentInfo[]>([])
  const showModal = ref(false)
  const filter = ref<Filter>('all')
  const transitioning = ref<string[]>([])
  let interval: ReturnType<typeof setInterval>

  const filteredTorrents = computed(() => {
    if(filter.value === 'all') return torrents.value
    return torrents.value.filter(t => t.status === filter.value)
  })

  function count(status: TorrentInfo['status']) {
    return torrents.value.filter(t => t.status === status).length
  }

  async function fetchTorrents() {
    torrents.value = await window.electronAPI.torrent.list()
  }

  async function toggleTorrent(torrent: TorrentInfo) {
    transitioning.value.push(torrent.infoHash)
    try {
      if(torrent.status === 'paused') {
        await window.electronAPI.torrent.resume(torrent.infoHash)
      }else {
        await window.electronAPI.torrent.pause(torrent.infoHash)
      }
      await fetchTorrents()
    } finally {
      transitioning.value = transitioning.value.filter( h => h !== torrent.infoHash)
    }
  }

  function statusLabel(status: TorrentInfo['status']) {
    const map = {
      downloading: 'Baixando',
      seeding: 'Semeando',
      paused: 'Pausado',
      completed: 'Concluído'
    }

    return map[status]
  }

  function statusClass(status: TorrentInfo['status']) {
    const map = { downloading: 'is-info', seeding: 'is-success', paused: 'is-warning', completed:
'is-success' }
    return map[status]
  }

  function formatSpeed(bytes: number) {
    if (bytes < 1024) return `${bytes} B/s`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB/s`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB/s`
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
  }

  onMounted(() => {
    fetchTorrents()
    interval = setInterval(fetchTorrents, 2000)
  })

  onUnmounted(() => {
    clearInterval(interval)
  })
</script>

<style scoped>
  .stats-row {
    gap: 1rem;
    font-size: 0.8rem;
    color: #666;
  }

  .stat-item {
    display: flex;
    align-items: center;
  }

  .progress-wrapper {
    position: relative;
    background-color: #e8e8e8;
    border-radius: 4px;
    height: 1.2rem;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    transition: width 0.3s ease;
  }

  .progress-fill.is-info { background-color: #3273dc; }
  .progress-fill.is-success { background-color: #48c774; }

  .progress-label {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 0.7rem;
    font-weight: bold;
    color: #333;
    text-shadow: 0 0 4px #fff, 0 0 4px #fff;
  }
</style>