import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { initOneSignal } from './plugins/onesignal'
import './assets/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

// Inicializar OneSignal após montar o app
if (import.meta.env.VITE_ONESIGNAL_APP_ID) {
  initOneSignal()
}
