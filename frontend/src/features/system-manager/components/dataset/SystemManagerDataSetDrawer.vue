<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import DependencyDataSetTab from './DependencyDataSetTab.vue'
import EnvironmentDataSetTab from './EnvironmentDataSetTab.vue'
import HostDataSetTab from './HostDataSetTab.vue'
import NodeDataSetTab from './NodeDataSetTab.vue'
import './system-manager-dataset.css'
import type { SystemManagerEnvironment } from '../../ts/service'
import type { SystemEnvironment, TopologyEnvironmentData } from '../../ts/mockTopology'
import {
  directionOptions,
  environmentColorPresets,
  kindOptions,
  statusValues,
} from '../../ts/datasetForms'
import { useDependencyDataSet } from '../../ts/useDependencyDataSet'
import { useEnvironmentDataSet } from '../../ts/useEnvironmentDataSet'
import { useHostDataSet } from '../../ts/useHostDataSet'
import { useNodeDataSet } from '../../ts/useNodeDataSet'

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
const drawerBodyStyle = {
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  paddingBottom: '0',
} as const

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
const dependencyEnvironmentOptions = computed(() =>
  props.environments.map((environment) => ({
    label: environment.label,
    value: environment.key,
  })),
)
const {
  environmentForm,
  resetEnvironmentForm,
  editEnvironment,
  saveEnvironment,
  removeCurrentEnvironment,
} = useEnvironmentDataSet({
  saving,
  activate: () => {
    activeTab.value = 'environments'
  },
  onSaved: (environmentKey) => emit('saved', environmentKey),
})
const {
  hosts,
  loadingHosts,
  hostForm,
  resetHostForm,
  editHost,
  refreshHosts,
  saveHost,
  removeCurrentHost,
} = useHostDataSet({
  currentEnvironment,
  saving,
  activate: () => {
    activeTab.value = 'hosts'
  },
  onSaved: (environmentKey) => emit('saved', environmentKey),
})
const {
  nodeForm,
  hostOptions,
  loadingNodeBinding,
  resetNodeForm,
  syncCurrentEnvironmentHosts,
  editNode,
  saveNode,
  removeCurrentNode,
  handleNodeEnvironmentChange,
} = useNodeDataSet({
  currentEnvironment,
  expandedNodes,
  hosts,
  saving,
  activate: () => {
    activeTab.value = 'nodes'
  },
  onSaved: (environmentKey) => emit('saved', environmentKey),
})
const {
  dependencyForm,
  loadingDependencyBinding,
  resetDependencyForm,
  editDependency,
  saveDependency,
  removeCurrentDependency,
  handleDependencyEnvironmentChange,
} = useDependencyDataSet({
  currentEnvironment,
  expandedEdges,
  saving,
  activate: () => {
    activeTab.value = 'dependencies'
  },
  onSaved: (environmentKey) => emit('saved', environmentKey),
})
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

watch(hosts, (nextHosts) => syncCurrentEnvironmentHosts(nextHosts))
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
