<script setup lang="ts">
import { CloseOutlined, CopyOutlined } from '@ant-design/icons-vue'
import { computed } from 'vue'

import StatusTag from '../../../core/components/StatusTag.vue'
import {
  edgeDisplayLabel,
  topologyNodeName,
  topologyStatusLabel,
} from '../ts/topologyDisplay'
import type {
  ConfigItem,
  SystemEnvironment,
  TopologyEdgeRecord,
  TopologyNodeRecord,
} from '../ts/mockTopology'

type FlowGroup = {
  node?: TopologyNodeRecord
  edges: TopologyEdgeRecord[]
}

const props = defineProps<{
  collapsed: boolean
  selectedEnvironment: SystemEnvironment
  topologyLabel: string
  nodes: TopologyNodeRecord[]
  selectedNode: TopologyNodeRecord | null
  selectedEdge: TopologyEdgeRecord | null
  activeTab: string
  downstreamEdges: TopologyEdgeRecord[]
  upstreamEdges: TopologyEdgeRecord[]
  flowGroups: FlowGroup[]
  flowActive: boolean
  revealedConfigKeys: Set<string>
}>()

const emit = defineEmits<{
  'update:activeTab': [value: string]
  'reset-selection': []
  'select-edge': [edgeId: string]
  'start-flow': []
  'clear-flow': []
  'copy-config-line': [item: ConfigItem]
  'toggle-config-visibility': [item: ConfigItem, prefix: string]
}>()

const panelActiveTab = computed({
  get: () => props.activeTab,
  set: (value) => emit('update:activeTab', value),
})
const activeConfigItems = computed(() => props.selectedEdge?.configItems ?? [])

function nodeName(nodeId: string) {
  return topologyNodeName(props.nodes, nodeId)
}

function configVisibilityKey(item: ConfigItem, prefix: string) {
  return `${props.selectedEnvironment}:${prefix}:${item.key}`
}

function isConfigRevealed(item: ConfigItem, prefix: string) {
  return props.revealedConfigKeys.has(configVisibilityKey(item, prefix))
}

function configDisplayValue(item: ConfigItem, prefix: string) {
  if (item.secret && !isConfigRevealed(item, prefix)) {
    return '********'
  }

  return item.value
}
</script>

