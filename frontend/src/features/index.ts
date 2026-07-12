import { systemManagerFeature } from './system-manager'
import type { AppFeature } from './types'

export const enabledFeatures: AppFeature[] = [
  systemManagerFeature,
]

export const enabledFeatureRoutes = enabledFeatures.flatMap((feature) => feature.routes)
export const enabledFeatureMenuItems = enabledFeatures.flatMap((feature) => feature.menuItems)

export type { AppFeature, FeatureMenuItem } from './types'
