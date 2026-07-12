<script setup lang="ts">
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import {
  BaseEdge,
  EdgeLabelRenderer,
  Handle,
  Position,
  VueFlow,
  getSmoothStepPath,
  useVueFlow,
  type Edge,
  type EdgeProps,
  type NodeDragEvent,
  type Node,
} from '@vue-flow/core'
import { MiniMap } from '@vue-flow/minimap'
import {
  AimOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  NodeCollapseOutlined,
  NodeExpandOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { computed, h, nextTick, onMounted, ref, watch, type CSSProperties } from 'vue'

import {
  loadSystemManagerEnvironments,
  loadSystemManagerTopology,
  type SystemManagerEnvironment,
} from './ts/service'
import StatusTag from '../../core/components/StatusTag.vue'
import SystemManagerDetailPanel from './components/SystemManagerDetailPanel.vue'
import SystemManagerManageDrawer from './components/SystemManagerManageDrawer.vue'
import SystemManagerQuickConfigPopover from './components/SystemManagerQuickConfigPopover.vue'
import SystemManagerSettingsDrawer from './components/SystemManagerSettingsDrawer.vue'
import {
  loadSystemManagerLocalState,
  saveSystemManagerLocalState,
  type LocalNodePosition,
  type SystemManagerLocalState,
  type SystemManagerSettings,
} from './ts/localState'
import { normalizeEnvironmentColor } from './ts/environmentColor'
import {
  edgeDisplayLabel,
  topologyNodeName,
  topologyStatusLabel,
} from './ts/topologyDisplay'
import {
  type ConfigItem,
  type SystemEnvironment,
  type TopologyEdgeRecord,
  type TopologyNodeRecord,
  type TopologyEnvironmentData,
} from './ts/mockTopology'

type FlowNodeData = {
  record: TopologyNodeRecord
  active: boolean
  dimmed: boolean
}

type FlowEdgeData = {
  record: TopologyEdgeRecord
}

type FlowNode = Node<FlowNodeData>
type FlowEdge = Edge<FlowEdgeData>
type ConfigEdgeProps = EdgeProps<FlowEdgeData>

type SearchGroup = 'Apps' | 'Services' | 'Hosts' | 'Configs' | 'IPs'

type SearchResult = {
  id: string
  group: SearchGroup
  label: string
  description: string
  targetType: 'node' | 'edge'
  targetId: string
}

const persistedState = ref(loadSystemManagerLocalState())
const settings = ref<SystemManagerSettings>({ ...persistedState.value.settings })
const selectedEnvironment = ref<SystemEnvironment>(persistedState.value.selectedEnvironment ?? 'local')
const appExpanded = ref(initialAppExpanded())
const selectedNodeId = ref(persistedState.value.selectedNodeId || 'b2p-app')
const selectedEdgeId = ref(persistedState.value.selectedEdgeId)
const quickConfigEdgeId = ref('')
const quickConfigPosition = ref({ x: 0, y: 0 })
const activeTab = ref(persistedState.value.activeTab || 'overview')
const searchQuery = ref('')
const revealedConfigKeys = ref<Set<string>>(new Set())
const flowActive = ref(false)
const flowStartId = ref(persistedState.value.selectedNodeId || 'b2p-app')
const loadingTopology = ref(false)
const topologyError = ref('')
const manageOpen = ref(false)
const settingsOpen = ref(false)
const detailPanelCollapsed = ref(initialDetailPanelCollapsed())
const suppressEnvironmentWatch = ref(false)
const environments = ref<SystemManagerEnvironment[]>([])
const topologies = ref<Partial<Record<SystemEnvironment, TopologyEnvironmentData>>>({})
const localNodePositions = ref<Record<string, LocalNodePosition>>({ ...persistedState.value.nodePositions })
const { fitView } = useVueFlow()

const emptyTopology: TopologyEnvironmentData = {
  key: 'local',
  label: 'Local',
  color: '#475467',
  collapsedNodes: [],
  collapsedEdges: [],
  expandedNodes: [],
  expandedEdges: [],
}

function initialAppExpanded() {
  if (settings.value.defaultGraphView === 'expanded') {
    return true
  }

  if (settings.value.defaultGraphView === 'collapsed') {
    return false
  }

  return persistedState.value.appExpanded
}

function initialDetailPanelCollapsed() {
  if (settings.value.detailPanelDefault === 'open') {
    return false
  }

  if (settings.value.detailPanelDefault === 'collapsed') {
    return true
  }

  return persistedState.value.detailPanelCollapsed
}

function defaultAppExpanded() {
  return settings.value.defaultGraphView === 'expanded'
}

function environmentOptionLabel(environment: SystemManagerEnvironment) {
  return h(
    'span',
    {
      class: 'environment-option-label',
      style: { '--environment-color': normalizeEnvironmentColor(environment.color, environment.key) } as CSSProperties,
    },
    [h('span', { class: 'environment-option-dot' }), h('span', environment.label)],
  )
}

const environmentOptions = computed(() =>
  environments.value.map((environment) => ({
    label: environmentOptionLabel(environment),
    title: environment.label,
    value: environment.key,
    className: 'environment-segmented-option',
  })),
)
const topology = computed(() => topologies.value[selectedEnvironment.value] ?? emptyTopology)
const selectedEnvironmentRecord = computed(() =>
  environments.value.find((environment) => environment.key === selectedEnvironment.value),
)
const selectedEnvironmentColor = computed(() =>
  normalizeEnvironmentColor(
    selectedEnvironmentRecord.value?.color ?? topology.value.color,
    selectedEnvironment.value,
  ),
)
const environmentThemeStyle = computed(() => ({
  '--environment-active-color': selectedEnvironmentColor.value,
}))
const visibleNodes = computed(() =>
  appExpanded.value ? topology.value.expandedNodes : topology.value.collapsedNodes,
)
const visibleEdges = computed(() =>
  appExpanded.value ? topology.value.expandedEdges : topology.value.collapsedEdges,
)
const selectedNode = computed(
  () => visibleNodes.value.find((node) => node.id === selectedNodeId.value) ?? visibleNodes.value[0] ?? null,
)
const selectedEdge = computed(
  () => visibleEdges.value.find((edge) => edge.id === selectedEdgeId.value) ?? null,
)
const quickConfigEdge = computed(
  () => visibleEdges.value.find((edge) => edge.id === quickConfigEdgeId.value) ?? null,
)
const quickConfigPopoverStyle = computed(() => ({
  left: `${quickConfigPosition.value.x}px`,
  top: `${quickConfigPosition.value.y}px`,
}))
const quickConfigItems = computed(() => {
  const edge = quickConfigEdge.value

  if (!edge) {
    return []
  }

  return edge.configItems.map((item) => ({
    ...item,
    displayValue: configDisplayValue(item, edge.id),
  }))
})
const outgoingBySource = computed(() => groupEdgesBy('source'))
const incomingByTarget = computed(() => groupEdgesBy('target'))
const downstreamEdgeIds = computed(() => {
  if (!flowActive.value) {
    return new Set<string>()
  }

  return collectDownstream(flowStartId.value).edgeIds
})
const downstreamNodeIds = computed(() => {
  if (!flowActive.value) {
    return new Set<string>()
  }

  return collectDownstream(flowStartId.value).nodeIds
})
const hasHighlight = computed(
  () => flowActive.value || Boolean(selectedNodeId.value) || Boolean(selectedEdgeId.value),
)

const flowNodes = computed<FlowNode[]>(() =>
  visibleNodes.value.map((node) => {
    const active =
      selectedNodeId.value === node.id ||
      downstreamNodeIds.value.has(node.id) ||
      Boolean(selectedEdge.value && [selectedEdge.value.source, selectedEdge.value.target].includes(node.id))
    const dimmed = hasHighlight.value && !active && !isNodeNeighbor(node.id)

    return {
      id: node.id,
      type: 'topology',
      position: nodePosition(node),
      data: {
        record: node,
        active,
        dimmed,
      },
      draggable: true,
    }
  }),
)

const flowEdges = computed<FlowEdge[]>(() =>
  visibleEdges.value.map((edge) => {
    const active = selectedEdgeId.value === edge.id || downstreamEdgeIds.value.has(edge.id)
    const dimmed = hasHighlight.value && !active && !isEdgeNeighbor(edge)

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'config',
      animated: active,
      data: {
        record: edge,
      },
      class: [
        'system-manager-edge',
        active ? 'system-manager-edge-active' : '',
        dimmed ? 'system-manager-edge-dimmed' : '',
      ]
        .filter(Boolean)
        .join(' '),
      style: {
        strokeWidth: active ? 2.6 : 1.6,
      },
    }
  }),
)

