<template>
  <div>
    <h1 class="title is-5 mb-5">{{ $t('settings.title') }}</h1>

    <div class="box">
      <label class="label">{{ $t('settings.downloadPath') }}</label>

      <div class="field has-addons">
        <div class="control is-expanded">
          <input type="text" class="input" readonly :value="downloadPath">
        </div>
        <div class="control">
          <button class="button" @click="chooseFolder">{{ $t('settings.chooseFolder') }}</button>
        </div>
      </div>

      <div class="field mt-4">
        <label class="label">{{ $t('settings.ytsApiUrl') }}</label>
        <div class="control">
          <input v-model="ytsApiUrl" class="input" type="text" />
        </div>
      </div>

      <div class="field mt-4">
        <label class="label">{{ $t('settings.language') }}</label>
        <div class="control">
          <div class="select">
            <select v-model="locale">
              <option value="pt-BR">Português (BR)</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </div>

      <div class="field mt-4">
        <label class="label">{{ $t('settings.trackers') }}</label>
        <p class="help mb-2">{{ $t('settings.trackersHint') }}</p>
        <div class="control">
          <textarea v-model="trackersText" class="textarea" rows="8" />
        </div>
      </div>

      <div class="mt-4">
        <button class="button is-primary" @click="save">{{ $t('settings.save') }}</button>
        <span v-if="saved" class="has-text-success ml-3">
          <font-awesome-icon icon="check"/> {{ $t('settings.saved') }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, onMounted } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { i18n } from '../i18n'

  const { locale } = useI18n()

  const downloadPath = ref('')
  const ytsApiUrl = ref('')
  const trackersText = ref('')
  const saved = ref(false)

  watch(locale, (val) => {
    i18n.global.locale.value = val as 'pt-BR' | 'en'
  })

  onMounted(async () => {
    const s = await window.electronAPI.settings.get()
    downloadPath.value = s.downloadPath
    ytsApiUrl.value = s.ytsApiUrl
    trackersText.value = (s.trackers ?? []).join('\n')
    locale.value = s.locale ?? 'pt-BR'
  })

  async function chooseFolder() {
    const folder = await window.electronAPI.settings.chooseFolder()
    if(folder) {
      downloadPath.value = folder
      saved.value = false
    }
  }

  async function save() {
    const trackers = trackersText.value.split('\n').map(l => l.trim()).filter(l => l.length > 0)
    await window.electronAPI.settings.set({
      downloadPath: downloadPath.value,
      ytsApiUrl: ytsApiUrl.value,
      trackers,
      locale: locale.value,
    })
    saved.value = true
    setTimeout(() => { saved.value = false }, 3000)
  }
</script>
