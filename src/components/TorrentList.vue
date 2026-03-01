<template>
  <div>
    <div class="is-flex is-justify-content-space-between is-align-items-center mb-5">
      <h1 class="title is-5 mb-0">Todos os torrents</h1>
      <button class="button is-primary is-small">
        <span class="icon">
          <font-awesome-icon icon="plus" />
        </span>
        <span>Adicionar torrent</span>
      </button>
    </div>

    <div v-if="torrents.length === 0" class="has-text-centered mt-6">
      <span class="icon is-large has-text-grey-light">
        <font-awesome-icon icon="box-open" size="3x" />
      </span>
      <p class="is-size-4 has-text-grey mt-3">Nenhum torrent adicionado ainda</p>
      <p class="is-size-8 has-text-grey-light">Clique em "Adicionar torrent" para começar</p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'

  const torrents = ref([])
  </script>