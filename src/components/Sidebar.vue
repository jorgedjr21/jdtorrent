<template>
  <aside class="sidebar">
    <div class="sidebar-brand">
      <span class="icon has-text-primary mr-2">
        <font-awesome-icon icon="download" size="lg" />
      </span>
      <span class="sidebar-brand-name">JDTorrent</span>
    </div>

    <nav class="sidebar-nav">
      <router-link to="/torrents" class="sidebar-item" active-class="is-active">
        <span class="icon"><font-awesome-icon icon="download" /></span>
        <span>Torrents</span>
      </router-link>

      <router-link
        to="/movies"
        class="sidebar-item"
        :class="{ 'is-active': route.path.startsWith('/movies') }"
      >
        <span class="icon"><font-awesome-icon icon="film" /></span>
        <span>Filmes</span>
      </router-link>
    </nav>

    <div class="sidebar-bottom">
      <router-link to="/settings" class="sidebar-item" active-class="is-active">
        <span class="icon"><font-awesome-icon icon="gear" /></span>
        <span>Configurações</span>
      </router-link>

      <button class="sidebar-item sidebar-logout" @click="electronAPI.app.quit()">
        <span class="icon"><font-awesome-icon icon="power-off" /></span>
        <span>Sair</span>
      </button>

      <div class="sidebar-version">v{{ appVersion }} · {{ commitHash }}</div>
    </div>
  </aside>
</template>

<script setup lang="ts">
  import { useRoute } from 'vue-router'
  const { electronAPI } = window
  const route = useRoute()
  const appVersion = __APP_VERSION__
  const commitHash = __COMMIT_HASH__
</script>

<style scoped>
  .sidebar {
    width: 230px;
    min-width: 230px;
    background-color: var(--sidebar-bg);
    display: flex;
    flex-direction: column;
    padding: 1.5rem 0.75rem;
    gap: 0.25rem;
  }

  .sidebar-brand {
    display: flex;
    align-items: center;
    padding: 0.5rem 0.75rem 1.5rem;
    color: var(--sidebar-text);
  }

  .sidebar-brand-name {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--sidebar-text);
  }

  .sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
  }

  .sidebar-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.7rem 0.75rem;
    border-radius: 8px;
    color: var(--sidebar-text);
    font-size: 0.95rem;
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
    transition: background-color 0.15s ease;
    background: none;
    border: none;
    width: 100%;
    text-align: left;
  }

  .sidebar-item:hover {
    background-color: var(--sidebar-item-hover);
    color: var(--sidebar-text);
  }

  .sidebar-item.is-active {
    background-color: var(--sidebar-item-active);
    color: var(--sidebar-text);
    font-weight: 600;
  }

  .sidebar-item .icon {
    width: 20px;
    text-align: center;
    flex-shrink: 0;
  }

  .sidebar-bottom {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    border-top: 1px solid #1a2e45;
    padding-top: 0.75rem;
    margin-top: 0.5rem;
  }

  .sidebar-logout {
    color: #f87171;
  }

  .sidebar-logout:hover {
    background-color: rgba(248, 113, 113, 0.1);
    color: #f87171;
  }

  .sidebar-version {
    font-size: 0.65rem;
    color: #64748b;
    text-align: center;
    padding-top: 0.75rem;
  }
</style>