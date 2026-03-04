<template>
  <div>
    <h1 class="title is-5-mb-5">Configurações</h1>

    <div class="box">
      <label class="label">Pasta de download padrão</label>

      <div class="field has-addons">
        <div class="control is-expanded">
          <input type="text" class="input" readonly :value="downloadPath">
        </div>
        <div class="control">
          <button class="button" @click="chooseFolder">Escolher pasta</button>
        </div>
      </div>

      <div class="field mt-4">
        <label class="label">URL da API YTS</label>
        <div class="control">
          <input class="input" type="text" v-model="ytsApiUrl" />
        </div>
      </div>

      <div class="mt-4">
        <button class="button is-primary" @click="save">Salvar</button>
        <span v-if="saved" class="has-text-success ml-3">
          <font-awesome-icon icon="check"/> Configurações salvas!
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'

  const downloadPath = ref('')
  const ytsApiUrl = ref('')
  const saved = ref(false)

  onMounted(async () => {
    const s = await window.electronAPI.settings.get()
    downloadPath.value = s.downloadPath
    ytsApiUrl.value = s.ytsApiUrl
  })

  async function chooseFolder() {
    const folder = await window.electronAPI.settings.chooseFolder()
    if(folder) {
      downloadPath.value = folder
      saved.value = false
    }
  }

  async function save() {
    await window.electronAPI.settings.set({ downloadPath: downloadPath.value, ytsApiUrl: ytsApiUrl.value})
    saved.value = true
    setTimeout(() => { saved.value = false}, 3000)
  }
</script>
