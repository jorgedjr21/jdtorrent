
<template>
  <div class="app-layout">
    <Sidebar :torrents="torrents"/>
    <main class="main-content">
      <TorrentList />
    </main>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue';
  import Sidebar from './components/Sidebar.vue';
  import TorrentList from './components/TorrentList.vue';
  import type { TorrentInfo } from './types/torrent';

  const torrents = ref<TorrentInfo[]>([])
  let interval: ReturnType<typeof setInterval>

  async function fetchTorrents() {
    torrents.value = await window.electronAPI.torrent.list()
  }

  onMounted(() => {
    fetchTorrents();
    interval = setInterval(fetchTorrents, 2000)
  })

  onUnmounted(() => {
    clearInterval(interval)
  })
</script>

<style>
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body, #app {
    height: 100%;
  }

  .app-layout {
    display: flex;
    height: 100vh;
  }

  .main-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    background-color: #f5f5f5;
  }

</style>