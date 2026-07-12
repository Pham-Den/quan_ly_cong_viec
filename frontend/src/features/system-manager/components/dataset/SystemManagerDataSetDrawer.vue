<script setup lang="ts">
import { message } from 'ant-design-vue'
import { computed, reactive, ref, watch } from 'vue'

import DependencyDataSetTab from './DependencyDataSetTab.vue'
import EnvironmentDataSetTab from './EnvironmentDataSetTab.vue'
import HostDataSetTab from './HostDataSetTab.vue'
import NodeDataSetTab from './NodeDataSetTab.vue'
import {
  createSystemManagerDependency,
  createSystemManagerEnvironment,
  createSystemManagerHost,
  createSystemManagerNode,
  deleteSystemManagerDependency,
  deleteSystemManagerEnvironment,
  deleteSystemManagerHost,
  deleteSystemManagerNode,
  loadSystemManagerHosts,
  loadSystemManagerTopology,
  updateSystemManagerDependency,
  updateSystemManagerEnvironment,
  updateSystemManagerHost,
  updateSystemManagerNode,
  type SystemManagerEnvironment,
  type SystemManagerHost,
} from '../../ts/service'
import type {
  SystemEnvironment,
  TopologyEdgeRecord,
  TopologyEnvironmentData,
  TopologyNodeRecord,
} from '../../ts/mockTopology'
import { normalizeEnvironmentColor } from '../../ts/environmentColor'
import {
  assignForm,
  directionOptions,
  emptyDependencyForm,
  emptyEnvironmentForm,
  emptyHostForm,
  emptyNodeForm,
  environmentColorPresets,
  kindOptions,
  listFromText,
  statusValues,
  type DependencyForm,
  type EnvironmentForm,
  type HostForm,
  type NodeForm,
} from '../../ts/datasetForms'
import {
  formatDependencyConfigs,
  formatNodeConfigs,
  parseDependencyConfigText,
  parseNodeConfigText,
} from '../../ts/datasetConfigText'

const props = defineProps<{
  open: boolean
  selectedEnvironment: SystemEnvironment
  environments: SystemManagerEnvironment[]
  topology: TopologyEnvironmentData
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  saved: [environmentKey?: SystemEnvironment]
}>()

const activeTab = ref('nodes')
const saving = ref(false)
const loadingHosts = ref(false)
const loadingNodeBinding = ref(false)
const loadingDependencyBinding = ref(false)
const hosts = ref<SystemManagerHost[]>([])
const nodeBindingHosts = ref<SystemManagerHost[]>([])
const drawerBodyStyle = {
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  paddingBottom: '0',
} as const

const environmentForm = reactive<EnvironmentForm>(emptyEnvironmentForm())
const hostForm = reactive<HostForm>(emptyHostForm(props.selectedEnvironment))
const nodeForm = reactive<NodeForm>(emptyNodeForm(props.selectedEnvironment))
const dependencyForm = reactive<DependencyForm>(emptyDependencyForm(props.selectedEnvironment))

const drawerOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
})
const currentEnvironment = computed(() => props.selectedEnvironment)
const expandedNodes = computed(() => props.topology.expandedNodes)
const expandedEdges = computed(() => props.topology.expandedEdges)
const selectedEnvironmentLabel = computed(
  () =>
    props.environments.find((environment) => environment.key === currentEnvironment.value)?.label ??
    currentEnvironment.value,
)
const nodeOptions = computed(() =>
  expandedNodes.value.map((node) => ({
    label: `${node.name} (${node.id})`,
    value: node.id,
  })),
)
const hostOptions = computed(() => [
  { label: 'Không gắn host', value: '' },
  ...nodeBindingHosts.value.map((host) => ({
    label: `${host.name} - ${host.ip}`,
    value: host.id,
  })),
])
const dependencyEnvironmentOptions = computed(() =>
  props.environments.map((environment) => ({
    label: environment.label,
    value: environment.key,
  })),
)
const nodeEnvironmentLabel = computed(
  () =>
    props.environments.find((environment) => environment.key === nodeForm.environmentKey)?.label ??
    nodeForm.environmentKey,
)
const dependencyEnvironmentLabel = computed(
  () =>
    props.environments.find((environment) => environment.key === dependencyForm.environmentKey)?.label ??
    dependencyForm.environmentKey,
)

