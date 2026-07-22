import { createApp } from 'vue'
import Antd from 'ant-design-vue'
import { message } from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'
import './style.css'
import App from './App.vue'
import { createAuthLifecycleHandlers } from './core/auth/auth-lifecycle'
import { router } from './router'
import { configureAuthLifecycle } from './services/api'
import { pinia } from './stores'
import { useSessionStore } from './stores/session'

// Sprint: v1 | Feature: NFR-004 | Task Group: 02C Browser session cutover
// Contract: DS-COMP-012, API-017–020 | Pack: v1.7.21-oidc-session-error-contracts
const app = createApp(App)

app.use(Antd).use(pinia).use(router)

configureAuthLifecycle(createAuthLifecycleHandlers(
  useSessionStore(),
  router,
  () => { message.warning('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.') },
))

app.mount('#app')