const groupedSearchResults = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const groups: Record<SearchGroup, SearchResult[]> = {
    Apps: [],
    Services: [],
    Hosts: [],
    Configs: [],
    IPs: [],
  }

  if (!query) {
    return groups
  }

  for (const node of visibleNodes.value) {
    const text = [node.name, node.type, node.description, node.runtime.host, node.runtime.ip].join(' ').toLowerCase()

    if (text.includes(query)) {
      groups[node.kind === 'service' ? 'Services' : 'Apps'].push({
        id: `node:${node.id}`,
        group: node.kind === 'service' ? 'Services' : 'Apps',
        label: node.name,
        description: `${node.type} - ${topologyStatusLabel(node.status)}`,
        targetType: 'node',
        targetId: node.id,
      })
    }

    if (node.runtime.host.toLowerCase().includes(query)) {
      groups.Hosts.push({
        id: `host:${node.id}`,
        group: 'Hosts',
        label: node.runtime.host,
        description: node.name,
        targetType: 'node',
        targetId: node.id,
      })
    }

    if (node.runtime.ip.toLowerCase().includes(query)) {
      groups.IPs.push({
        id: `ip:${node.id}`,
        group: 'IPs',
        label: node.runtime.ip,
        description: `${node.runtime.host} - ${node.name}`,
        targetType: 'node',
        targetId: node.id,
      })
    }
  }

  for (const edge of visibleEdges.value) {
    const configText = edge.configItems.map((item) => `${item.key} ${item.value}`).join(' ')
    const text = [edge.label, edge.connectionType, edge.description, configText].join(' ').toLowerCase()

    if (text.includes(query)) {
      groups.Configs.push({
        id: `edge:${edge.id}`,
        group: 'Configs',
        label: edgeDisplayLabel(edge),
        description: `${nodeName(edge.source)} -> ${nodeName(edge.target)}`,
        targetType: 'edge',
        targetId: edge.id,
      })
    }
  }

  return groups
})

