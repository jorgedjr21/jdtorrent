<template>
    <aside class="sidebar p-4">
      <div class="brand mb-5">
        <span class="icon has-text-primary mr-2">
          <font-awesome-icon icon="download" size="lg" />
        </span>
        <span class="has-text-white has-text-weight-bold is-size-5">JDTorrent</span>
      </div>

      <nav class="menu">
        <ul class="menu-list">
          <li v-for="item in menuItems" :key="item.label">
            <a
              :class="{ 'is-active': activeItem === item.label }"
              @click="activeItem = item.label"
            >
              <span class="icon-text">
                <span class="icon">
                  <font-awesome-icon :icon="item.icon" />
                </span>
                <span>{{ item.label }}</span>
              </span>
              <span class="tag is-rounded ml-1">{{ item.count }}</span>
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  </template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import type { TorrentInfo } from '../types/torrent';

  const props = defineProps<{
    torrents: TorrentInfo[]
  }>()

  const activeItem = ref('Todos')

  const menuItems = computed(() => [
    { icon: 'download', label: 'Todos', count: props.torrents.length },
    { icon: 'play', label: 'Baixando', count: props.torrents.filter( t => t.status === 'downloading').length },
    { icon: 'upload', label: 'Semeando', count: props.torrents.filter(t => t.status === 'seeding').length },
    { icon: 'pause', label: 'Pausados', count: props.torrents.filter(t => t.status === 'paused').length },
    { icon: 'check', label: 'Concluídos', count: props.torrents.filter(t => t.status === 'completed').length },
  ])
</script>

<style scoped>
  .sidebar {
    width: 220px;
    background-color: #1a1a2e;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
  }

  .brand {
    display: flex;
    align-items: center;
    border-bottom: 1px solid #2e2e4e;
    padding-bottom: 1rem;
  }

  /* sobrescreve o tema claro do Bulma menu para o fundo escuro */
  .menu .menu-list a {
    color: #b0b0c0;
    border-radius: 6px;
  }

  .menu .menu-list a:hover {
    background-color: #2e2e4e;
    color: #fff;
  }

  .menu .menu-list a.is-active {
    background-color: #2e2e4e;
    color: #fff;
    border-left: 3px solid #3498db;
  }
</style>