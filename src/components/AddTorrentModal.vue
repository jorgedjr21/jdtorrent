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
          <p class="has-text-grey mb-3">Selecione um arquivo <code>.torrent</code> do seu computador</p>
          <button class="button is-info" @click="submit()">
            <span class="icon"><font-awesome-icon icon="folder-open" /></span>
            <span>Escolher arquivo .torrent</span>
          </button>
        </div>

        <div v-if="tab === 'magnet'">
          <div class="field">
            <label for="magnetLink" class="label">Magnet Link</label>
            <div class="control">
              <input 
                v-model="magnetUri" 
                type="text" 
                class="input"
                placeholder="magnet:?xt=urn:bit..."  
              />
            </div>
          </div>
        </div>

        <div class="field mt-4">
          <label class="label is-small has-text-grey">
            <font-awesome-icon icon="folder" class="mr-1"/>
            Pasta de download
            <span class="has-text-grey-light is-size-7">(alterar em Configurações)</span>
          </label>
          <input class="input has-background-light" style="cursor: default; color: #666;"
            type="text" readonly :value="downloadPath" />
        </div>

        <p v-if="error" class="has-text-danger mt-3">{{ error }}</p>
      </section>

      <footer class="modal-card-foot">
        <button
          v-if="tab === 'magnet'"
          class="button is-primary"
          :class="{'is-loading': loading}"
          :disabled="!magnetUri"
          @click="submit">
          Adicionar
        </button>
        <button class="button ml-2" @click="$emit('close')">Cancelar</button>
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