const searchHasResults = computed(() =>
  Object.values(groupedSearchResults.value).some((results) => results.length > 0),
)
const upstreamEdges = computed(() => (selectedNode.value ? incomingByTarget.value.get(selectedNode.value.id) ?? [] : []))
const downstreamEdges = computed(() => (selectedNode.value ? outgoingBySource.value.get(selectedNode.value.id) ?? [] : []))
const flowGroups = computed(() => {
  const sourceIds = flowActive.value ? downstreamNodeIds.value : new Set([selectedNode.value?.id ?? ''])
  const componentIds = visibleNodes.value
    .filter((node) => node.kind !== 'service' && sourceIds.has(node.id))
    .map((node) => node.id)

  return componentIds
    .map((nodeId) => ({
      node: visibleNodes.value.find((node) => node.id === nodeId),
      edges: outgoingBySource.value.get(nodeId) ?? [],
    }))
    .filter((group) => group.node && group.edges.length > 0)
})

function groupEdgesBy(key: 'source' | 'target') {
  const grouped = new Map<string, TopologyEdgeRecord[]>()

  for (const edge of visibleEdges.value) {
    const groupKey = edge[key]
    const existing = grouped.get(groupKey) ?? []

    existing.push(edge)
    grouped.set(groupKey, existing)
  }

  return grouped
}

function collectDownstream(startId: string) {
  const edgeIds = new Set<string>()
  const nodeIds = new Set<string>([startId])
  const queue = [startId]

  while (queue.length) {
    const sourceId = queue.shift()

    if (!sourceId) {
      continue
    }

    for (const edge of outgoingBySource.value.get(sourceId) ?? []) {
      edgeIds.add(edge.id)

      if (!nodeIds.has(edge.target)) {
        nodeIds.add(edge.target)
        queue.push(edge.target)
      }
    }
  }

  return {
    edgeIds,
    nodeIds,
  }
}

function isNodeNeighbor(nodeId: string) {
  if (selectedNodeId.value === nodeId) {
    return true
  }

  if (selectedEdge.value && [selectedEdge.value.source, selectedEdge.value.target].includes(nodeId)) {
    return true
  }

  return visibleEdges.value.some(
    (edge) =>
      selectedNodeId.value &&
      ((edge.source === selectedNodeId.value && edge.target === nodeId) ||
        (edge.target === selectedNodeId.value && edge.source === nodeId)),
  )
}

function isEdgeNeighbor(edge: TopologyEdgeRecord) {
  return Boolean(
    selectedEdgeId.value === edge.id ||
      downstreamEdgeIds.value.has(edge.id) ||
      (selectedNodeId.value && [edge.source, edge.target].includes(selectedNodeId.value)),
  )
}

function nodeName(nodeId: string) {
  return topologyNodeName(visibleNodes.value, nodeId)
}

function nodesForMode(data: TopologyEnvironmentData = topology.value) {
  return appExpanded.value ? data.expandedNodes : data.collapsedNodes
}

function edgesForMode(data: TopologyEnvironmentData = topology.value) {
  return appExpanded.value ? data.expandedEdges : data.collapsedEdges
}

function defaultNodeId(data: TopologyEnvironmentData = topology.value) {
  const nodes = nodesForMode(data)

  return nodes.find((node) => node.kind === 'app')?.id ?? nodes[0]?.id ?? ''
}

function configEdgePath(edge: ConfigEdgeProps) {
  return getSmoothStepPath({
    sourceX: edge.sourceX,
    sourceY: edge.sourceY,
    sourcePosition: edge.sourcePosition,
    targetX: edge.targetX,
    targetY: edge.targetY,
    targetPosition: edge.targetPosition,
  })[0]
}

function configEdgeLabelStyle(edge: ConfigEdgeProps) {
  const [, labelX, labelY] = getSmoothStepPath({
    sourceX: edge.sourceX,
    sourceY: edge.sourceY,
    sourcePosition: edge.sourcePosition,
    targetX: edge.targetX,
    targetY: edge.targetY,
    targetPosition: edge.targetPosition,
  })

  return {
    transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
  }
}

function quickViewEdge(edgeId: string, event?: MouseEvent) {
  if (quickConfigEdgeId.value === edgeId) {
    quickConfigEdgeId.value = ''
    return
  }

  if (event?.currentTarget instanceof HTMLElement) {
    const rect = event.currentTarget.getBoundingClientRect()

    quickConfigPosition.value = {
      x: Math.max(12, Math.min(rect.left, window.innerWidth - 340)),
      y: Math.max(12, Math.min(rect.bottom + 8, window.innerHeight - 260)),
    }
  }

  quickConfigEdgeId.value = edgeId
}

function nodePosition(node: TopologyNodeRecord) {
  return localNodePositions.value[node.id] ?? node.position
}

