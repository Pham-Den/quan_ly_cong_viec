import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import { enabledFeatureRoutes } from '../features'
import ProtectedLayout from '../layouts/ProtectedLayout.vue'
import { useSessionStore } from '../stores/session'
import LoginView from '../views/auth/LoginView.vue'
import OidcCallbackView from '../views/auth/OidcCallbackView.vue'
import BranchLifecycleView from '../views/BranchLifecycleView.vue'
import DashboardView from '../views/DashboardView.vue'
import TaskPlanningView from '../views/TaskPlanningView.vue'
import TimelineView from '../views/TimelineView.vue'
import WorkspaceSettingsView from '../views/WorkspaceSettingsView.vue'

// Sprint: v1 | Feature: NFR-004 | Task Group: 02C Browser session cutover
// Contract: API-017–020, PR-001 route cutover | Pack: v1.7.21-oidc-session-error-contracts

const protectedChildRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'dashboard',
    component: DashboardView,
  },
  {
    path: 'settings',
    name: 'settings',
    component: WorkspaceSettingsView,
  },
  {
    path: 'inbox',
    name: 'inbox',
    component: TaskPlanningView,
  },
  {
    path: 'tasks',
    name: 'tasks',
    component: TaskPlanningView,
  },
  {
    path: 'branches',
    name: 'branches',
    component: BranchLifecycleView,
  },
  {
    path: 'timeline',
    name: 'timeline',
    component: TimelineView,
  },
  ...enabledFeatureRoutes,
]

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: ProtectedLayout,
      meta: {
        requiresAuth: true,
      },
      children: protectedChildRoutes,
    },
    {
      path: '/auth/callback',
      name: 'oidc-callback',
      component: OidcCallbackView,
      meta: {
        authCallback: true,
      },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: {
        guestOnly: true,
      },
    },
  ],
})

router.beforeEach(async (to) => {
  const session = useSessionStore()

  if (to.meta.authCallback) return true
  await session.restoreSession()

  if (to.meta.requiresAuth && !session.isAuthenticated) {
    return { name: 'login', query: { returnTo: to.fullPath } }
  }

  if (to.meta.guestOnly && session.isAuthenticated) {
    return { name: 'dashboard' }
  }

  return true
})
