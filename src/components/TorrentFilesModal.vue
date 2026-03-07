<template>
  <div class="modal is-active">
    <div class="modal-background" @click="$emit('close')"></div>
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">Selecionar arquivos</p>
        <button class="delete" @click="$emit('close')"></button>
      </header>

      <section class="modal-card-body">
        <div v-if="loading" class="has-text-centered py-5">
          <span class="icon is-large has-text-info">
            <font-awesome-icon icon="spinner" spin size="2x" />
          </span>
          <p class="has-text-grey mt-3">Buscando arquivos do torrent...</p>
        </div>
        <div v-else-if="error" class="has-text-danger">{{ error }}</div>
        <div v-else>
          <p class="is-size-7 has-text-grey mb-3">{{ files.length }} arquivo(s) encontrado(s)</p>
          <div class="is-flex is-justify-content-flex-end mb-2">
            <a class="is-size-7" style="cursor: pointer;" @click="toggleAll">
              {{ selected.length === files.length ? 'Deselecionar todos' : 'Selecionar todos' }}
            </a>
          </div>
          <div v-for="file in files" :key="file.name" class="file-row">
            <label class="checkbox is-flex is-align-items-center" style="gap: 0.5rem; cursor:
pointer;">
              <input type="checkbox" v-model="selected" :value="file.name" />
              <span class="file-name">{{ file.name }}</span>
              <span class="has-text-grey is-size-7 ml-auto">{{ formatSize(file.length) }}</span>
            </label>
          </div>
        </div>
      </section>

      <footer class="modal-card-foot">
        <button
          class="button is-primary"
          :disabled="loading || selected.length === 0"
          @click="$emit('confirm', selected)">
          Baixar selecionados
        </button>
        <button class="button ml-2" @click="$emit('close')">Cancelar</button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { formatSize } from '../utils/torrent'

const props = defineProps<{ magnetUri: string }>()
const emit = defineEmits<{ close: [], confirm: [selectedFiles: string[]] }>()

const files = ref<{ name: string, path: string, length: number }[]>([])
const selected = ref<string[]>([])
const loading = ref(true)
const error = ref('')


function toggleAll() {
  if (selected.value.length === files.value.length) {
    selected.value = []
  } else {
    selected.value = files.value.map(f => f.name)
  }
}

onMounted(async () => {
  try {
    files.value = await window.electronAPI.torrent.peekFiles(props.magnetUri)
    selected.value = files.value.map(f => f.name)
  } catch (e: any) {
    error.value = 'Erro ao buscar arquivos do torrent'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.file-row {
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border);
}
.file-name {
  font-size: 0.85rem;
  word-break: break-all;
}
</style>