function resetEnvironmentForm() {
  assignForm(environmentForm, emptyEnvironmentForm())
}

function resetHostForm() {
  assignForm(hostForm, emptyHostForm(currentEnvironment.value))
}

function resetNodeForm() {
  assignForm(nodeForm, emptyNodeForm(currentEnvironment.value))
  nodeBindingHosts.value = hosts.value
}

function resetDependencyForm() {
  assignForm(dependencyForm, emptyDependencyForm(currentEnvironment.value))
}

function editEnvironment(environment: SystemManagerEnvironment) {
  assignForm(environmentForm, {
    id: environment.id,
    key: environment.key,
    name: environment.label,
    description: environment.description ?? '',
    color: normalizeEnvironmentColor(environment.color, environment.key),
    sortOrder: environment.sortOrder ?? 0,
  })
  activeTab.value = 'environments'
}

function editHost(host: SystemManagerHost) {
  assignForm(hostForm, {
    id: host.id,
    environmentKey: currentEnvironment.value,
    name: host.name,
    ip: host.ip,
    description: host.description ?? '',
    sortOrder: host.sortOrder,
  })
  activeTab.value = 'hosts'
}

function editNode(node: TopologyNodeRecord) {
  assignForm(nodeForm, {
    ...emptyNodeForm(currentEnvironment.value),
    originalCode: node.id,
    environmentKey: currentEnvironment.value,
    hostId: node.runtime.hostId ?? '',
    code: node.id,
    name: node.name,
    kind: node.kind,
    type: node.type,
    status: node.status,
    description: node.description,
    tagsText: node.tags.join(', '),
    containerName: node.runtime.containerName,
    image: node.runtime.image,
    portsText: node.runtime.ports.join(', '),
    network: node.runtime.network,
    notes: node.notes,
    positionX: node.position.x,
    positionY: node.position.y,
    configText: formatNodeConfigs(node.configs),
  })
  nodeBindingHosts.value = hosts.value
  activeTab.value = 'nodes'
}

function assignNodeBindingFields(node: TopologyNodeRecord | undefined) {
  nodeForm.hostId = node?.runtime.hostId ?? ''
  nodeForm.status = node?.status ?? 'unknown'
  nodeForm.tagsText = node?.tags.join(', ') ?? ''
  nodeForm.containerName = node?.runtime.containerName ?? ''
  nodeForm.image = node?.runtime.image ?? ''
  nodeForm.portsText = node?.runtime.ports.join(', ') ?? ''
  nodeForm.network = node?.runtime.network ?? ''
  nodeForm.configText = node ? formatNodeConfigs(node.configs) : ''
}

async function loadNodeBindingForEnvironment(environmentKey: SystemEnvironment) {
  loadingNodeBinding.value = true
  nodeForm.environmentKey = environmentKey

  try {
    const [nextHosts, topology] = await Promise.all([
      loadSystemManagerHosts(environmentKey),
      nodeForm.originalCode ? loadSystemManagerTopology(environmentKey) : Promise.resolve(null),
    ])

    nodeBindingHosts.value = nextHosts

    if (!nodeForm.originalCode) {
      if (nodeForm.hostId && !nextHosts.some((host) => host.id === nodeForm.hostId)) {
        nodeForm.hostId = ''
      }

      return
    }

    const node = topology?.expandedNodes.find((item) => item.id === nodeForm.originalCode)

    assignNodeBindingFields(node)
  } catch (error) {
    console.error(error)
    message.error('Không tải được runtime/config node theo environment')
  } finally {
    loadingNodeBinding.value = false
  }
}

