import { api } from '../../../services/api'
import type {
  ConfigItem,
  SystemEnvironment,
  TopologyEdgeRecord,
  TopologyEnvironmentData,
  TopologyNodeRecord,
} from './mockTopology'

export type SystemManagerEnvironment = {
  id: string
  key: SystemEnvironment
  label: string
  description: string | null
  color: string
  sortOrder?: number
}

type ApiTopologyResponse = {
  environment: SystemManagerEnvironment
  nodes: TopologyNodeRecord[]
  edges: TopologyEdgeRecord[]
}

export type SystemManagerHost = {
  id: string
  environmentId: string
  name: string
  ip: string
  description: string | null
  sortOrder: number
}

export type SaveSystemEnvironmentInput = {
  key: string
  name: string
  description?: string
  color?: string
  sortOrder?: number
}

export type SaveSystemHostInput = {
  environmentKey: SystemEnvironment
  name: string
  ip: string
  description?: string
  sortOrder?: number
}

export type SaveSystemNodeInput = {
  environmentKey: SystemEnvironment
  hostId?: string
  code: string
  name: string
  kind: string
  type: string
  status: string
  description?: string
  tags?: string[]
  containerName?: string
  image?: string
  ports?: string[]
  network?: string
  notes?: string
  positionX?: number
  positionY?: number
  configs?: Array<{
    name: string
    items: ConfigItem[]
  }>
}

export type SaveSystemDependencyInput = {
  environmentKey: SystemEnvironment
  code: string
  sourceCode: string
  targetCode: string
  label: string
  connectionType: string
  direction: string
  port?: string
  description?: string
  configItems?: ConfigItem[]
  sortOrder?: number
}

function uniqueConfigItems(items: ConfigItem[]) {
  const seen = new Set<string>()

  return items.filter((item) => {
    if (seen.has(item.key)) {
      return false
    }

    seen.add(item.key)
    return true
  })
}

function collapsedEdgeLabel(items: ConfigItem[], fallback: string) {
  const firstKey = items[0]?.key

  if (!firstKey) {
    return fallback
  }

  return items.length > 1 ? `${firstKey} +${items.length - 1}` : firstKey
}

function appRootKey(node: TopologyNodeRecord) {
  const id = node.id.toLowerCase()

  return id.endsWith('-app') ? id.slice(0, -4) : id
}

function componentBelongsToApp(componentNode: TopologyNodeRecord, appNode: TopologyNodeRecord) {
  return componentNode.kind === 'component' && componentNode.id.toLowerCase().startsWith(`${appRootKey(appNode)}-`)
}

function appNodeScore(appNode: TopologyNodeRecord, nodes: TopologyNodeRecord[], edges: TopologyEdgeRecord[]) {
  const directEdgeCount = edges.filter((edge) => edge.source === appNode.id).length
  const componentCount = nodes.filter((node) => componentBelongsToApp(node, appNode)).length
  const canonicalNameScore = appNode.id.toLowerCase().endsWith('-app') ? 0 : 1

  return directEdgeCount * 1000 + componentCount * 100 + canonicalNameScore
}

function chooseCollapsedAppNode(nodes: TopologyNodeRecord[], edges: TopologyEdgeRecord[]) {
  const appNodes = nodes.filter((node) => node.kind === 'app')

  return (
    appNodes
      .map((node) => ({
        node,
        score: appNodeScore(node, nodes, edges),
      }))
      .sort((left, right) => right.score - left.score || left.node.id.localeCompare(right.node.id))[0]?.node ??
    nodes[0]
  )
}

function relatedCollapsedEdges(
  appNode: TopologyNodeRecord,
  nodes: TopologyNodeRecord[],
  edges: TopologyEdgeRecord[],
) {
  const componentIds = new Set(
    nodes.filter((node) => componentBelongsToApp(node, appNode)).map((node) => node.id),
  )

  const relatedEdges = edges.filter((edge) => edge.source === appNode.id || componentIds.has(edge.source))

  return relatedEdges.length ? relatedEdges : edges
}

function buildCollapsedEdges(appNode: TopologyNodeRecord, edges: TopologyEdgeRecord[]) {
  const grouped = new Map<string, TopologyEdgeRecord[]>()

  for (const edge of edges) {
    const group = grouped.get(edge.target) ?? []

    group.push(edge)
    grouped.set(edge.target, group)
  }

  return Array.from(grouped.entries()).map(([target, targetEdges]) => {
    const configItems = uniqueConfigItems(targetEdges.flatMap((edge) => edge.configItems))
    const firstEdge = targetEdges[0]

    return {
      id: `collapsed-${appNode.id}-${target}`,
      source: appNode.id,
      target,
      label: firstEdge ? collapsedEdgeLabel([], firstEdge.label) : 'dependency',
      connectionType: firstEdge?.connectionType ?? 'dependency',
      direction: firstEdge?.direction ?? 'request',
      port: firstEdge?.port ?? '',
      description: targetEdges.map((edge) => edge.description).filter(Boolean).join(' '),
      configItems,
    } satisfies TopologyEdgeRecord
  }).sort((left, right) => left.id.localeCompare(right.id)).map((edge, index) => ({
    ...edge,
    id: `${edge.id}-${index}`,
  }))
}