function persistLocalState(patch: Partial<SystemManagerLocalState>) {
  const nextState = {
    ...persistedState.value,
    ...patch,
    nodePositions: patch.nodePositions ?? persistedState.value.nodePositions,
  }

  persistedState.value = saveSystemManagerLocalState(nextState)
}

function persistCurrentLocalState() {
  persistLocalState({
    selectedEnvironment: selectedEnvironment.value,
    appExpanded: appExpanded.value,
    selectedNodeId: selectedNodeId.value,
    selectedEdgeId: selectedEdgeId.value,
    activeTab: activeTab.value,
    detailPanelCollapsed: detailPanelCollapsed.value,
    settings: settings.value,
  })
}

function centerCurrentGraph() {
  if (selectedEdge.value) {
    centerGraph(selectedEdge.value.source, selectedEdge.value.target)
    return
  }

  const nodeId = selectedNodeId.value || defaultNodeId()

  if (nodeId) {
    centerGraph(nodeId)
  }
}

function centerVisibleGraph() {
  const nodeIds = visibleNodes.value.map((node) => node.id)

  if (nodeIds.length) {
    centerGraph(...nodeIds)
  }
}

function toggleDetailPanel() {
  detailPanelCollapsed.value = !detailPanelCollapsed.value
  window.setTimeout(centerCurrentGraph, 260)
}

function selectNode(nodeId: string) {
  quickConfigEdgeId.value = ''
  selectedNodeId.value = nodeId
  selectedEdgeId.value = ''
  activeTab.value = 'overview'
  flowActive.value = false
  centerGraph(nodeId)
}

function selectEdge(edgeId: string) {
  const edge = visibleEdges.value.find((item) => item.id === edgeId)

  if (!edge) {
    return
  }

  quickConfigEdgeId.value = ''
  selectedEdgeId.value = edge.id
  selectedNodeId.value = ''
  activeTab.value = 'configs'
  flowActive.value = false

  if (detailPanelCollapsed.value) {
    detailPanelCollapsed.value = false
    window.setTimeout(() => centerGraph(edge.source, edge.target), 260)
    return
  }

  centerGraph(edge.source, edge.target)
}

function handleNodeClick(payload: { node: FlowNode }) {
  selectNode(payload.node.id)
}

function handleEdgeClick(payload: { edge: FlowEdge }) {
  selectEdge(payload.edge.id)
}

function handleNodeDoubleClick(payload: { node: FlowNode }) {
  if (payload.node.data?.record.kind === 'app' || payload.node.data?.record.kind === 'component') {
    appExpanded.value = !appExpanded.value
    selectedNodeId.value = appExpanded.value ? payload.node.id : defaultNodeId()
    selectedEdgeId.value = ''
    flowActive.value = false
    nextTick(() => centerGraph(selectedNodeId.value))
  }
}

function handleNodeDragStop(payload: NodeDragEvent) {
  const draggedNodes = payload.nodes.length ? payload.nodes : [payload.node]
  const nextPositions = { ...localNodePositions.value }

  for (const node of draggedNodes) {
    nextPositions[node.id] = {
      x: Math.round(node.position.x),
      y: Math.round(node.position.y),
    }
  }

  localNodePositions.value = nextPositions
  persistLocalState({ nodePositions: nextPositions })
  message.success('Đã lưu vị trí node trên máy này')
}

function selectSearchResult(result: SearchResult) {
  searchQuery.value = ''

  if (result.targetType === 'edge') {
    selectEdge(result.targetId)
    return
  }

  selectNode(result.targetId)
}

function centerGraph(...nodeIds: string[]) {
  nextTick(() => {
    fitView({
      nodes: nodeIds,
      duration: 560,
      padding: 0.35,
    })
  })
}

function startFlow() {
  const startId = selectedNode.value?.id ?? defaultNodeId()

  quickConfigEdgeId.value = ''
  flowStartId.value = startId
  flowActive.value = true
  selectedEdgeId.value = ''
  activeTab.value = 'flow'
  centerGraph(...Array.from(collectDownstream(startId).nodeIds))
}

function clearFlow() {
  flowActive.value = false
}

function toggleAppExpanded() {
  quickConfigEdgeId.value = ''
  appExpanded.value = !appExpanded.value
  selectedNodeId.value = defaultNodeId()
  selectedEdgeId.value = ''
  activeTab.value = 'overview'
  flowActive.value = false
  searchQuery.value = ''

  nextTick(centerVisibleGraph)
}

function resetGraphState() {
  quickConfigEdgeId.value = ''
  appExpanded.value = defaultAppExpanded()
  const nodeId = defaultNodeId()

  selectedNodeId.value = nodeId
  selectedEdgeId.value = ''
  activeTab.value = 'overview'
  flowActive.value = false
  searchQuery.value = ''

  if (nodeId) {
    centerGraph(nodeId)
  }
}

function handleEnvironmentChange() {
  quickConfigEdgeId.value = ''
  selectedNodeId.value = defaultNodeId()
  selectedEdgeId.value = ''
  appExpanded.value = defaultAppExpanded()
  flowActive.value = false

  if (settings.value.resetSearchOnEnvironmentChange) {
    searchQuery.value = ''
  }

  nextTick(() => {
    if (topologies.value[selectedEnvironment.value]) {
      centerGraph(defaultNodeId())
    }
  })
}