function handleNodeEnvironmentChange(environmentKey: SystemEnvironment) {
  void loadNodeBindingForEnvironment(environmentKey)
}

function editDependency(edge: TopologyEdgeRecord) {
  assignForm(dependencyForm, {
    ...emptyDependencyForm(currentEnvironment.value),
    originalCode: edge.id,
    environmentKey: currentEnvironment.value,
    code: edge.id,
    sourceCode: edge.source,
    targetCode: edge.target,
    label: edge.label,
    connectionType: edge.connectionType,
    direction: edge.direction,
    port: edge.port,
    description: edge.description,
    configText: formatDependencyConfigs(edge.configItems),
  })
  activeTab.value = 'dependencies'
}

async function loadDependencyConfigForEnvironment(environmentKey: SystemEnvironment) {
  if (!dependencyForm.originalCode) {
    return
  }

  loadingDependencyBinding.value = true

  try {
    const topology = await loadSystemManagerTopology(environmentKey)
    const edge = topology.expandedEdges.find((item) => item.id === dependencyForm.originalCode)

    dependencyForm.configText = edge ? formatDependencyConfigs(edge.configItems) : ''
  } catch (error) {
    console.error(error)
    message.error('Không tải được config dependency theo environment')
  } finally {
    loadingDependencyBinding.value = false
  }
}

function handleDependencyEnvironmentChange(environmentKey: SystemEnvironment) {
  dependencyForm.environmentKey = environmentKey
  void loadDependencyConfigForEnvironment(environmentKey)
}

async function refreshHosts() {
  loadingHosts.value = true

  try {
    const nextHosts = await loadSystemManagerHosts(currentEnvironment.value)

    hosts.value = nextHosts

    if (nodeForm.environmentKey === currentEnvironment.value) {
      nodeBindingHosts.value = nextHosts
    }
  } catch (error) {
    console.error(error)
    message.error('Không tải được host System Manager')
  } finally {
    loadingHosts.value = false
  }
}

async function saveEnvironment() {
  saving.value = true

  try {
    const payload = {
      key: environmentForm.key,
      name: environmentForm.name,
      description: environmentForm.description,
      color: environmentForm.color,
      sortOrder: environmentForm.sortOrder,
    }
    const saved = environmentForm.id
      ? await updateSystemManagerEnvironment(environmentForm.id, payload)
      : await createSystemManagerEnvironment(payload)

    resetEnvironmentForm()
    message.success('Đã lưu environment')
    emit('saved', saved.key)
  } catch (error) {
    console.error(error)
    message.error('Không lưu được environment')
  } finally {
    saving.value = false
  }
}

async function removeEnvironment(environment: SystemManagerEnvironment) {
  saving.value = true

  try {
    await deleteSystemManagerEnvironment(environment.id)
    resetEnvironmentForm()
    message.success('Đã xóa environment')
    emit('saved')
  } catch (error) {
    console.error(error)
    message.error('Không xóa được environment')
  } finally {
    saving.value = false
  }
}

function removeCurrentEnvironment() {
  if (!environmentForm.id) {
    return
  }

  void removeEnvironment({
    id: environmentForm.id,
    key: environmentForm.key,
    label: environmentForm.name,
    description: environmentForm.description ?? null,
    color: environmentForm.color,
    sortOrder: environmentForm.sortOrder,
  })
}

async function saveHost() {
  saving.value = true

  try {
    const payload = {
      environmentKey: currentEnvironment.value,
      name: hostForm.name,
      ip: hostForm.ip,
      description: hostForm.description,
      sortOrder: hostForm.sortOrder,
    }

    if (hostForm.id) {
      await updateSystemManagerHost(hostForm.id, payload)
    } else {
      await createSystemManagerHost(payload)
    }

    resetHostForm()
    await refreshHosts()
    message.success('Đã lưu host')
    emit('saved', currentEnvironment.value)
  } catch (error) {
    console.error(error)
    message.error('Không lưu được host')
  } finally {
    saving.value = false
  }
}

