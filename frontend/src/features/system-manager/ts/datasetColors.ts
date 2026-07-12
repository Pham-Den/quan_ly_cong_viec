import type { CSSProperties } from 'vue'

import { normalizeEnvironmentColor } from './environmentColor'
import type { TopologyEdgeRecord, TopologyNodeRecord } from './mockTopology'
import type { SystemManagerEnvironment, SystemManagerHost } from './service'

const managerColorConfig = {
  hosts: ['#0e7490', '#0f766e', '#4f46e5', '#a16207', '#be123c', '#4d7c0f'],
  nodes: {
    app: '#175cd3',
    component: '#7a2e8f',
    service: '#067647',
  },
  dependencies: {
    request: '#7c3aed',
    read: '#0891b2',
    write: '#dc6803',
    publish: '#c11574',
    consume: '#6941c6',
    proxy: '#475467',
  },
} as const

function hashText(value: string) {
  return value.split('').reduce((hash, char) => hash + char.charCodeAt(0), 0)
}

function paletteColor(value: string, palette: readonly string[]) {
  return palette[hashText(value) % palette.length] ?? palette[0] ?? '#667085'
}

export function rowColorStyle(color: string): CSSProperties {
  return {
    '--manager-row-color': color,
  } as CSSProperties
}

export function environmentColor(environment: SystemManagerEnvironment) {
  return normalizeEnvironmentColor(environment.color, environment.key)
}

export function hostColor(host: SystemManagerHost) {
  return paletteColor(`${host.name}:${host.ip}`, managerColorConfig.hosts)
}

export function nodeColor(node: TopologyNodeRecord) {
  return managerColorConfig.nodes[node.kind] ?? managerColorConfig.nodes.service
}

export function dependencyColor(edge: TopologyEdgeRecord) {
  return managerColorConfig.dependencies[edge.direction] ?? managerColorConfig.dependencies.request
}