function configVisibilityKey(item: ConfigItem, prefix: string) {
  return `${selectedEnvironment.value}:${prefix}:${item.key}`
}

function isConfigRevealed(item: ConfigItem, prefix: string) {
  return revealedConfigKeys.value.has(configVisibilityKey(item, prefix))
}

function toggleConfigVisibility(item: ConfigItem, prefix: string) {
  const key = configVisibilityKey(item, prefix)
  const nextValue = new Set(revealedConfigKeys.value)

  if (nextValue.has(key)) {
    nextValue.delete(key)
  } else {
    nextValue.add(key)
  }

  revealedConfigKeys.value = nextValue
}

function configDisplayValue(item: ConfigItem, prefix: string) {
  if (item.secret && !isConfigRevealed(item, prefix)) {
    return '********'
  }

  return item.value
}

function configLine(item: ConfigItem) {
  return `${item.key}=${item.value}`
}

async function copyConfigLine(item: ConfigItem) {
  await navigator.clipboard.writeText(configLine(item))
  message.success(`Đã copy ${item.key}`)
}

async function copyConfigLines(items: ConfigItem[]) {
  if (!items.length) {
    return
  }

  await navigator.clipboard.writeText(items.map(configLine).join('\n'))
  message.success(`Đã copy ${items.length} config`)
}

async function copyQuickConfigLines() {
  const edge = quickConfigEdge.value

  if (!edge) {
    return
  }

  await copyConfigLines(edge.configItems)
}

function restoreSelectionFromLocalState(data: TopologyEnvironmentData) {
  const savedEdgeId = persistedState.value.selectedEdgeId
  const savedNodeId = persistedState.value.selectedNodeId
  const edge = edgesForMode(data).find((item) => item.id === savedEdgeId)

  if (edge) {
    selectedEdgeId.value = edge.id
    selectedNodeId.value = ''
    activeTab.value = 'configs'

    return {
      nodeIds: [edge.source, edge.target],
    }
  }

  const nodeId = nodesForMode(data).some((node) => node.id === savedNodeId) ? savedNodeId : defaultNodeId(data)

  selectedNodeId.value = nodeId
  selectedEdgeId.value = ''
  activeTab.value = persistedState.value.activeTab || 'overview'

  return {
    nodeIds: nodeId ? [nodeId] : [],
  }
}

async function loadTopology(environment: SystemEnvironment, restoreLocalState = false) {
  loadingTopology.value = true
  topologyError.value = ''

  try {
    const data = await loadSystemManagerTopology(environment)

    topologies.value = {
      ...topologies.value,
      [environment]: data,
    }
    const restored = restoreLocalState
      ? restoreSelectionFromLocalState(data)
      : {
          nodeIds: [defaultNodeId(data)].filter(Boolean),
        }

    if (!restoreLocalState) {
      selectedNodeId.value = restored.nodeIds[0] ?? ''
      selectedEdgeId.value = ''
      activeTab.value = 'overview'
    }

    await nextTick()
    if (restored.nodeIds.length) {
      centerGraph(...restored.nodeIds)
    }
  } catch (error) {
    topologyError.value = 'Không tải được topology System Manager.'
    console.error(error)
  } finally {
    loadingTopology.value = false
  }
}

async function loadInitialData() {
  loadingTopology.value = true
  topologyError.value = ''

  try {
    environments.value = await loadSystemManagerEnvironments()
    const firstEnvironment = environments.value[0]?.key ?? 'local'
    const savedEnvironment = persistedState.value.selectedEnvironment
    const nextEnvironment =
      savedEnvironment && environments.value.some((environment) => environment.key === savedEnvironment)
        ? savedEnvironment
        : firstEnvironment

    selectedEnvironment.value = nextEnvironment
    await loadTopology(nextEnvironment, true)
  } catch (error) {
    topologyError.value = 'Không tải được dữ liệu System Manager.'
    console.error(error)
    loadingTopology.value = false
  }
}

async function refreshAfterManagement(environmentKey?: SystemEnvironment) {
  loadingTopology.value = true
  topologyError.value = ''
  suppressEnvironmentWatch.value = true

  try {
    const nextEnvironments = await loadSystemManagerEnvironments()
    const fallbackEnvironment = nextEnvironments[0]?.key ?? 'local'
    const nextEnvironment =
      (environmentKey && nextEnvironments.some((environment) => environment.key === environmentKey)
        ? environmentKey
        : nextEnvironments.some((environment) => environment.key === selectedEnvironment.value)
          ? selectedEnvironment.value
          : fallbackEnvironment) || fallbackEnvironment

    environments.value = nextEnvironments
    selectedEnvironment.value = nextEnvironment
    appExpanded.value = defaultAppExpanded()
    flowActive.value = false

    if (settings.value.resetSearchOnEnvironmentChange) {
      searchQuery.value = ''
    }

    await loadTopology(nextEnvironment)
  } catch (error) {
    topologyError.value = 'Không tải lại được dữ liệu System Manager.'
    console.error(error)
  } finally {
    suppressEnvironmentWatch.value = false
    loadingTopology.value = false
  }
}

