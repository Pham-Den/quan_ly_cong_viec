import type { AppFeature, FeatureMenuItem } from '../types'
import { systemManagerRouteName, systemManagerRoutes } from './routes'

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
