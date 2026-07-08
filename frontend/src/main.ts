import { createApp } from 'vue'
import Antd from 'ant-design-vue'
import { message } from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import './style.css'
import App from './App.vue'
import { router } from './router'
import { configureAuthLifecycle } from './services/api'
import { pinia } from './stores'
import { useSessionStore } from './stores/session'

const app = createApp(App)
let handlingExpiredSession = false

app.use(Antd).use(pinia).use(router)

configureAuthLifecycle({
  onSessionRefreshed: (sessionData) => {
    useSessionStore().setSession(sessionData)
  },
  onSessionExpired: async () => {
    if (handlingExpiredSession) {
      return
    }

    handlingExpiredSession = true

    try {
      const session = useSessionStore()

      if (session.isAuthenticated || session.accessToken || session.refreshToken) {
        message.warning('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.')
      }

      session.clearSession()

      if (router.currentRoute.value.name && router.currentRoute.value.name !== 'login') {
        await router.replace({ name: 'login' })
      }
    } finally {
      handlingExpiredSession = false
    }
  },
})

app.mount('#app')