async function refreshAfterImport() {
  settingsOpen.value = false
  await refreshAfterManagement(selectedEnvironment.value)
}

function updateSettings(nextSettings: SystemManagerSettings) {
  settings.value = { ...nextSettings }

  if (nextSettings.defaultGraphView !== 'remember') {
    appExpanded.value = nextSettings.defaultGraphView === 'expanded'
  }

  if (nextSettings.detailPanelDefault !== 'remember') {
    detailPanelCollapsed.value = nextSettings.detailPanelDefault === 'collapsed'
  }

  persistCurrentLocalState()
}

watch(selectedEnvironment, async (environment, previousEnvironment) => {
  if (suppressEnvironmentWatch.value || environment === previousEnvironment || !environments.value.length) {
    return
  }

  handleEnvironmentChange()
  await loadTopology(environment)
})

watch(
  [selectedEnvironment, appExpanded, selectedNodeId, selectedEdgeId, activeTab, detailPanelCollapsed],
  () => persistCurrentLocalState(),
)

onMounted(() => {
  void loadInitialData()
})
</script>

<template>
  <section class="system-manager-page">
    <div class="system-manager-header">
      <div>
        <h1>System Manager</h1>
        <p>Topology graph cho dependency, config key và flow debug theo environment.</p>
      </div>

      <a-space>
        <a-segmented
          v-model:value="selectedEnvironment"
          class="environment-segmented"
          :options="environmentOptions"
          :disabled="loadingTopology || !environmentOptions.length"
          :style="environmentThemeStyle"
          @change="handleEnvironmentChange"
        />
        <a-tooltip title="Settings / Import / Export">
          <a-button aria-label="Settings / Import / Export" @click="settingsOpen = true">
            <template #icon>
              <SettingOutlined />
            </template>
          </a-button>
        </a-tooltip>
        <a-button @click="manageOpen = true">DataSet</a-button>
      </a-space>
    </div>

    <div class="system-manager-toolbar">
      <div class="toolbar-left">
        <div class="toolbar-search-wrap">
          <a-input-search
            v-model:value="searchQuery"
            class="system-search"
            allow-clear
            placeholder="Tìm name, IP, config key..."
          />

          <a-space>
            <a-tooltip title="Trở về tổng quan">
              <a-button
                aria-label="Trở về tổng quan"
                class="toolbar-icon-button"
                @click="resetGraphState"
              >
                <template #icon>
                  <AimOutlined />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip :title="detailPanelCollapsed ? 'Hiện sidebar' : 'Ẩn sidebar'">
              <a-button
                :aria-label="detailPanelCollapsed ? 'Hiện sidebar' : 'Ẩn sidebar'"
                class="toolbar-icon-button"
                @click="toggleDetailPanel"
              >
                <template #icon>
                  <MenuUnfoldOutlined v-if="detailPanelCollapsed" />
                  <MenuFoldOutlined v-else />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip :title="appExpanded ? 'Thu gọn component' : 'Bung component'">
              <a-button
                :aria-label="appExpanded ? 'Thu gọn component' : 'Bung component'"
                class="toolbar-icon-button"
                :type="appExpanded ? 'primary' : 'default'"
                @click="toggleAppExpanded"
              >
                <template #icon>
                  <NodeCollapseOutlined v-if="appExpanded" />
                  <NodeExpandOutlined v-else />
                </template>
              </a-button>
            </a-tooltip>
          </a-space>
        </div>

        <div v-if="searchQuery" class="search-results">
          <template v-if="searchHasResults">
            <div
              v-for="(results, group) in groupedSearchResults"
              :key="group"
              class="search-result-group"
            >
              <template v-if="results.length">
                <strong>{{ group }}</strong>
                <button
                  v-for="result in results"
                  :key="result.id"
                  class="search-result-item"
                  type="button"
                  @click="selectSearchResult(result)"
                >
                  <span>{{ result.label }}</span>
                  <small>{{ result.description }}</small>
                </button>
              </template>
            </div>
          </template>
          <a-empty v-else :image="null" description="Không có kết quả" />
        </div>
      </div>
    </div>

    <div
      class="system-manager-workspace"
      :class="{ 'system-manager-workspace-collapsed': detailPanelCollapsed }"
    >
      <div class="graph-panel" :style="environmentThemeStyle">
        <a-alert
          v-if="topologyError"
          class="system-manager-alert"
          type="error"
          :message="topologyError"
          show-icon
        />
        <a-spin :spinning="loadingTopology" wrapper-class-name="system-manager-spin">
        <VueFlow
          class="system-flow"
          :nodes="flowNodes"
          :edges="flowEdges"
          :min-zoom="0.35"
          :max-zoom="1.35"
          fit-view-on-init
          @node-click="handleNodeClick"
          @edge-click="handleEdgeClick"
          @node-double-click="handleNodeDoubleClick"
          @node-drag-stop="handleNodeDragStop"
        >
          <Background :pattern-color="selectedEnvironmentColor" :gap="20" />
          <Controls />
          <MiniMap pannable zoomable />

          <template #node-topology="{ data }">
            <div
              class="topology-node"
              :class="[
                `topology-node-${data.record.kind}`,
                `topology-node-${data.record.status}`,
                data.active ? 'topology-node-active' : '',
                data.dimmed ? 'topology-node-dimmed' : '',
              ]"
            >
              <Handle type="target" :position="Position.Left" />
              <div class="node-topline">
                <span>{{ data.record.type }}</span>
                <StatusTag :value="data.record.status" />
              </div>
              <strong>{{ data.record.name }}</strong>
              <small>{{ data.record.description }}</small>
              <Handle type="source" :position="Position.Right" />
            </div>
          </template>

          <template #edge-config="edgeProps">
            <BaseEdge
              :id="edgeProps.id"
              :interaction-width="edgeProps.interactionWidth"
              :marker-end="edgeProps.markerEnd"
              :marker-start="edgeProps.markerStart"
              :path="configEdgePath(edgeProps)"
            />
            <EdgeLabelRenderer>
              <div
                class="edge-config-anchor nodrag nopan"
                :style="configEdgeLabelStyle(edgeProps)"
              >
                <div
                  class="edge-config-label"
                  :class="{
                    'edge-config-label-active':
                      selectedEdgeId === edgeProps.id || quickConfigEdgeId === edgeProps.id,
                  }"
                >
                  <button
                    class="edge-config-label-text"
                    type="button"
                    @click.stop="selectEdge(edgeProps.id)"
                  >
                    {{ edgeDisplayLabel(edgeProps.data.record) }}
                  </button>
                  <a-tooltip title="Xem config nhanh">
                    <button
                      aria-label="Xem config nhanh"
                      class="edge-config-plus"
                      type="button"
                      @click.stop="quickViewEdge(edgeProps.id, $event)"
                    >
                      <PlusOutlined />
                    </button>
                  </a-tooltip>
                </div>
              </div>
            </EdgeLabelRenderer>
          </template>
        </VueFlow>
        </a-spin>
      </div>

      <SystemManagerDetailPanel
        v-model:active-tab="activeTab"
        :collapsed="detailPanelCollapsed"
        :selected-environment="selectedEnvironment"
        :topology-label="topology.label"
        :nodes="visibleNodes"
        :selected-node="selectedNode"
        :selected-edge="selectedEdge"
        :downstream-edges="downstreamEdges"
        :upstream-edges="upstreamEdges"
        :flow-groups="flowGroups"
        :flow-active="flowActive"
        :revealed-config-keys="revealedConfigKeys"
        @reset-selection="resetGraphState"
        @select-edge="selectEdge"
        @start-flow="startFlow"
        @clear-flow="clearFlow"
        @copy-config-line="copyConfigLine"
        @toggle-config-visibility="toggleConfigVisibility"
      />
    </div>

    <SystemManagerQuickConfigPopover
      v-if="quickConfigEdge"
      :items="quickConfigItems"
      :popover-style="quickConfigPopoverStyle"
      :title="edgeDisplayLabel(quickConfigEdge)"
      @close="quickConfigEdgeId = ''"
      @copy="copyConfigLine"
      @copy-all="copyQuickConfigLines"
    />

    <SystemManagerManageDrawer
      v-model:open="manageOpen"
      :selected-environment="selectedEnvironment"
      :environments="environments"
      :topology="topology"
      @saved="refreshAfterManagement"
    />

    <SystemManagerSettingsDrawer
      v-model:open="settingsOpen"
      :settings="settings"
      @update:settings="updateSettings"
      @imported="refreshAfterImport"
    />
  </section>