<template>
  <aside
    class="detail-panel"
    :aria-hidden="collapsed"
    :class="{ 'detail-panel-collapsed': collapsed }"
  >
    <template v-if="selectedEdge">
      <div class="detail-header">
        <div class="detail-title">
          <span>Config detail</span>
          <h2>{{ edgeDisplayLabel(selectedEdge) }}</h2>
        </div>
        <div class="detail-actions">
          <a-tag color="purple">{{ selectedEdge.direction }}</a-tag>
          <a-tooltip title="Bỏ chọn">
            <a-button
              aria-label="Bỏ chọn dependency"
              class="icon-action"
              size="small"
              @click="emit('reset-selection')"
            >
              <template #icon>
                <CloseOutlined />
              </template>
            </a-button>
          </a-tooltip>
        </div>
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
              @click="emit('toggle-config-visibility', item, selectedEdge.id)"
            >
              {{ isConfigRevealed(item, selectedEdge.id) ? 'Ẩn' : 'Hiện' }}
            </a-button>
            <a-tooltip title="Copy">
              <a-button
                aria-label="Copy config line"
                class="icon-action"
                size="small"
                @click="emit('copy-config-line', item)"
              >
                <template #icon>
                  <CopyOutlined />
                </template>
              </a-button>
            </a-tooltip>
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
        <StatusTag :value="selectedNode.status" />
      </div>

      <a-tabs v-model:active-key="panelActiveTab" size="small">
        <a-tab-pane key="overview" tab="Overview">
          <a-descriptions size="small" :column="1" bordered>
            <a-descriptions-item label="Environment">{{ topologyLabel }}</a-descriptions-item>
            <a-descriptions-item label="Type">{{ selectedNode.type }}</a-descriptions-item>
            <a-descriptions-item label="Status">{{ topologyStatusLabel(selectedNode.status) }}</a-descriptions-item>
            <a-descriptions-item label="Tags">
              <a-space wrap>
                <a-tag v-for="tag in selectedNode.tags" :key="tag">{{ tag }}</a-tag>
              </a-space>
            </a-descriptions-item>
            <a-descriptions-item label="Description">{{ selectedNode.description }}</a-descriptions-item>
          </a-descriptions>
          <a-button class="flow-button" type="primary" @click="emit('start-flow')">Start flow</a-button>
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
                  @click="emit('toggle-config-visibility', item, `${selectedNode.id}:${group.name}`)"
                >
                  {{ isConfigRevealed(item, `${selectedNode.id}:${group.name}`) ? 'Ẩn' : 'Hiện' }}
                </a-button>
                <a-tooltip title="Copy">
                  <a-button
                    aria-label="Copy config line"
                    class="icon-action"
                    size="small"
                    @click="emit('copy-config-line', item)"
                  >
                    <template #icon>
                      <CopyOutlined />
                    </template>
                  </a-button>
                </a-tooltip>
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
              @click="emit('select-edge', edge.id)"
            >
              <span>{{ nodeName(edge.target) }}</span>
              <small>{{ edgeDisplayLabel(edge) }} - {{ edge.direction }}</small>
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
              @click="emit('select-edge', edge.id)"
            >
              <span>{{ nodeName(edge.source) }}</span>
              <small>{{ edgeDisplayLabel(edge) }} - {{ edge.direction }}</small>
            </button>
          </div>
        </a-tab-pane>

        <a-tab-pane key="flow" tab="Flow">
          <div class="flow-actions">
            <a-button type="primary" @click="emit('start-flow')">Start flow</a-button>
            <a-button :disabled="!flowActive" @click="emit('clear-flow')">Clear</a-button>
          </div>
          <a-empty v-if="!flowGroups.length" :image="null" description="Chưa có flow downstream" />
          <div v-for="group in flowGroups" :key="group.node?.id" class="flow-group">
            <h3>{{ group.node?.name }}</h3>
            <button
              v-for="edge in group.edges"
              :key="edge.id"
              class="flow-step"
              type="button"
              @click="emit('select-edge', edge.id)"
            >
              <span>{{ nodeName(edge.target) }}</span>
              <small>{{ edgeDisplayLabel(edge) }} / {{ edge.direction }}</small>
            </button>
          </div>
        </a-tab-pane>

        <a-tab-pane key="notes" tab="Notes">
          <p class="notes-text">{{ selectedNode.notes }}</p>
        </a-tab-pane>
      </a-tabs>
    </template>
  </aside>
</template>

<style scoped>
.detail-panel {
  min-height: 0;
  padding: 16px;
  min-width: 0;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #d9e2ec;
  border-radius: 8px;
  opacity: 1;
  visibility: visible;
  transition:
    padding 0.22s ease,
    border-color 0.22s ease,
    opacity 0.18s ease,
    visibility 0s linear;
}

.detail-panel-collapsed {
  padding: 0;
  pointer-events: none;
  border-color: transparent;
  opacity: 0;
  visibility: hidden;
}

.detail-panel :deep(.ant-descriptions-view),
.detail-panel :deep(.ant-tabs-content-holder) {
  overflow: hidden;
}

.detail-panel :deep(.ant-descriptions-item-content) {
  min-width: 0;
  overflow-wrap: anywhere;
}

.detail-header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 14px;
}

.detail-title {
  min-width: 0;
}

.detail-header span {
  color: #667085;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.detail-header h2 {
  margin: 3px 0 0;
  overflow-wrap: anywhere;
  font-size: 18px;
  line-height: 1.25;
}

.detail-actions {
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
  align-items: center;
  flex-wrap: nowrap;
  justify-content: flex-end;
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
  flex: 1;
  color: #172033;
  font-size: 12px;
  line-height: 1.45;
  overflow-wrap: anywhere;
  white-space: normal;
}

.config-row :deep(.ant-space) {
  flex: 0 0 auto;
}

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

.dependency-row:hover,
.flow-step:hover {
  background: #f2f7fb;
  border-color: #d9e2ec;
}

.dependency-row span,
.flow-step span {
  font-weight: 650;
}

.dependency-row small,
.flow-step small {
  color: #667085;
}

.icon-action {
  width: 28px;
  padding: 0;
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
</style>
