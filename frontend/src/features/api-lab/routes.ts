import type { RouteRecordRaw } from 'vue-router'

export const apiLabRoutes: RouteRecordRaw[] = [
  {
    path: 'api-lab',
    name: 'api-lab',
    component: () => import('./ApiLabView.vue'),
  },
]
