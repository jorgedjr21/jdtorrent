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
        <li>
          <router-link to="/torrents" active-class="is-active">
            <span class="icon-text">
              <span class="icon"><font-awesome-icon icon="download" /></span>
              <span>Torrents</span>
            </span>
          </router-link>
        </li>
        <li>
          <router-link to="/movies"
            :class="{ 'is-active': route.path.startsWith('/movies') }"
          >
            <span class="icon-text">
              <span class="icon"><font-awesome-icon icon="film" /></span>
              <span>Filmes</span>
            </span>
          </router-link>
        </li>
      </ul>
    </nav>

    <div class="settings-item mt-auto">
      <router-link to="/settings" active-class="is-active">
        <span class="icon-text">
          <span class="icon"><font-awesome-icon icon="gear" /></span>
          <span>Configurações</span>
        </span>
      </router-link>
    </div>

    <div class="quit-item mt-2">
      <button class="quit-btn" @click="electronAPI.app.quit()">
        <span class="icon-text">
          <span class="icon"><font-awesome-icon icon="power-off" /></span>
          <span>Sair</span>
        </span>
      </button>
    </div>

    <div class="version-info">
      v{{ app_version }} - {{  commitHash }}
    </div>
  </aside>
</template>

<script setup lang="ts">
  import { useRoute } from 'vue-router'
  const { electronAPI } = window
  const route = useRoute()
  const app_version = __APP_VERSION__
  const commitHash = __COMMIT_HASH__
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
  .menu .menu-list a, .settings-item a {
    color: #fff;
    border-radius: 6px;
    display: flex;
    align-items: center;
    padding: 0.5em 0.75em;
    cursor: pointer;
    background-color: #2e2e4e;
  }

  .menu .menu-list a:hover, .settings-item a:hover {
    background-color: #2e2e4e;
    color: #fff;
  }

  .menu .menu-list a.is-active, .settings-item a.is-active {
    background-color: #2e2e4e;
    color: #fff;
    border-left: 3px solid #3498db;
    border-bottom: 3px solid #3498db;
  }

  .settings-item {  
    border-top: 1px solid #2e2e4e;
    padding-top: 0.75rem;
  }

  .quit-item {
    padding-top: 0.5rem;
  }

  .quit-btn {
    width: 100%;
    background: none;
    border: none;
    color: #ff6b6b;
    border-radius: 6px;
    display: flex;
    align-items: center;
    padding: 0.5em 0.75em;
    cursor: pointer;
    font-size: 1rem;
  }

  .quit-btn:hover {
    background-color: rgba(255, 107, 107, 0.15);
  }

  .version-info {
    font-size: 0.65rem;
    color: #555;
    text-align: center;
    padding-top: 0.5rem;
  }
</style>