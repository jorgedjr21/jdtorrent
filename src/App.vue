
<template>
  <div class="app-layout">
    <Sidebar />
    <div class="main-content">
      <div v-if="updateDownloaded" class="update-banner">
        Nova versão pronta para instalar.
        <button class="button is-small is-white ml-3" @click="installUpdate">Reiniciar e
instalar</button>
      </div>
      <div v-else-if="updateVersion" class="update-banner">
        Nova versão {{ updateVersion }} disponível, baixando...
      </div>
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted} from 'vue'
  import Sidebar from './components/Sidebar.vue'

  const updateVersion = ref('')
  const updateDownloaded = ref(false)

  onMounted(() =>{
    window.electronAPI.updater.onUpdateAvailable((version) => {
      updateVersion.value = version
    })
    window.electronAPI.updater.onUpdateDownloaded(() => {
      updateDownloaded.value = true
    })

    function installUpdate() {
      window.electronAPI.updater.install()
    }
  })
</script>

<style>
.update-banner {
  background-color: #2563eb;
  color: #fff;
  padding: 0.5rem 1rem;
  margin: -1.5rem -1.5rem 1rem -1.5rem;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
}
</style>
