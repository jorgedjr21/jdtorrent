import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import router from './router'
import { i18n } from './i18n'

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
    faDownload, faPlay, faUpload, faPause,
    faCheck, faPlus, faBoxOpen, faUsers,
    faGear, faFolderOpen, faFolder,
    faFilm, faMagnifyingGlass, faStar,
    faUser, faSpinner, faClock,
    faPowerOff, faTrash
    
  } from '@fortawesome/free-solid-svg-icons'
library.add(faDownload, faPlay, faUpload, faPause, 
  faCheck, faPlus, faBoxOpen, faUsers,
  faGear, faFolderOpen, faFolder,
  faFilm, faMagnifyingGlass, faStar,
  faUser, faSpinner, faClock, faPowerOff,
  faTrash
)

const app = createApp(App)
app.component('FontAwesomeIcon', FontAwesomeIcon)
app.use(router)
app.use(i18n)
app.mount("#app")
