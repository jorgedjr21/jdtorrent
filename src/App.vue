
<template>
  <div class="app-layout">
    <Sidebar/>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
  import Sidebar from './components/Sidebar.vue'
</script>

<style>
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body, #app {
    height: 100%;
  }

  .app-layout {
    display: flex;
    height: 100vh;
  }

  .main-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    background-color: #f5f5f5;
  }

</style>