async function removeHost(host: SystemManagerHost) {
  saving.value = true

  try {
    await deleteSystemManagerHost(host.id)
    resetHostForm()
    await refreshHosts()
    message.success('Đã xóa host')
    emit('saved', currentEnvironment.value)
  } catch (error) {
    console.error(error)
    message.error('Không xóa được host')
  } finally {
    saving.value = false
  }
}

function removeCurrentHost() {
  if (!hostForm.id) {
    return
  }

  void removeHost({
    id: hostForm.id,
    environmentId: '',
    name: hostForm.name,
    ip: hostForm.ip,
    description: hostForm.description ?? null,
    sortOrder: hostForm.sortOrder ?? 0,
  })
}

async function saveNode() {
  saving.value = true

  try {
    const savedEnvironment = nodeForm.environmentKey
    const payload = {
      environmentKey: savedEnvironment,
      hostId: nodeForm.hostId,
      code: nodeForm.code,
      name: nodeForm.name,
      kind: nodeForm.kind,
      type: nodeForm.type,
      status: nodeForm.status,
      description: nodeForm.description,
      tags: listFromText(nodeForm.tagsText),
      containerName: nodeForm.containerName,
      image: nodeForm.image,
      ports: listFromText(nodeForm.portsText),
      network: nodeForm.network,
      notes: nodeForm.notes,
      positionX: nodeForm.positionX,
      positionY: nodeForm.positionY,
      configs: parseNodeConfigText(nodeForm.configText),
    }

    if (nodeForm.originalCode) {
      await updateSystemManagerNode(nodeForm.originalCode, payload)
    } else {
      await createSystemManagerNode(payload)
    }

    resetNodeForm()
    message.success('Đã lưu node')
    emit('saved', currentEnvironment.value)
  } catch (error) {
    console.error(error)
    message.error('Không lưu được node')
  } finally {
    saving.value = false
  }
}

async function removeNode(node: TopologyNodeRecord) {
  saving.value = true

  try {
    await deleteSystemManagerNode(currentEnvironment.value, node.id)
    resetNodeForm()
    message.success('Đã xóa node')
    emit('saved', currentEnvironment.value)
  } catch (error) {
    console.error(error)
    message.error('Không xóa được node')
  } finally {
    saving.value = false
  }
}

function removeCurrentNode() {
  const node = expandedNodes.value.find((item) => item.id === nodeForm.originalCode)

  if (node) {
    void removeNode(node)
  }
}

async function saveDependency() {
  const configItems = parseDependencyConfigText(dependencyForm.configText)
  const hasExistingDependency = Boolean(dependencyForm.originalCode || dependencyForm.code.trim())
  const hasSourceTarget = Boolean(dependencyForm.sourceCode && dependencyForm.targetCode)

  if (!hasExistingDependency && !hasSourceTarget) {
    message.warning('Chọn dependency có sẵn hoặc chọn Source/Target để tạo dependency mới')
    return
  }

  if (!dependencyForm.label.trim() && !configItems.length) {
    message.warning('Nhập Label hoặc ít nhất một dòng Edge config')
    return
  }

  saving.value = true

  try {
    const savedEnvironment = dependencyForm.environmentKey
    const payload = {
      environmentKey: savedEnvironment,
      code: dependencyForm.code,
      sourceCode: dependencyForm.sourceCode,
      targetCode: dependencyForm.targetCode,
      label: dependencyForm.label,
      connectionType: dependencyForm.connectionType,
      direction: dependencyForm.direction,
      port: dependencyForm.port,
      description: dependencyForm.description,
      sortOrder: dependencyForm.sortOrder,
      configItems,
    }

    if (dependencyForm.originalCode) {
      await updateSystemManagerDependency(dependencyForm.originalCode, payload)
    } else {
      await createSystemManagerDependency(payload)
    }

    resetDependencyForm()
    message.success('Đã lưu dependency')
    emit('saved', currentEnvironment.value)
  } catch (error) {
    console.error(error)
    message.error('Không lưu được dependency')
  } finally {
    saving.value = false
  }
}

