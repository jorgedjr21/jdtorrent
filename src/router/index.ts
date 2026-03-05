import { createRouter, createWebHashHistory } from "vue-router";
import TorrentsView from '../views/TorrentsView.vue'
import SettingsView from '../views/SettingsView.vue'
import MoviesView from '../views/MoviesView.vue'
import MovieDetailsView from "../views/MovieDetailsView.vue";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/torrents' },
    { path: '/torrents', component: TorrentsView },
    { path: '/settings', component: SettingsView },
    { path: '/movies',   component: MoviesView },
    { path: '/movies/:id', component: MovieDetailsView}
  ]
})

export default router