
<template>
  <div class="app-layout">
    <Sidebar />
    <div class="main-content">
      <div v-if="updateDownloaded" class="update-banner">
        {{ $t('update.ready') }}
        <button class="button is-small is-white ml-3" @click="installUpdate">{{ $t('update.install') }}</button>
      </div>
      <div v-else-if="updateVersion" class="update-banner">
        {{ $t('update.available', { version: updateVersion }) }}
      </div>
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import Sidebar from './components/Sidebar.vue'
  import { i18n } from './i18n'

  const updateVersion = ref('')
  const updateDownloaded = ref(false)

  onMounted(async () => {
    const s = await window.electronAPI.settings.get()
    i18n.global.locale.value = (s.locale ?? 'pt-BR') as 'pt-BR' | 'en'

    window.electronAPI.updater.onUpdateAvailable((version) => {
      updateVersion.value = version
    })
    window.electronAPI.updater.onUpdateDownloaded(() => {
      updateDownloaded.value = true
    })
  })
  
  function installUpdate() {
    window.electronAPI.updater.install()
  }
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
