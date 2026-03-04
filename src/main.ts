import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import router from './router'

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
    faDownload, faPlay, faUpload, faPause,
    faCheck, faPlus, faBoxOpen, faUsers,
    faGear, faFolderOpen, faFolder,
    faFilm, faMagnifyingGlass, faStar
  } from '@fortawesome/free-solid-svg-icons'
library.add(faDownload, faPlay, faUpload, faPause, 
  faCheck, faPlus, faBoxOpen, faUsers,
  faGear, faFolderOpen, faFolder,
  faFilm, faMagnifyingGlass, faStar
)

const app = createApp(App)
app.component('font-awesome-icon', FontAwesomeIcon)
app.use(router)
app.mount("#app")
