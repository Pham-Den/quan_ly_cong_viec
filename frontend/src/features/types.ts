import type { RouteRecordRaw } from 'vue-router'

export type FeatureMenuItem = {
  key: string
  label: string
  routeName: string
}

export type AppFeature = {
  key: string
  routes: RouteRecordRaw[]
  menuItems: FeatureMenuItem[]
}
