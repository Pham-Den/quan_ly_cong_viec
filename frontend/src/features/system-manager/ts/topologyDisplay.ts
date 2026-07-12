import { statusTagMeta } from '../../../core/components/statusTag'
import type { TopologyEdgeRecord, TopologyNodeRecord } from './mockTopology'

export function topologyNodeName(nodes: TopologyNodeRecord[], nodeId: string) {
  return nodes.find((node) => node.id === nodeId)?.name ?? nodeId
}

function dependencyName(edge: TopologyEdgeRecord) {
  return edge.label.trim().replace(/\s+(?:\+\d+|\((?:\d+|chưa thêm config)\))$/i, '') || edge.id
}

export function edgeDisplayLabel(edge: TopologyEdgeRecord) {
  const configCount = edge.configItems.length

  return `${dependencyName(edge)} (${configCount || 'chưa thêm config'})`
}

export function topologyStatusLabel(status: string) {
  return statusTagMeta(status).label
}
