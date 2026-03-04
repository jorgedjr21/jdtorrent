import { createRouter, createWebHashHistory } from "vue-router";
import TorrentsView from '../views/TorrentsView.vue'
import SettingsView from '../views/SettingsView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/torrents' },
    { path: '/torrents', component: TorrentsView },
    { path: '/settings', component: SettingsView }
  ]
})

export default router