async function removeDependency(edge: TopologyEdgeRecord) {
  saving.value = true

  try {
    await deleteSystemManagerDependency(currentEnvironment.value, edge.id)
    resetDependencyForm()
    message.success('Đã xóa dependency')
    emit('saved', currentEnvironment.value)
  } catch (error) {
    console.error(error)
    message.error('Không xóa được dependency')
  } finally {
    saving.value = false
  }
}

function removeCurrentDependency() {
  const edge = expandedEdges.value.find((item) => item.id === dependencyForm.originalCode)

  if (edge) {
    void removeDependency(edge)
  }
}

watch(
  () => [props.open, currentEnvironment.value] as const,
  ([open]) => {
    resetHostForm()
    resetNodeForm()
    resetDependencyForm()

    if (open) {
      void refreshHosts()
    }
  },
)
</script>

<template>
  <a-drawer
    v-model:open="drawerOpen"
    title="Quản lý dữ liệu System Manager"
    :width="1120"
    :body-style="drawerBodyStyle"
  >
    <div class="manager-drawer-layout">
      <a-alert
        class="manager-hint"
        type="info"
        show-icon
        message="Phase 4: node/dependency là global; host, runtime, status và config là binding theo environment đang chọn."
      />

      <a-tabs v-model:active-key="activeTab" class="manager-tabs" size="small">
        <a-tab-pane key="environments" tab="Environments">
          <EnvironmentDataSetTab
            :environments="environments"
            :form="environmentForm"
            :saving="saving"
            :color-presets="environmentColorPresets"
            @reset="resetEnvironmentForm"
            @edit="editEnvironment"
            @save="saveEnvironment"
            @remove="removeCurrentEnvironment"
          />
        </a-tab-pane>

        <a-tab-pane key="hosts" tab="Hosts">
          <HostDataSetTab
            :hosts="hosts"
            :form="hostForm"
            :saving="saving"
            :loading="loadingHosts"
            @reset="resetHostForm"
            @edit="editHost"
            @save="saveHost"
            @remove="removeCurrentHost"
          />
        </a-tab-pane>

        <a-tab-pane key="nodes" tab="Nodes">
          <NodeDataSetTab
            :nodes="expandedNodes"
            :form="nodeForm"
            :saving="saving"
            :selected-environment-label="selectedEnvironmentLabel"
            :node-environment-label="nodeEnvironmentLabel"
            :environment-options="dependencyEnvironmentOptions"
            :kind-options="kindOptions"
            :status-values="statusValues"
            :host-options="hostOptions"
            :loading-binding="loadingNodeBinding"
            @reset="resetNodeForm"
            @edit="editNode"
            @save="saveNode"
            @remove="removeCurrentNode"
            @environment-change="handleNodeEnvironmentChange"
          />
        </a-tab-pane>

        <a-tab-pane key="dependencies" tab="Dependencies">
          <DependencyDataSetTab
            :edges="expandedEdges"
            :form="dependencyForm"
            :saving="saving"
            :dependency-environment-label="dependencyEnvironmentLabel"
            :environment-options="dependencyEnvironmentOptions"
            :node-options="nodeOptions"
            :direction-options="directionOptions"
            :loading-binding="loadingDependencyBinding"
            @reset="resetDependencyForm"
            @edit="editDependency"
            @save="saveDependency"
            @remove="removeCurrentDependency"
            @environment-change="handleDependencyEnvironmentChange"
          />
        </a-tab-pane>
      </a-tabs>
    </div>
  </a-drawer>
</template>

<style>
.manager-drawer-layout {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
}

.manager-hint {
  flex: 0 0 auto;
  margin-bottom: 12px;
}

.manager-tabs {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
}

.manager-tabs .ant-tabs-nav {
  flex: 0 0 auto;
  margin-bottom: 0;
}

