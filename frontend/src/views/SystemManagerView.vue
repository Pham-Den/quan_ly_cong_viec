<script setup lang="ts">
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import {
  Handle,
  Position,
  VueFlow,
  useVueFlow,
  type Edge,
  type Node,
} from '@vue-flow/core'
import { MiniMap } from '@vue-flow/minimap'
import { message } from 'ant-design-vue'
import { computed, nextTick, onMounted, ref, watch } from 'vue'

import {
  loadSystemManagerEnvironments,
  loadSystemManagerTopology,
  type SystemManagerEnvironment,
} from '../services/system-manager'
import SystemManagerManageDrawer from '../system-manager/SystemManagerManageDrawer.vue'
import {
  type ConfigItem,
  type SystemEnvironment,
  type TopologyEdgeRecord,
  type TopologyNodeRecord,
  type TopologyStatus,
  type TopologyEnvironmentData,
} from '../system-manager/mockTopology'

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

type SearchGroup = 'Apps' | 'Services' | 'Hosts' | 'Configs' | 'IPs'

type SearchResult = {
  id: string
  group: SearchGroup
  label: string
  description: string
  targetType: 'node' | 'edge'
  targetId: string
}

const selectedEnvironment = ref<SystemEnvironment>('local')
const appExpanded = ref(false)
const selectedNodeId = ref('b2p-app')
const selectedEdgeId = ref('')
const activeTab = ref('overview')
const searchQuery = ref('')
const revealedConfigKeys = ref<Set<string>>(new Set())
const flowActive = ref(false)
const flowStartId = ref('b2p-app')
const loadingTopology = ref(false)
const topologyError = ref('')
const manageOpen = ref(false)
const suppressEnvironmentWatch = ref(false)
const environments = ref<SystemManagerEnvironment[]>([])
const topologies = ref<Partial<Record<SystemEnvironment, TopologyEnvironmentData>>>({})
const { fitView } = useVueFlow()

const emptyTopology: TopologyEnvironmentData = {
  key: 'local',
  label: 'Local',
  collapsedNodes: [],
  collapsedEdges: [],
  expandedNodes: [],
  expandedEdges: [],
}

const environmentOptions = computed(() =>
  environments.value.map((environment) => ({
    label: environment.label,
    value: environment.key,
  })),
)
const topology = computed(() => topologies.value[selectedEnvironment.value] ?? emptyTopology)
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
      position: node.position,
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
      label: edge.label,
      type: 'smoothstep',
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
      labelStyle: {
        fontSize: 12,
        fontWeight: 700,
      },
      labelBgStyle: {
        fill: active ? '#e8f7f4' : '#ffffff',
        fillOpacity: 0.94,
      },
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
        description: `${node.type} - ${node.status}`,
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
        label: edge.label,
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
const activeConfigItems = computed(() => selectedEdge.value?.configItems ?? [])
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
  return visibleNodes.value.find((node) => node.id === nodeId)?.name ?? nodeId
}

function defaultNodeId(data: TopologyEnvironmentData = topology.value) {
  return data.collapsedNodes.find((node) => node.kind === 'app')?.id ?? data.collapsedNodes[0]?.id ?? ''
}

function statusLabel(status: TopologyStatus) {
  const labels: Record<TopologyStatus, string> = {
    healthy: 'Healthy',
    warning: 'Warning',
    down: 'Down',
    unknown: 'Unknown',
    maintenance: 'Maintenance',
    disabled: 'Disabled',
  }

  return labels[status]
}

function statusColor(status: TopologyStatus) {
  const colors: Record<TopologyStatus, string> = {
    healthy: 'green',
    warning: 'gold',
    down: 'red',
    unknown: 'default',
    maintenance: 'blue',
    disabled: 'default',
  }

  return colors[status]
}

function selectNode(nodeId: string) {
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

  selectedEdgeId.value = edge.id
  selectedNodeId.value = ''
  activeTab.value = 'configs'
  flowActive.value = false
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
      duration: 320,
      padding: 0.35,
    })
  })
}

