import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
    faDownload, faPlay, faUpload, faPause,
    faCheck, faPlus, faBoxOpen
  } from '@fortawesome/free-solid-svg-icons'
library.add(faDownload, faPlay, faUpload, faPause, faCheck, faPlus, faBoxOpen)

const app = createApp(App)
app.component('font-awesome-icon', FontAwesomeIcon)
app.mount("#app")