</template>

<style scoped>
.system-manager-page {
  display: flex;
  min-width: 980px;
  height: calc(100vh - 112px);
  min-height: 680px;
  flex-direction: column;
}

.system-manager-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 14px;
}

.system-manager-header h1 {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
}

.system-manager-header p {
  margin: 5px 0 0;
  color: #667085;
}

.environment-segmented {
  padding: 3px;
  background: #f8fafc;
  border: 1px solid #e6edf5;
}

.environment-segmented :deep(.ant-segmented-item-label) {
  min-height: 30px;
  padding: 0 11px;
  line-height: 30px;
}

.environment-segmented :deep(.ant-segmented-thumb),
.environment-segmented :deep(.ant-segmented-item-selected) {
  background: color-mix(in srgb, var(--environment-active-color) 13%, #ffffff);
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--environment-active-color) 34%, transparent),
    0 4px 12px rgba(23, 32, 51, 0.08);
}

.environment-segmented :deep(.ant-segmented-item-selected) {
  color: var(--environment-active-color);
  font-weight: 650;
}

.environment-segmented :deep(.environment-option-label) {
  display: inline-flex;
  gap: 7px;
  align-items: center;
}

.environment-segmented :deep(.environment-option-dot) {
  width: 7px;
  height: 7px;
  background: var(--environment-color);
  border-radius: 999px;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--environment-color) 14%, transparent);
}

.environment-segmented :deep(.ant-segmented-item-selected .environment-option-dot) {
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--environment-color) 18%, transparent);
}

.system-manager-toolbar {
  position: relative;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 12px;
}

.toolbar-icon-button {
  width: 34px;
  padding: 0;
}

.toolbar-left {
  position: relative;
}

.toolbar-search-wrap {
  display: flex;
  gap: 8px;
  align-items: center;
}

.system-search {
  width: 380px;
}

