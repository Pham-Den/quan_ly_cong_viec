import type { RouteRecordRaw } from 'vue-router'

export const systemManagerRoutes: RouteRecordRaw[] = [
  {
    path: 'system-manager',
    name: 'system-manager',
    component: () => import('./SystemManagerView.vue'),
  },
]
