import type { AppFeature, FeatureMenuItem } from '../types'
import { systemManagerRoutes } from './routes'

const systemManagerRouteName = String(systemManagerRoutes[0]?.name ?? 'system-manager')

export const systemManagerMenuItems: FeatureMenuItem[] = [
  {
    key: systemManagerRouteName,
    label: 'System Manager',
    routeName: systemManagerRouteName,
  },
]

export const systemManagerFeature: AppFeature = {
  key: systemManagerRouteName,
  routes: systemManagerRoutes,
  menuItems: systemManagerMenuItems,
}