function startFlow() {
  const startId = selectedNode.value?.id ?? defaultNodeId()

  flowStartId.value = startId
  flowActive.value = true
  selectedEdgeId.value = ''
  activeTab.value = 'flow'
  centerGraph(...Array.from(collectDownstream(startId).nodeIds))
}

function clearFlow() {
  flowActive.value = false
}

function handleEnvironmentChange() {
  selectedNodeId.value = defaultNodeId()
  selectedEdgeId.value = ''
  appExpanded.value = false
  flowActive.value = false
  searchQuery.value = ''
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

async function copyConfigLine(item: ConfigItem) {
  await navigator.clipboard.writeText(`${item.key}=${item.value}`)
  message.success(`Đã copy ${item.key}`)
}

async function loadTopology(environment: SystemEnvironment) {
  loadingTopology.value = true
  topologyError.value = ''

  try {
    const data = await loadSystemManagerTopology(environment)
    const nextNodeId = defaultNodeId(data)

    topologies.value = {
      ...topologies.value,
      [environment]: data,
    }
    selectedNodeId.value = nextNodeId
    selectedEdgeId.value = ''
    await nextTick()
    if (nextNodeId) {
      centerGraph(nextNodeId)
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

    selectedEnvironment.value = firstEnvironment
    await loadTopology(firstEnvironment)
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
    appExpanded.value = false
    flowActive.value = false
    searchQuery.value = ''

    await loadTopology(nextEnvironment)
  } catch (error) {
    topologyError.value = 'Không tải lại được dữ liệu System Manager.'
    console.error(error)
  } finally {
    suppressEnvironmentWatch.value = false
    loadingTopology.value = false
  }
}

watch(selectedEnvironment, async (environment, previousEnvironment) => {
  if (suppressEnvironmentWatch.value || environment === previousEnvironment || !environments.value.length) {
    return
  }

  handleEnvironmentChange()
  await loadTopology(environment)
})

onMounted(() => {
  void loadInitialData()
})
</script>

<template>
  <section class="system-manager-page">
    <div class="system-manager-header">
      <div>
        <h1>System Manager</h1>
        <p>Topology mock cho B2P, tập trung vào dependency, config key và flow debug.</p>
      </div>

      <a-space>
        <a-segmented
          v-model:value="selectedEnvironment"
          :options="environmentOptions"
          :disabled="loadingTopology || !environmentOptions.length"
          @change="handleEnvironmentChange"
        />
        <a-button @click="manageOpen = true">Quản lý dữ liệu</a-button>
        <a-tag color="green">Backend data</a-tag>
      </a-space>
    </div>

    <div class="system-manager-toolbar">
      <div class="toolbar-left">
        <a-input-search
          v-model:value="searchQuery"
          class="system-search"
          allow-clear
          placeholder="Tìm name, IP, config key..."
        />

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

      <a-space>
        <a-tag :color="appExpanded ? 'green' : 'default'">
          {{ appExpanded ? 'Expanded' : 'Collapsed' }}
        </a-tag>
        <a-button @click="appExpanded = !appExpanded">
          {{ appExpanded ? 'Thu gọn app' : 'Bung component' }}
        </a-button>
      </a-space>
    </div>

    <div class="system-manager-workspace">
      <div class="graph-panel">
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
        >
          <Background pattern-color="#d9e2ec" :gap="20" />
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
                <a-tag :color="statusColor(data.record.status)">
                  {{ statusLabel(data.record.status) }}
                </a-tag>
              </div>
              <strong>{{ data.record.name }}</strong>
              <small>{{ data.record.description }}</small>
              <Handle type="source" :position="Position.Right" />
            </div>
          </template>
        </VueFlow>
        </a-spin>
      </div>

      <aside class="detail-panel">
        <template v-if="selectedEdge">
          <div class="detail-header">
            <div>
              <span>Config detail</span>
              <h2>{{ selectedEdge.label }}</h2>
            </div>
            <a-tag color="purple">{{ selectedEdge.direction }}</a-tag>
          </div>

          <a-descriptions size="small" :column="1" bordered>
            <a-descriptions-item label="From">{{ nodeName(selectedEdge.source) }}</a-descriptions-item>
            <a-descriptions-item label="To">{{ nodeName(selectedEdge.target) }}</a-descriptions-item>
            <a-descriptions-item label="Connection">{{ selectedEdge.connectionType }}</a-descriptions-item>
            <a-descriptions-item label="Port">{{ selectedEdge.port }}</a-descriptions-item>
            <a-descriptions-item label="Description">{{ selectedEdge.description }}</a-descriptions-item>
          </a-descriptions>

          <a-divider>Config lines</a-divider>
          <div class="config-list">
            <div
              v-for="item in activeConfigItems"
              :key="item.key"
              class="config-row"
            >
              <code>{{ item.key }}={{ configDisplayValue(item, selectedEdge.id) }}</code>
              <a-space>
                <a-button
                  v-if="item.secret"
                  size="small"
                  @click="toggleConfigVisibility(item, selectedEdge.id)"
                >
                  {{ isConfigRevealed(item, selectedEdge.id) ? 'Ẩn' : 'Hiện' }}
                </a-button>
                <a-button size="small" @click="copyConfigLine(item)">Copy</a-button>
              </a-space>
            </div>
          </div>
        </template>

        <template v-else-if="selectedNode">
          <div class="detail-header">
            <div>
              <span>{{ selectedNode.type }}</span>
              <h2>{{ selectedNode.name }}</h2>
            </div>
            <a-tag :color="statusColor(selectedNode.status)">
              {{ statusLabel(selectedNode.status) }}
            </a-tag>
          </div>

          <a-tabs v-model:active-key="activeTab" size="small">
            <a-tab-pane key="overview" tab="Overview">
              <a-descriptions size="small" :column="1" bordered>
                <a-descriptions-item label="Environment">{{ topology.label }}</a-descriptions-item>
                <a-descriptions-item label="Type">{{ selectedNode.type }}</a-descriptions-item>
                <a-descriptions-item label="Status">{{ statusLabel(selectedNode.status) }}</a-descriptions-item>
                <a-descriptions-item label="Tags">
                  <a-space wrap>
                    <a-tag v-for="tag in selectedNode.tags" :key="tag">{{ tag }}</a-tag>
                  </a-space>
                </a-descriptions-item>
                <a-descriptions-item label="Description">{{ selectedNode.description }}</a-descriptions-item>
              </a-descriptions>
              <a-button class="flow-button" type="primary" @click="startFlow">Start flow</a-button>
            </a-tab-pane>

            <a-tab-pane key="runtime" tab="Runtime">
              <a-descriptions size="small" :column="1" bordered>
                <a-descriptions-item label="Host">{{ selectedNode.runtime.host }}</a-descriptions-item>
                <a-descriptions-item label="IP">{{ selectedNode.runtime.ip }}</a-descriptions-item>
                <a-descriptions-item label="Container">{{ selectedNode.runtime.containerName }}</a-descriptions-item>
                <a-descriptions-item label="Image">{{ selectedNode.runtime.image }}</a-descriptions-item>
                <a-descriptions-item label="Ports">{{ selectedNode.runtime.ports.join(', ') }}</a-descriptions-item>
                <a-descriptions-item label="Network">{{ selectedNode.runtime.network }}</a-descriptions-item>
              </a-descriptions>
            </a-tab-pane>

            <a-tab-pane key="configs" tab="Configs">
              <div
                v-for="group in selectedNode.configs"
                :key="group.name"
                class="config-group"
              >
                <h3>{{ group.name }}</h3>
                <div
                  v-for="item in group.items"
                  :key="item.key"
                  class="config-row"
                >
                  <code>{{ item.key }}={{ configDisplayValue(item, `${selectedNode.id}:${group.name}`) }}</code>
                  <a-space>
                    <a-button
                      v-if="item.secret"
                      size="small"
                      @click="toggleConfigVisibility(item, `${selectedNode.id}:${group.name}`)"
                    >
                      {{ isConfigRevealed(item, `${selectedNode.id}:${group.name}`) ? 'Ẩn' : 'Hiện' }}
                    </a-button>
                    <a-button size="small" @click="copyConfigLine(item)">Copy</a-button>
                  </a-space>
                </div>
              </div>
            </a-tab-pane>

            <a-tab-pane key="dependencies" tab="Dependencies">
              <div class="dependency-section">
                <h3>Downstream</h3>
                <a-empty v-if="!downstreamEdges.length" :image="null" description="Không có downstream" />
                <button
                  v-for="edge in downstreamEdges"
                  :key="edge.id"
                  class="dependency-row"
                  type="button"
                  @click="selectEdge(edge.id)"
                >
                  <span>{{ nodeName(edge.target) }}</span>
                  <small>{{ edge.label }} - {{ edge.direction }}</small>
                </button>
              </div>
              <div class="dependency-section">
                <h3>Upstream</h3>
                <a-empty v-if="!upstreamEdges.length" :image="null" description="Không có upstream" />
                <button
                  v-for="edge in upstreamEdges"
                  :key="edge.id"
                  class="dependency-row"
                  type="button"
                  @click="selectEdge(edge.id)"
                >
                  <span>{{ nodeName(edge.source) }}</span>
                  <small>{{ edge.label }} - {{ edge.direction }}</small>
                </button>
              </div>
            </a-tab-pane>

            <a-tab-pane key="flow" tab="Flow">
              <div class="flow-actions">
                <a-button type="primary" @click="startFlow">Start flow</a-button>
                <a-button :disabled="!flowActive" @click="clearFlow">Clear</a-button>
              </div>
              <a-empty v-if="!flowGroups.length" :image="null" description="Chưa có flow downstream" />
              <div v-for="group in flowGroups" :key="group.node?.id" class="flow-group">
                <h3>{{ group.node?.name }}</h3>
                <button
                  v-for="edge in group.edges"
                  :key="edge.id"
                  class="flow-step"
                  type="button"
                  @click="selectEdge(edge.id)"
                >
                  <span>{{ nodeName(edge.target) }}</span>
                  <small>{{ edge.label }} / {{ edge.direction }}</small>
                </button>
              </div>
            </a-tab-pane>

            <a-tab-pane key="notes" tab="Notes">
              <p class="notes-text">{{ selectedNode.notes }}</p>
            </a-tab-pane>
          </a-tabs>
        </template>
      </aside>
    </div>

    <SystemManagerManageDrawer
      v-model:open="manageOpen"
      :selected-environment="selectedEnvironment"
      :environments="environments"
      :topology="topology"
      @saved="refreshAfterManagement"
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

.system-manager-toolbar {
  position: relative;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.toolbar-left {
  position: relative;
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

.search-result-item,
.dependency-row,
.flow-step {
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

.search-result-item:hover,
.dependency-row:hover,
.flow-step:hover {
  background: #f2f7fb;
  border-color: #d9e2ec;
}

.search-result-item span,
.dependency-row span,
.flow-step span {
  font-weight: 650;
}

.search-result-item small,
.dependency-row small,
.flow-step small {
  color: #667085;
}

.system-manager-workspace {
  display: grid;
  min-height: 0;
  flex: 1;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 14px;
}

.graph-panel,
.detail-panel {
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
  background: #f8fafc;
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

.detail-panel {
  padding: 16px;
  overflow: auto;
}

.detail-header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 14px;
}

.detail-header span {
  color: #667085;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.detail-header h2 {
  margin: 3px 0 0;
  font-size: 18px;
  line-height: 1.25;
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

.flow-button {
  width: 100%;
  margin-top: 14px;
}

.config-group + .config-group,
.dependency-section + .dependency-section,
.flow-group + .flow-group {
  margin-top: 16px;
}

.config-group h3,
.dependency-section h3,
.flow-group h3 {
  margin: 0 0 8px;
  color: #344054;
  font-size: 13px;
}

.config-list,
.config-group {
  display: grid;
  gap: 8px;
}

.config-row {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: #f8fafc;
  border: 1px solid #e5e9f0;
  border-radius: 6px;
}

.config-row code {
  min-width: 0;
  overflow: hidden;
  color: #172033;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flow-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.notes-text {
  margin: 0;
  color: #475467;
  line-height: 1.6;
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