.search-results {
  position: absolute;
  top: 42px;
  left: 0;
  width: 420px;
  max-height: 440px;
  padding: 12px;
  overflow: auto;
  background: #ffffff;
  border: 1px solid #d9e2ec;
  border-radius: 8px;
  box-shadow: 0 18px 45px rgba(23, 32, 51, 0.16);
}

.search-result-group + .search-result-group {
  margin-top: 12px;
}

.search-result-group strong {
  display: block;
  margin-bottom: 6px;
  color: #475467;
  font-size: 12px;
  text-transform: uppercase;
}

.search-result-item {
  display: flex;
  width: 100%;
  padding: 8px 10px;
  color: inherit;
  text-align: left;
  cursor: pointer;
  background: #ffffff;
  border: 1px solid transparent;
  border-radius: 6px;
  flex-direction: column;
}

.search-result-item:hover {
  background: #f2f7fb;
  border-color: #d9e2ec;
}

.search-result-item span {
  font-weight: 650;
}

.search-result-item small {
  color: #667085;
}

.system-manager-workspace {
  display: grid;
  min-height: 0;
  flex: 1;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 14px;
  transition:
    grid-template-columns 0.26s ease,
    gap 0.26s ease;
}

.system-manager-workspace-collapsed {
  grid-template-columns: minmax(0, 1fr) 0;
  gap: 0;
}

.graph-panel {
  min-height: 0;
  background: #ffffff;
  border: 1px solid #d9e2ec;
  border-radius: 8px;
}

.graph-panel {
  position: relative;
  overflow: hidden;
}

.system-flow {
  width: 100%;
  height: 100%;
  background:
    radial-gradient(circle at 18% 18%, color-mix(in srgb, var(--environment-active-color) 12%, transparent), transparent 28%),
    linear-gradient(180deg, color-mix(in srgb, var(--environment-active-color) 7%, #ffffff), #f8fafc 72%);
  transition: background 0.24s ease;
}

.system-manager-alert {
  position: absolute;
  z-index: 5;
  top: 12px;
  left: 12px;
  right: 12px;
}

:deep(.system-manager-spin),
:deep(.system-manager-spin .ant-spin-container) {
  height: 100%;
}

.edge-config-anchor {
  position: absolute;
  z-index: 3;
  pointer-events: none;
}

.edge-config-label {
  position: relative;
  display: inline-flex;
  max-width: 260px;
  overflow: hidden;
  pointer-events: all;
  background: #ffffff;
  border: 1px solid #d9e2ec;
  border-radius: 6px;
  box-shadow: 0 6px 16px rgba(23, 32, 51, 0.1);
}

.edge-config-label-active {
  border-color: #147c74;
  box-shadow: 0 8px 18px rgba(20, 124, 116, 0.18);
}

.edge-config-label-text,
.edge-config-plus {
  color: #172033;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.edge-config-label-text {
  min-width: 0;
  padding: 2px 6px;
  overflow: hidden;
  font-size: 12px;
  font-weight: 750;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.edge-config-plus {
  display: inline-flex;
  width: 22px;
  min-width: 22px;
  align-items: center;
  justify-content: center;
  color: #147c74;
  background: #e8f7f4;
  border-left: 1px solid #c9ebe5;
}

.edge-config-label-text:hover,
.edge-config-plus:hover {
  background: #f2f7fb;
}

.topology-node {
  position: relative;
  width: 210px;
  min-height: 96px;
  padding: 12px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-left-width: 5px;
  border-radius: 8px;
  box-shadow: 0 10px 28px rgba(23, 32, 51, 0.08);
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    opacity 0.18s ease;
}

.topology-node-app {
  border-left-color: #147c74;
}

.topology-node-component {
  border-left-color: #2563eb;
}

.topology-node-service {
  border-left-color: #7c3aed;
}

.topology-node-active {
  border-color: #147c74;
  box-shadow: 0 14px 34px rgba(20, 124, 116, 0.22);
}

.topology-node-dimmed {
  opacity: 0.28;
}

.topology-node strong,
.topology-node small {
  display: block;
}

.topology-node strong {
  margin-top: 8px;
  overflow-wrap: anywhere;
  font-size: 15px;
  line-height: 1.25;
}

.topology-node small {
  display: -webkit-box;
  margin-top: 5px;
  overflow: hidden;
  color: #667085;
  font-size: 12px;
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.node-topline {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: space-between;
}

.node-topline span {
  min-width: 0;
  overflow: hidden;
  color: #475467;
  font-size: 11px;
  font-weight: 700;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

:deep(.vue-flow__edge.system-manager-edge path) {
  stroke: #64748b;
}

:deep(.vue-flow__edge.system-manager-edge-active path) {
  stroke: #147c74;
}

:deep(.vue-flow__edge.system-manager-edge-dimmed) {
  opacity: 0.2;
}

:deep(.vue-flow__edge-text) {
  fill: #172033;
}

:deep(.vue-flow__handle) {
  width: 8px;
  height: 8px;
  background: #147c74;
  border: 2px solid #ffffff;
}

:deep(.vue-flow__minimap) {
  border: 1px solid #d9e2ec;
  border-radius: 8px;
}
</style>
