import type { TopologyNodeRecord } from './mockTopology'

export type GraphPoint = {
  x: number
  y: number
}

export type HostGraphGroup = {
  id: string
  host: string
  ip: string
  nodeIds: string[]
  position: GraphPoint
  width: number
  height: number
  color: string
}

export type HostGraphLayout = {
  groups: HostGraphGroup[]
  nodeRelativePositions: Record<string, GraphPoint>
  nodeGroupIds: Record<string, string>
}

const hostFramePadding = {
  top: 58,
  right: 32,
  bottom: 32,
  left: 32,
}
const renderedNodeSize = {
  width: 238,
  height: 126,
}
const minimumHostFrameSize = {
  width: 320,
  height: 210,
}
const hostPalette = ['#0e7490', '#0f766e', '#4f46e5', '#a16207', '#be123c', '#4d7c0f']

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function slug(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  return normalized || 'unknown'
}

function hashText(value: string) {
  return value.split('').reduce((hash, char) => hash + char.charCodeAt(0), 0)
}

function hostColor(value: string) {
  return hostPalette[hashText(value) % hostPalette.length] ?? hostPalette[0]
}

function hostIdentity(node: TopologyNodeRecord) {
  const hostId = text(node.runtime.hostId)
  const host = text(node.runtime.host)
  const ip = text(node.runtime.ip)

  if (!hostId && !host) {
    return null
  }

  return {
    id: `host:${hostId || slug(`${host}-${ip}`)}`,
    host: host || hostId,
    ip: ip || 'Chưa gắn IP',
  }
}

export function buildHostGraphLayout(
  nodes: TopologyNodeRecord[],
  absolutePosition: (node: TopologyNodeRecord) => GraphPoint,
): HostGraphLayout {
  const grouped = new Map<string, { host: string; ip: string; nodes: TopologyNodeRecord[] }>()

  for (const node of nodes) {
    const identity = hostIdentity(node)

    if (!identity) {
      continue
    }

    const group = grouped.get(identity.id) ?? {
      host: identity.host,
      ip: identity.ip,
      nodes: [],
    }

    group.nodes.push(node)
    grouped.set(identity.id, group)
  }

  const groups: HostGraphGroup[] = []
  const nodeRelativePositions: Record<string, GraphPoint> = {}
  const nodeGroupIds: Record<string, string> = {}

  for (const [id, group] of grouped.entries()) {
    const positions = group.nodes.map((node) => ({
      node,
      position: absolutePosition(node),
    }))
    const minX = Math.min(...positions.map(({ position }) => position.x))
    const minY = Math.min(...positions.map(({ position }) => position.y))
    const maxX = Math.max(...positions.map(({ position }) => position.x + renderedNodeSize.width))
    const maxY = Math.max(...positions.map(({ position }) => position.y + renderedNodeSize.height))
    const origin = {
      x: Math.round(minX - hostFramePadding.left),
      y: Math.round(minY - hostFramePadding.top),
    }
    const width = Math.max(
      minimumHostFrameSize.width,
      Math.round(maxX - minX + hostFramePadding.left + hostFramePadding.right),
    )
    const height = Math.max(
      minimumHostFrameSize.height,
      Math.round(maxY - minY + hostFramePadding.top + hostFramePadding.bottom),
    )

    groups.push({
      id,
      host: group.host,
      ip: group.ip,
      nodeIds: group.nodes.map((node) => node.id),
      position: origin,
      width,
      height,
      color: hostColor(id),
    })

    for (const { node, position } of positions) {
      nodeGroupIds[node.id] = id
      nodeRelativePositions[node.id] = {
        x: Math.round(position.x - origin.x),
        y: Math.round(position.y - origin.y),
      }
    }
  }

  groups.sort((a, b) => a.position.x - b.position.x || a.position.y - b.position.y)

  return {
    groups,
    nodeRelativePositions,
    nodeGroupIds,
  }
}

export function hostGroupStyle(group: HostGraphGroup): Record<string, string> {
  return {
    width: `${group.width}px`,
    height: `${group.height}px`,
    '--host-frame-color': group.color,
  }
}
