<template>
  <div class="modal is-active">
    <div class="modal-background" @click="$emit('close')"></div>
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">Adicionar Torrent</p>
        <button class="delete" @click="$emit('close')"></button>
      </header>

      <section class="modal-card-body">
        <div class="tabs mb-4">
          <ul>
            <li :class="{'is-active': tab === 'file'}">
              <a @click="tab = 'file'">Arquivo .torrent</a>
            </li>
            <li :class="{'is-active': tab === 'magnet'}">
              <a @click="tab = 'magnet'">Magnet Link</a>
            </li>
          </ul>
        </div>

        <div v-if="tab === 'file'">
          <p class="has-text-grey mb-4">
            Selecione um arquivo <code>.torrent</code> no seu computador
          </p>
        </div>

        <div v-if="tab === 'magnet'">
          <div class="field">
            <label for="magnetLink" class="label">Magnet Link</label>
            <div class="control">
              <input 
                type="text" 
                v-model="magnetUri" 
                class="input"
                placeholder="magnet:?xt=urn:bit..."  
              />
            </div>
          </div>
        </div>

        <div class="field mt-4">
          <label for="savePath">Pasta destino</label>
          <input type="text" class="input" readonly :value="downloadPath">
        </div>

        <p v-if="error" class="has-text-danger mt-3">{{ error }}</p>
      </section>

      <footer class="modal-card-foot">
        <button 
          class="button is-primary"
          :class="{'is-loading': loading}"
          :disabled="tab === 'magnet' && !magnetUri"
          @click="submit">
          Adicionar
        </button>
        <button class="button" @click="$emit('close')">Cancelar</button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  const downloadPath = ref('')
  const tab = ref<'file' | 'magnet'>('file')
  const magnetUri = ref('')
  const loading = ref(false)
  const error = ref('')
  const emit = defineEmits<{
    close: []
    added: []
  }>()

  onMounted( async () => {
    const s = await window.electronAPI.settings.get()
    downloadPath.value = s.downloadPath
  })

  async function submit() {
    error.value = ''
    loading.value = true

    try {
      const path = ''

      if (tab.value === 'file') {
        const result = await window.electronAPI.torrent.addFile(path)
        if(!result) { loading.value = false; return}
      } else {
        await window.electronAPI.torrent.addMagnet(magnetUri.value, path)
      }

      emit('added')
      emit('close')
    } catch(e: any) {
      error.value = e?.message ?? 'Erro ao adicionar torrent'
    } finally {
      loading.value = false
    }
  }
</script>