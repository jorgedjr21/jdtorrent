<template>
  <div>
    <div class="is-flex is-justify-content-space-between is-align-items-center mb-5">
      <h1 class="title is-5 mb-0">Todos os torrents</h1>
      <button class="button is-primary is-small" @click="showModal = true">
        <span class="icon">
          <font-awesome-icon icon="plus" />
        </span>
        <span>Adicionar torrent</span>
      </button>
    </div>

    <div v-if="torrents.length === 0" class="has-text-centered mt-6">
      <span class="icon is-large has-text-grey-light">
        <font-awesome-icon icon="box-open" size="3x" />
      </span>
      <p class="is-size-4 has-text-grey mt-3">Nenhum torrent adicionado ainda</p>
      <p class="is-size-8 has-text-grey-light">Clique em "Adicionar torrent" para começar</p>
    </div>

    <div v-for="torrent in torrents" :key="torrent.infoHash" class="box torrent-card mb-3">
      <div class="is-flex is-justify-content-spece-between is-align-items-center mb-2">
        <span class="has-text-wight-semibold">{{ torrent.name }}</span>
        <span class="tag ml-2" :class="statusClass(torrent.status)">{{ statusLabel(torrent.status) }}</span>
      </div>

      <progress 
        class="progress is-small mb-2"
        :class="torrent.status === 'seeding' ? 'is-success' : 'is-info'"
        :value="torrent.progress"
        max="1"
      ></progress>

      <div class="is-flex is-flex-wrap-wrap stats-row">
        <span class="stat-item">
          <font-awesome-icon icon="download" class="mr-1"/>
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
        <span class="stat-item">{{ (torrent.progress * 100).toFixed(1) }}%</span>
      </div>

      <!-- Botões de ação -->
      <div class="is-flex mt-3" style="gap: 0.5rem;">
        <button
          v-if="torrent.status === 'paused' || torrent.status === 'downloading'"
          class="button is-small"
          :class="torrent.status === 'paused' ? 'is-success' : 'is-warning'"
          @click="toggleTorrent(torrent)"
        >
          <span class="icon">
            <font-awesome-icon :icon="torrent.status === 'paused' ? 'play' : 'pause'" />
          </span>
          <span>{{ torrent.status === 'paused' ? 'Iniciar' : 'Pausar' }}</span>
        </button>
      </div>

      <details class="mt-3">
        <summary class="has-text-gray is-size-7 is-clickable">
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
      @added="onAdded"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue'
  import AddTorrentModal from './AddTorrentModal.vue';
  import type { TorrentInfo } from '../types/torrent';

  const torrents = ref<TorrentInfo[]>([])
  const showModal = ref(false)

  let interval: ReturnType<typeof setInterval>

  async function fetchTorrents() {
    torrents.value = await window.electronAPI.torrent.list();
  }

  async function toggleTorrent(torrent: TorrentInfo) {
    if(torrent.status === 'paused') {
      await window.electronAPI.torrent.resume(torrent.infoHash)
    }else {
      await window.electronAPI.torrent.pause(torrent.infoHash)
    }
    await fetchTorrents();
  }

  function onAdded() {
    fetchTorrents()
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
    const map = {
      downloading: 'is-info',
      seeding: 'is-success',
      paused: 'is-warning',
      completed: 'is-success',
    }
    return map[status];
  }

  function formatSpeed(bytes: number) {
    if(bytes < 1024) return `${bytes} B/s`
    if(bytes < 1024*1024) return `${(bytes / 1024).toFixed(1)} KB/s`

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
</style>