.manager-tabs .ant-tabs-content-holder {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.manager-tabs .ant-tabs-content {
  height: 100%;
}

.manager-tabs .ant-tabs-tabpane {
  height: 100%;
  overflow: hidden;
}

.manager-tab-body {
  display: flex;
  height: 100%;
  min-height: 0;
  padding-top: 12px;
  flex-direction: column;
}

.manager-scope {
  flex: 0 0 auto;
  margin-bottom: 10px;
  color: #475467;
  font-size: 13px;
  font-weight: 650;
}

.manager-inline-alert {
  margin-bottom: 12px;
}

.manager-grid {
  display: grid;
  flex: 1;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 20px;
  min-height: 0;
  overflow: hidden;
}

.manager-list {
  min-height: 0;
  padding-right: 12px;
  overflow: auto;
  border-right: 1px solid #e5e9f0;
}

.manager-list header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.manager-row {
  --manager-row-color: #667085;

  position: relative;
  display: flex;
  width: 100%;
  padding: 8px 10px;
  color: inherit;
  text-align: left;
  cursor: pointer;
  background: #ffffff;
  border: 1px solid transparent;
  border-radius: 6px;
  box-shadow: inset 3px 0 0 var(--manager-row-color);
  flex-direction: column;
}

.manager-row:hover {
  background: #f2f7fb;
  border-color: #d9e2ec;
}

.manager-row-active {
  background: #f8fbff;
  border-color: var(--manager-row-color);
}

.manager-row-active span {
  color: #101828;
}

.manager-row span {
  overflow: hidden;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.manager-row small {
  overflow: hidden;
  color: #667085;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.manager-form {
  display: flex;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  flex-direction: column;
}

.manager-form-content {
  flex: 1;
  min-height: 0;
  padding-right: 4px;
  overflow: auto;
}

.manager-edit-state {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  padding: 9px 10px;
  margin-bottom: 12px;
  background: #f8fafc;
  border: 1px solid #e3e8ef;
  border-radius: 6px;
}

.manager-edit-state span {
  color: #667085;
  font-size: 12px;
  font-weight: 650;
}

.manager-edit-state strong {
  min-width: 0;
  overflow: hidden;
  color: #344054;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.manager-edit-state-active {
  background: #eff8ff;
  border-color: #84caff;
}

.manager-edit-state-active span {
  color: #175cd3;
}

.manager-section {
  padding: 12px 12px 2px;
  margin-bottom: 12px;
  border: 1px solid #e3e8ef;
  border-radius: 8px;
}

.manager-section-header {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.manager-section-header strong {
  color: #344054;
  font-size: 13px;
}

.manager-color-field {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  gap: 8px;
}

.manager-color-native {
  padding: 4px;
}

.manager-color-native input {
  min-height: 24px;
  padding: 0;
  cursor: pointer;
}

.manager-color-swatches {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.manager-color-swatch {
  --manager-swatch-color: #667085;

  width: 22px;
  height: 22px;
  padding: 0;
  cursor: pointer;
  background: var(--manager-swatch-color);
  border: 2px solid #ffffff;
  border-radius: 999px;
  box-shadow:
    0 0 0 1px #d0d5dd,
    0 2px 5px rgba(23, 32, 51, 0.12);
}

.manager-color-swatch-active {
  box-shadow:
    0 0 0 2px var(--manager-swatch-color),
    0 2px 5px rgba(23, 32, 51, 0.12);
}

.manager-scope-badge {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 2px 8px;
  color: #344054;
  font-size: 12px;
  font-weight: 650;
  white-space: nowrap;
  border-radius: 6px;
}

.manager-scope-badge-global {
  color: #175cd3;
  background: #eff8ff;
  border: 1px solid #b2ddff;
}

.manager-scope-badge-env {
  color: #067647;
  background: #ecfdf3;
  border: 1px solid #abefc6;
}

.manager-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 12px;
}

.manager-actions {
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
  padding: 12px 0;
  margin-top: 12px;
  background: #ffffff;
  border-top: 1px solid #e5e9f0;
}
</style>
