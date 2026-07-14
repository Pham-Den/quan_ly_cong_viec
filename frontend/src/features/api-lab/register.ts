import type { AppFeature, FeatureMenuItem } from '../types'
import { apiLabRoutes } from './routes'

export const apiLabMenuItems: FeatureMenuItem[] = [
  {
    key: 'api-lab',
    label: 'API Lab',
    routeName: 'api-lab',
  },
]

export const apiLabFeature: AppFeature = {
  key: 'api-lab',
  routes: apiLabRoutes,
  menuItems: apiLabMenuItems,
}
