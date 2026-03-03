
<template>
  <div class="app-layout">
    <Sidebar :torrents="torrents", :active-item="activeItem" @navigate="onNavigate"/>
    <main class="main-content">
      <TorrentList v-if="currentView ==='torrents'"/>
      <Settings v-else/>
    </main>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue';
  import Sidebar from './components/Sidebar.vue';
  import TorrentList from './components/TorrentList.vue';
  import Settings from './components/Settings.vue'
  import type { TorrentInfo } from './types/torrent';

  const torrents = ref<TorrentInfo[]>([])
  const activeItem = ref('Todos')
  const currentView = ref<'torrents' | 'settings'>('torrents')
  let interval: ReturnType<typeof setInterval>

  async function fetchTorrents() {
    torrents.value = await window.electronAPI.torrent.list()
  }

  async function onNavigate(label: string) {
    activeItem.value = label
    currentView.value = label === 'Configurações' ? 'settings' : 'torrents'
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