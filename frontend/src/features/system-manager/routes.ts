import type { RouteRecordRaw } from 'vue-router'

import SystemManagerView from './SystemManagerView.vue'

export const systemManagerRouteName = 'system-manager'
export const systemManagerPath = 'system-manager'

export const systemManagerRoutes: RouteRecordRaw[] = [
  {
    path: systemManagerPath,
    name: systemManagerRouteName,
    component: SystemManagerView,
  },
]
