import { createRouter, createWebHistory } from 'vue-router'

import ProtectedLayout from '../layouts/ProtectedLayout.vue'
import { useSessionStore } from '../stores/session'
import LoginView from '../views/auth/LoginView.vue'
import SetupView from '../views/auth/SetupView.vue'
import DashboardView from '../views/DashboardView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: ProtectedLayout,
      meta: {
        requiresAuth: true,
      },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: DashboardView,
        },
      ],
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: {
        guestOnly: true,
      },
    },
    {
      path: '/setup',
      name: 'setup',
      component: SetupView,
      meta: {
        guestOnly: true,
      },
    },
  ],
})

router.beforeEach(async (to) => {
  const session = useSessionStore()

  await session.restoreSession()

  if (session.setupRequired && to.name !== 'setup') {
    return { name: 'setup' }
  }

  if (!session.setupRequired && to.name === 'setup') {
    return session.isAuthenticated ? { name: 'dashboard' } : { name: 'login' }
  }

  if (to.meta.requiresAuth && !session.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.meta.guestOnly && session.isAuthenticated) {
    return { name: 'dashboard' }
  }

  return true
})