function toTopologyData(response: ApiTopologyResponse): TopologyEnvironmentData {
  const appNode = chooseCollapsedAppNode(response.nodes, response.edges)
  const collapsedEdges = appNode ? buildCollapsedEdges(appNode, relatedCollapsedEdges(appNode, response.nodes, response.edges)) : []
  const collapsedServiceIds = new Set(collapsedEdges.map((edge) => edge.target))
  const serviceNodes = response.nodes.filter((node) => node.kind === 'service')
  const collapsedServices = collapsedServiceIds.size
    ? serviceNodes.filter((node) => collapsedServiceIds.has(node.id))
    : serviceNodes

  return {
    key: response.environment.key,
    label: response.environment.label,
    color: response.environment.color,
    collapsedNodes: appNode ? [appNode, ...collapsedServices] : collapsedServices,
    collapsedEdges,
    expandedNodes: response.nodes,
    expandedEdges: response.edges,
  }
}

export async function loadSystemManagerEnvironments() {
  const { data } = await api.get<SystemManagerEnvironment[]>('/api/system-manager/environments')

  return data
}

export async function loadSystemManagerTopology(environment: SystemEnvironment) {
  const { data } = await api.get<ApiTopologyResponse>(
    `/api/system-manager/topology?environment=${encodeURIComponent(environment)}`,
  )

  return toTopologyData(data)
}

export async function createSystemManagerEnvironment(payload: SaveSystemEnvironmentInput) {
  const { data } = await api.post<SystemManagerEnvironment>('/api/system-manager/environments', payload)

  return data
}

export async function updateSystemManagerEnvironment(
  environmentId: string,
  payload: SaveSystemEnvironmentInput,
) {
  const { data } = await api.patch<SystemManagerEnvironment>(
    `/api/system-manager/environments/${encodeURIComponent(environmentId)}`,
    payload,
  )

  return data
}

export async function deleteSystemManagerEnvironment(environmentId: string) {
  await api.delete(`/api/system-manager/environments/${encodeURIComponent(environmentId)}`)
}

export async function loadSystemManagerHosts(environment: SystemEnvironment) {
  const { data } = await api.get<SystemManagerHost[]>(
    `/api/system-manager/hosts?environment=${encodeURIComponent(environment)}`,
  )

  return data
}

export async function createSystemManagerHost(payload: SaveSystemHostInput) {
  const { data } = await api.post<SystemManagerHost>('/api/system-manager/hosts', payload)

  return data
}

export async function updateSystemManagerHost(hostId: string, payload: SaveSystemHostInput) {
  const { data } = await api.patch<SystemManagerHost>(
    `/api/system-manager/hosts/${encodeURIComponent(hostId)}`,
    payload,
  )

  return data
}

export async function deleteSystemManagerHost(hostId: string) {
  await api.delete(`/api/system-manager/hosts/${encodeURIComponent(hostId)}`)
}

export async function createSystemManagerNode(payload: SaveSystemNodeInput) {
  await api.post('/api/system-manager/nodes', payload)
}

export async function updateSystemManagerNode(nodeCode: string, payload: SaveSystemNodeInput) {
  await api.patch(
    `/api/system-manager/nodes/${encodeURIComponent(nodeCode)}?environment=${encodeURIComponent(payload.environmentKey)}`,
    payload,
  )
}

export async function deleteSystemManagerNode(environment: SystemEnvironment, nodeCode: string) {
  await api.delete(
    `/api/system-manager/nodes/${encodeURIComponent(nodeCode)}?environment=${encodeURIComponent(environment)}`,
  )
}

export async function createSystemManagerDependency(payload: SaveSystemDependencyInput) {
  await api.post('/api/system-manager/dependencies', payload)
}

export async function updateSystemManagerDependency(
  dependencyCode: string,
  payload: SaveSystemDependencyInput,
) {
  await api.patch(
    `/api/system-manager/dependencies/${encodeURIComponent(dependencyCode)}?environment=${encodeURIComponent(payload.environmentKey)}`,
    payload,
  )
}

export async function deleteSystemManagerDependency(
  environment: SystemEnvironment,
  dependencyCode: string,
) {
  await api.delete(
    `/api/system-manager/dependencies/${encodeURIComponent(dependencyCode)}?environment=${encodeURIComponent(environment)}`,
  )
}
