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
        <div class="lang-picker">
          <button
            class="lang-btn"
            :class="{ 'is-selected': locale === 'pt-BR' }"
            @click="locale = 'pt-BR'"
          >
            <svg class="flag" viewBox="0 0 60 42" xmlns="http://www.w3.org/2000/svg">
              <rect width="60" height="42" fill="#009c3b"/>
              <polygon points="30,4 56,21 30,38 4,21" fill="#ffdf00"/>
              <circle cx="30" cy="21" r="10" fill="#002776"/>
              <path d="M21,18.5 Q30,14 39,18.5" stroke="white" stroke-width="1.5" fill="none"/>
            </svg>
            <span class="lang-name">Português</span>
          </button>
          <button
            class="lang-btn"
            :class="{ 'is-selected': locale === 'en' }"
            @click="locale = 'en'"
          >
            <svg class="flag" viewBox="0 0 60 42" xmlns="http://www.w3.org/2000/svg">
              <rect width="60" height="42" fill="#B22234"/>
              <rect y="3.23" width="60" height="3.23" fill="white"/>
              <rect y="9.69" width="60" height="3.23" fill="white"/>
              <rect y="16.15" width="60" height="3.23" fill="white"/>
              <rect y="22.61" width="60" height="3.23" fill="white"/>
              <rect y="29.07" width="60" height="3.23" fill="white"/>
              <rect y="35.53" width="60" height="3.23" fill="white"/>
              <rect width="24" height="22.61" fill="#3C3B6E"/>
            </svg>
            <span class="lang-name">English</span>
          </button>
        </div>
      </div>

      <div class="field mt-4">
        <label class="label">{{ $t('settings.torrentPort') }}</label>
        <p class="help mb-2">{{ $t('settings.torrentPortHint') }}</p>
        <div class="control" style="max-width: 160px;">
          <input v-model.number="torrentPort" class="input" type="number" min="0" max="65535" />
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
  const torrentPort = ref(0)
  const saved = ref(false)

  watch(locale, (val) => {
    i18n.global.locale.value = val as 'pt-BR' | 'en'
  })

  onMounted(async () => {
    const s = await window.electronAPI.settings.get()
    downloadPath.value = s.downloadPath
    ytsApiUrl.value = s.ytsApiUrl
    trackersText.value = (s.trackers ?? []).join('\n')
    torrentPort.value = s.torrentPort ?? 0
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
      torrentPort: torrentPort.value,
    })
    saved.value = true
    setTimeout(() => { saved.value = false }, 3000)
  }
</script>

<style scoped>
.lang-picker {
  display: flex;
  gap: 0.75rem;
}

.lang-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 0.6rem 1.1rem;
  border: 2px solid var(--border);
  border-radius: 10px;
  background: var(--bg-card);
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s, opacity 0.15s;
  opacity: 0.5;
}

.lang-btn:hover {
  opacity: 0.8;
  border-color: var(--accent);
}

.lang-btn.is-selected {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  opacity: 1;
}

.flag {
  font-size: 2rem;
  line-height: 1;
}

.lang-name {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-primary);
}
</style>
