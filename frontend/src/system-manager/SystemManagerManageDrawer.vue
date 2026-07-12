<script setup lang="ts">
import { message } from 'ant-design-vue'
import { computed, reactive, ref, watch } from 'vue'

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
  type SaveSystemDependencyInput,
  type SaveSystemEnvironmentInput,
  type SaveSystemHostInput,
  type SaveSystemNodeInput,
  type SystemManagerEnvironment,
  type SystemManagerHost,
} from '../services/system-manager'
import type {
  ConfigGroup,
  ConfigItem,
  SystemEnvironment,
  TopologyEdgeRecord,
  TopologyEnvironmentData,
  TopologyNodeRecord,
} from './mockTopology'

type EnvironmentForm = SaveSystemEnvironmentInput & {
  id: string
}

type HostForm = SaveSystemHostInput & {
  id: string
}

type NodeForm = Omit<SaveSystemNodeInput, 'tags' | 'ports' | 'configs'> & {
  originalCode: string
  tagsText: string
  portsText: string
  configText: string
}

type DependencyForm = Omit<SaveSystemDependencyInput, 'configItems'> & {
  originalCode: string
  configText: string
}

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
const loadingDependencyBinding = ref(false)
const hosts = ref<SystemManagerHost[]>([])

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
  () => props.environments.find((environment) => environment.key === currentEnvironment.value)?.label ?? currentEnvironment.value,
)
const nodeOptions = computed(() =>
  expandedNodes.value.map((node) => ({
    label: `${node.name} (${node.id})`,
    value: node.id,
  })),
)
const hostOptions = computed(() => [
  { label: 'Không gắn host', value: '' },
  ...hosts.value.map((host) => ({
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

const kindOptions = [
  { label: 'App', value: 'app' },
  { label: 'Component', value: 'component' },
  { label: 'Service', value: 'service' },
]
const statusOptions = ['healthy', 'warning', 'down', 'unknown', 'maintenance', 'disabled'].map((status) => ({
  label: status,
  value: status,
}))
const directionOptions = ['request', 'read', 'write', 'publish', 'consume', 'proxy'].map((direction) => ({
  label: direction,
  value: direction,
}))

function emptyEnvironmentForm(): EnvironmentForm {
  return {
    id: '',
    key: '',
    name: '',
    description: '',
    sortOrder: 0,
  }
}

function emptyHostForm(environmentKey: SystemEnvironment): HostForm {
  return {
    id: '',
    environmentKey,
    name: '',
    ip: '',
    description: '',
    sortOrder: 0,
  }
}

function emptyNodeForm(environmentKey: SystemEnvironment): NodeForm {
  return {
    originalCode: '',
    environmentKey,
    hostId: '',
    code: '',
    name: '',
    kind: 'service',
    type: 'Service',
    status: 'unknown',
    description: '',
    tagsText: '',
    containerName: '',
    image: '',
    portsText: '',
    network: '',
    notes: '',
    positionX: 120,
    positionY: 160,
    configText: '',
  }
}

function emptyDependencyForm(environmentKey: SystemEnvironment): DependencyForm {
  return {
    originalCode: '',
    environmentKey,
    code: '',
    sourceCode: '',
    targetCode: '',
    label: '',
    connectionType: 'dependency',
    direction: 'request',
    port: '',
    description: '',
    sortOrder: 0,
    configText: '',
  }
}

function assignForm<T extends object>(target: T, source: T) {
  Object.assign(target, source)
}

function listFromText(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function secretFlag(value = '') {
  return ['1', 'true', 'yes', 'secret', 'sensitive'].includes(value.trim().toLowerCase())
}

function parseNodeConfigText(value: string) {
  const groups = new Map<string, ConfigGroup>()

  for (const line of value.split('\n')) {
    const trimmed = line.trim()

    if (!trimmed) {
      continue
    }

    const [groupName, key, configValue = '', secret = ''] = trimmed.split('|')
    const name = groupName?.trim()
    const configKey = key?.trim()

    if (!name || !configKey) {
      continue
    }

    const group = groups.get(name) ?? { name, items: [] }

    group.items.push({
      key: configKey,
      value: configValue.trim(),
      secret: secretFlag(secret),
    })
    groups.set(name, group)
  }

  return Array.from(groups.values())
}

function formatNodeConfigs(configs: ConfigGroup[]) {
  return configs
    .flatMap((group) =>
      group.items.map((item) => `${group.name}|${item.key}|${item.value}|${item.secret ? 'secret' : ''}`),
    )
    .join('\n')
}

function parseDependencyConfigText(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      if (line.includes('|')) {
        const [key, configValue = '', secret = ''] = line.split('|')

        return {
          key: key?.trim() ?? '',
          value: configValue.trim(),
          secret: secretFlag(secret),
        }
      }

      const separatorIndex = line.indexOf('=')

      if (separatorIndex < 0) {
        return {
          key: line,
          value: '',
          secret: false,
        }
      }

      const key = line.slice(0, separatorIndex).trim()
      const rawValue = line.slice(separatorIndex + 1).trim()
      const secret = rawValue.startsWith('secret:')

      return {
        key,
        value: secret ? rawValue.slice('secret:'.length) : rawValue,
        secret,
      }
    })
    .filter((item) => Boolean(item.key))
}

function formatDependencyConfigs(configs: ConfigItem[]) {
  return configs.map((item) => `${item.key}=${item.secret ? 'secret:' : ''}${item.value}`).join('\n')
}

function resetEnvironmentForm() {
  assignForm(environmentForm, emptyEnvironmentForm())
}

function resetHostForm() {
  assignForm(hostForm, emptyHostForm(currentEnvironment.value))
}

function resetNodeForm() {
  assignForm(nodeForm, emptyNodeForm(currentEnvironment.value))
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
  activeTab.value = 'nodes'
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
    hosts.value = await loadSystemManagerHosts(currentEnvironment.value)
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
    const payload = {
      environmentKey: currentEnvironment.value,
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
    emit('saved', savedEnvironment)
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
  <a-drawer v-model:open="drawerOpen" title="Quản lý dữ liệu System Manager" width="720">
    <a-alert
      class="manager-hint"
      type="info"
      show-icon
      message="Phase 4: node/dependency là global; host, runtime, status và config là binding theo environment đang chọn."
    />

    <a-tabs v-model:active-key="activeTab" size="small">
      <a-tab-pane key="environments" tab="Environments">
        <div class="manager-grid">
          <section class="manager-list">
            <header>
              <strong>Danh sách environment</strong>
              <a-button size="small" @click="resetEnvironmentForm">Tạo mới</a-button>
            </header>

            <button
              v-for="environment in environments"
              :key="environment.id"
              class="manager-row"
              type="button"
              @click="editEnvironment(environment)"
            >
              <span>{{ environment.label }}</span>
              <small>{{ environment.key }}</small>
            </button>
          </section>

          <a-form layout="vertical" class="manager-form">
            <a-form-item label="Key">
              <a-input v-model:value="environmentForm.key" placeholder="staging" />
            </a-form-item>
            <a-form-item label="Name">
              <a-input v-model:value="environmentForm.name" placeholder="Staging" />
            </a-form-item>
            <a-form-item label="Description">
              <a-textarea v-model:value="environmentForm.description" :rows="2" />
            </a-form-item>
            <a-form-item label="Sort order">
              <a-input-number v-model:value="environmentForm.sortOrder" :min="0" />
            </a-form-item>

            <div class="manager-actions">
              <a-button type="primary" :loading="saving" @click="saveEnvironment">Lưu environment</a-button>
              <a-button @click="resetEnvironmentForm">Clear</a-button>
              <a-popconfirm
                v-if="environmentForm.id"
                title="Xóa environment này và toàn bộ binding/host bên trong? Global topology vẫn giữ nguyên."
                ok-text="Xóa"
                cancel-text="Hủy"
                @confirm="removeCurrentEnvironment"
              >
                <a-button danger>Xóa</a-button>
              </a-popconfirm>
            </div>
          </a-form>
        </div>
      </a-tab-pane>

      <a-tab-pane key="hosts" tab="Hosts">
        <div class="manager-scope">Host theo environment: {{ selectedEnvironmentLabel }}</div>
        <div class="manager-grid">
          <section class="manager-list">
            <header>
              <strong>Hosts</strong>
              <a-button size="small" @click="resetHostForm">Tạo mới</a-button>
            </header>
            <a-spin :spinning="loadingHosts">
              <button
                v-for="host in hosts"
                :key="host.id"
                class="manager-row"
                type="button"
                @click="editHost(host)"
              >
                <span>{{ host.name }}</span>
                <small>{{ host.ip }}</small>
              </button>
            </a-spin>
          </section>

          <a-form layout="vertical" class="manager-form">
            <a-form-item label="Name">
              <a-input v-model:value="hostForm.name" placeholder="dev-app-01" />
            </a-form-item>
            <a-form-item label="IP">
              <a-input v-model:value="hostForm.ip" placeholder="10.20.1.21" />
            </a-form-item>
            <a-form-item label="Description">
              <a-textarea v-model:value="hostForm.description" :rows="2" />
            </a-form-item>
            <a-form-item label="Sort order">
              <a-input-number v-model:value="hostForm.sortOrder" :min="0" />
            </a-form-item>

            <div class="manager-actions">
              <a-button type="primary" :loading="saving" @click="saveHost">Lưu host</a-button>
              <a-button @click="resetHostForm">Clear</a-button>
              <a-popconfirm
                v-if="hostForm.id"
                title="Xóa host này? Node đang dùng host sẽ chuyển sang không gắn host."
                ok-text="Xóa"
                cancel-text="Hủy"
                @confirm="removeCurrentHost"
              >
                <a-button danger>Xóa</a-button>
              </a-popconfirm>
            </div>
          </a-form>
        </div>
      </a-tab-pane>

      <a-tab-pane key="nodes" tab="Nodes">
        <div class="manager-scope">
          Node global; runtime/config bên dưới áp dụng cho environment: {{ selectedEnvironmentLabel }}
        </div>
        <div class="manager-grid">
          <section class="manager-list">
            <header>
              <strong>Nodes</strong>
              <a-button size="small" @click="resetNodeForm">Tạo mới</a-button>
            </header>
            <button
              v-for="node in expandedNodes"
              :key="node.id"
              class="manager-row"
              type="button"
              @click="editNode(node)"
            >
              <span>{{ node.name }}</span>
              <small>{{ node.kind }} / {{ node.id }}</small>
            </button>
          </section>

          <a-form layout="vertical" class="manager-form">
            <div class="manager-form-grid">
              <a-form-item label="Code">
                <a-input v-model:value="nodeForm.code" placeholder="redis" />
              </a-form-item>
              <a-form-item label="Name">
                <a-input v-model:value="nodeForm.name" placeholder="Redis" />
              </a-form-item>
              <a-form-item label="Kind">
                <a-select v-model:value="nodeForm.kind" :options="kindOptions" />
              </a-form-item>
              <a-form-item label="Type">
                <a-input v-model:value="nodeForm.type" placeholder="Cache" />
              </a-form-item>
              <a-form-item label="Status">
                <a-select v-model:value="nodeForm.status" :options="statusOptions" />
              </a-form-item>
              <a-form-item label="Host">
                <a-select v-model:value="nodeForm.hostId" :options="hostOptions" />
              </a-form-item>
              <a-form-item label="Position X">
                <a-input-number v-model:value="nodeForm.positionX" />
              </a-form-item>
              <a-form-item label="Position Y">
                <a-input-number v-model:value="nodeForm.positionY" />
              </a-form-item>
            </div>

            <a-form-item label="Description">
              <a-textarea v-model:value="nodeForm.description" :rows="2" />
            </a-form-item>
            <a-form-item label="Tags">
              <a-input v-model:value="nodeForm.tagsText" placeholder="Laravel, Docker, Internal" />
            </a-form-item>
            <div class="manager-form-grid">
              <a-form-item label="Container">
                <a-input v-model:value="nodeForm.containerName" />
              </a-form-item>
              <a-form-item label="Image">
                <a-input v-model:value="nodeForm.image" />
              </a-form-item>
              <a-form-item label="Ports">
                <a-input v-model:value="nodeForm.portsText" placeholder="8080, 9001" />
              </a-form-item>
              <a-form-item label="Network">
                <a-input v-model:value="nodeForm.network" />
              </a-form-item>
            </div>
            <a-form-item label="Config groups">
              <a-textarea
                v-model:value="nodeForm.configText"
                :rows="5"
                placeholder="Group|KEY|VALUE|secret"
              />
            </a-form-item>
            <a-form-item label="Notes">
              <a-textarea v-model:value="nodeForm.notes" :rows="2" />
            </a-form-item>

            <div class="manager-actions">
              <a-button type="primary" :loading="saving" @click="saveNode">Lưu node</a-button>
              <a-button @click="resetNodeForm">Clear</a-button>
              <a-popconfirm
                v-if="nodeForm.originalCode"
                title="Xóa global node này? Dependency và binding ở mọi environment cũng sẽ bị xóa."
                ok-text="Xóa"
                cancel-text="Hủy"
                @confirm="removeCurrentNode"
              >
                <a-button danger>Xóa</a-button>
              </a-popconfirm>
            </div>
          </a-form>
        </div>
      </a-tab-pane>

      <a-tab-pane key="dependencies" tab="Dependencies">
        <div class="manager-scope">
          Dependency là global. Chọn từng environment trong form để xem/sửa config edge riêng.
        </div>
        <div class="manager-grid">
          <section class="manager-list">
            <header>
              <strong>Dependencies</strong>
              <a-button size="small" @click="resetDependencyForm">Tạo mới</a-button>
            </header>
            <button
              v-for="edge in expandedEdges"
              :key="edge.id"
              class="manager-row"
              type="button"
              @click="editDependency(edge)"
            >
              <span>{{ edge.label }}</span>
              <small>{{ edge.source }} -> {{ edge.target }}</small>
            </button>
          </section>

          <a-form layout="vertical" class="manager-form">
            <div class="manager-form-grid">
              <a-form-item label="Code">
                <a-input v-model:value="dependencyForm.code" placeholder="web-redis" />
              </a-form-item>
              <a-form-item label="Label">
                <a-input v-model:value="dependencyForm.label" placeholder="REDIS_HOST" />
              </a-form-item>
              <a-form-item label="Source">
                <a-select v-model:value="dependencyForm.sourceCode" :options="nodeOptions" show-search />
              </a-form-item>
              <a-form-item label="Target">
                <a-select v-model:value="dependencyForm.targetCode" :options="nodeOptions" show-search />
              </a-form-item>
              <a-form-item label="Connection">
                <a-input v-model:value="dependencyForm.connectionType" placeholder="redis" />
              </a-form-item>
              <a-form-item label="Direction">
                <a-select v-model:value="dependencyForm.direction" :options="directionOptions" />
              </a-form-item>
              <a-form-item label="Port">
                <a-input v-model:value="dependencyForm.port" placeholder="6379" />
              </a-form-item>
              <a-form-item label="Sort order">
                <a-input-number v-model:value="dependencyForm.sortOrder" :min="0" />
              </a-form-item>
            </div>
            <a-form-item label="Description">
              <a-textarea v-model:value="dependencyForm.description" :rows="2" />
            </a-form-item>
            <a-alert
              class="manager-inline-alert"
              type="success"
              show-icon
              message="Config dependency theo environment"
              description="Source/Target/Label là global. Phần Edge config bên dưới được lưu riêng cho environment đang chọn."
            />
            <a-form-item label="Environment config">
              <a-select
                v-model:value="dependencyForm.environmentKey"
                :options="dependencyEnvironmentOptions"
                @change="handleDependencyEnvironmentChange"
              />
            </a-form-item>
            <a-form-item label="Edge config">
              <a-spin :spinning="loadingDependencyBinding">
                <a-textarea
                  v-model:value="dependencyForm.configText"
                  :rows="4"
                  placeholder="KEY=VALUE&#10;SECRET_KEY=secret:VALUE"
                />
              </a-spin>
            </a-form-item>

            <div class="manager-actions">
              <a-button type="primary" :loading="saving" @click="saveDependency">Lưu dependency</a-button>
              <a-button @click="resetDependencyForm">Clear</a-button>
              <a-popconfirm
                v-if="dependencyForm.originalCode"
                title="Xóa global dependency này ở mọi environment?"
                ok-text="Xóa"
                cancel-text="Hủy"
                @confirm="removeCurrentDependency"
              >
                <a-button danger>Xóa</a-button>
              </a-popconfirm>
            </div>
          </a-form>
        </div>
      </a-tab-pane>
    </a-tabs>
  </a-drawer>
</template>

<style scoped>
.manager-hint {
  margin-bottom: 12px;
}

.manager-scope {
  margin-bottom: 12px;
  color: #475467;
  font-size: 13px;
  font-weight: 650;
}

.manager-inline-alert {
  margin-bottom: 12px;
}

.manager-grid {
  display: grid;
  grid-template-columns: 230px minmax(0, 1fr);
  gap: 16px;
}

.manager-list {
  min-height: 320px;
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

.manager-row:hover {
  background: #f2f7fb;
  border-color: #d9e2ec;
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
  min-width: 0;
}

.manager-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 12px;
}

.manager-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
}
</style>
