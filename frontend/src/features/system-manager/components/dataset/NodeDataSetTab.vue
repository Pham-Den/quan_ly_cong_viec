<script setup lang="ts">
import StatusTag from '../../../../core/components/StatusTag.vue'
import { statusTagMeta } from '../../../../core/components/statusTag'
import DataSetActionFooter from './DataSetActionFooter.vue'
import DataSetEditState from './DataSetEditState.vue'
import DataSetListPanel from './DataSetListPanel.vue'
import DataSetScopeBadge from './DataSetScopeBadge.vue'
import { nodeColor, rowColorStyle } from '../../ts/datasetColors'
import type { NodeForm } from '../../ts/datasetForms'
import type { SystemEnvironment, TopologyNodeRecord } from '../../ts/mockTopology'

type SelectOption = {
  label: string
  value: string
}

defineProps<{
  nodes: TopologyNodeRecord[]
  form: NodeForm
  saving: boolean
  selectedEnvironmentLabel: string
  nodeEnvironmentLabel: string
  environmentOptions: SelectOption[]
  kindOptions: SelectOption[]
  statusValues: string[]
  hostOptions: SelectOption[]
  loadingBinding: boolean
}>()

const emit = defineEmits<{
  reset: []
  edit: [node: TopologyNodeRecord]
  save: []
  remove: []
  environmentChange: [environmentKey: SystemEnvironment]
}>()

function statusLabel(status: string) {
  return statusTagMeta(status).label
}
</script>

<template>
  <div class="manager-tab-body">
    <div class="manager-scope">
      Node global; runtime/config bên dưới áp dụng cho environment: {{ selectedEnvironmentLabel }}
    </div>
    <div class="manager-grid">
      <DataSetListPanel title="Nodes" @create="emit('reset')">
        <button
          v-for="node in nodes"
          :key="node.id"
          class="manager-row"
          :class="{ 'manager-row-active': form.originalCode === node.id }"
          :style="rowColorStyle(nodeColor(node))"
          type="button"
          @click="emit('edit', node)"
        >
          <span>{{ node.name }}</span>
          <small>{{ node.kind }} / {{ node.id }}</small>
        </button>
      </DataSetListPanel>

      <a-form layout="vertical" class="manager-form">
        <div class="manager-form-content">
          <DataSetEditState
            :editing="Boolean(form.originalCode)"
            editing-label="Đang sửa node"
            creating-label="Tạo node mới"
            :title="form.originalCode ? form.name || form.code : 'Chưa lưu'"
          />

          <section class="manager-section">
            <header class="manager-section-header">
              <strong>Global node</strong>
              <DataSetScopeBadge label="Global" scope="global" />
            </header>
            <div class="manager-form-grid">
              <a-form-item label="Code">
                <a-input v-model:value="form.code" placeholder="redis" />
              </a-form-item>
              <a-form-item label="Name">
                <a-input v-model:value="form.name" placeholder="Redis" />
              </a-form-item>
              <a-form-item label="Kind">
                <a-select v-model:value="form.kind" :options="kindOptions" />
              </a-form-item>
              <a-form-item label="Type">
                <a-input v-model:value="form.type" placeholder="Cache" />
              </a-form-item>
              <a-form-item label="Position X">
                <a-input-number v-model:value="form.positionX" />
              </a-form-item>
              <a-form-item label="Position Y">
                <a-input-number v-model:value="form.positionY" />
              </a-form-item>
            </div>
            <a-form-item label="Description">
              <a-textarea v-model:value="form.description" :rows="2" />
            </a-form-item>
            <a-form-item label="Notes">
              <a-textarea v-model:value="form.notes" :rows="2" />
            </a-form-item>
          </section>

          <section class="manager-section">
            <header class="manager-section-header">
              <strong>Runtime/config binding</strong>
              <DataSetScopeBadge :label="nodeEnvironmentLabel" scope="env" />
            </header>
            <a-form-item label="Environment">
              <a-select
                v-model:value="form.environmentKey"
                :options="environmentOptions"
                @change="emit('environmentChange', $event)"
              />
            </a-form-item>
            <a-spin :spinning="loadingBinding">
              <div class="manager-form-grid">
                <a-form-item label="Status">
                  <a-select v-model:value="form.status">
                    <template #option="{ value }">
                      <StatusTag :value="String(value)" size="small" />
                    </template>
                    <a-select-option
                      v-for="status in statusValues"
                      :key="status"
                      :label="statusLabel(status)"
                      :value="status"
                    >
                      <StatusTag :value="status" size="small" />
                    </a-select-option>
                  </a-select>
                </a-form-item>
                <a-form-item label="Host">
                  <a-select
                    v-model:value="form.hostId"
                    :loading="loadingBinding"
                    :options="hostOptions"
                  />
                </a-form-item>
                <a-form-item label="Container">
                  <a-input v-model:value="form.containerName" />
                </a-form-item>
                <a-form-item label="Image">
                  <a-input v-model:value="form.image" />
                </a-form-item>
                <a-form-item label="Ports">
                  <a-input v-model:value="form.portsText" placeholder="8080, 9001" />
                </a-form-item>
                <a-form-item label="Network">
                  <a-input v-model:value="form.network" />
                </a-form-item>
              </div>
              <a-form-item label="Tags">
                <a-input v-model:value="form.tagsText" placeholder="Laravel, Docker, Internal" />
              </a-form-item>
              <a-form-item label="Config groups">
                <a-textarea
                  v-model:value="form.configText"
                  :rows="5"
                  placeholder="Group|KEY|VALUE|secret"
                />
              </a-form-item>
            </a-spin>
          </section>
        </div>

        <DataSetActionFooter
          :editing="Boolean(form.originalCode)"
          :saving="saving"
          entity-label="node"
          delete-title="Xóa global node này? Dependency và binding ở mọi environment cũng sẽ bị xóa."
          @save="emit('save')"
          @reset="emit('reset')"
          @remove="emit('remove')"
        />
      </a-form>
    </div>
  </div>
</template>
