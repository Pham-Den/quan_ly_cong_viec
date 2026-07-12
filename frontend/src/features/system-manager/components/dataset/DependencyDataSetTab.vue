<script setup lang="ts">
import DataSetActionFooter from './DataSetActionFooter.vue'
import DataSetEditState from './DataSetEditState.vue'
import DataSetListPanel from './DataSetListPanel.vue'
import DataSetScopeBadge from './DataSetScopeBadge.vue'
import { dependencyColor, rowColorStyle } from '../../ts/datasetColors'
import type { DependencyForm } from '../../ts/datasetForms'
import type { SystemEnvironment, TopologyEdgeRecord } from '../../ts/mockTopology'

type SelectOption = {
  label: string
  value: string
}

defineProps<{
  edges: TopologyEdgeRecord[]
  form: DependencyForm
  saving: boolean
  dependencyEnvironmentLabel: string
  environmentOptions: SelectOption[]
  nodeOptions: SelectOption[]
  directionOptions: SelectOption[]
  loadingBinding: boolean
}>()

const emit = defineEmits<{
  reset: []
  edit: [edge: TopologyEdgeRecord]
  save: []
  remove: []
  environmentChange: [environmentKey: SystemEnvironment]
}>()
</script>

<template>
  <div class="manager-tab-body">
    <div class="manager-scope">
      Dependency là global. Chọn từng environment trong form để xem/sửa config edge riêng.
    </div>
    <div class="manager-grid">
      <DataSetListPanel title="Dependencies" @create="emit('reset')">
        <button
          v-for="edge in edges"
          :key="edge.id"
          class="manager-row"
          :class="{ 'manager-row-active': form.originalCode === edge.id }"
          :style="rowColorStyle(dependencyColor(edge))"
          type="button"
          @click="emit('edit', edge)"
        >
          <span>{{ edge.label }}</span>
          <small>{{ edge.source }} -> {{ edge.target }}</small>
        </button>
      </DataSetListPanel>

      <a-form layout="vertical" class="manager-form">
        <div class="manager-form-content">
          <DataSetEditState
            :editing="Boolean(form.originalCode)"
            editing-label="Đang sửa dependency"
            creating-label="Tạo dependency mới"
            :title="form.originalCode ? form.label || form.code : 'Chưa lưu'"
          />

          <section class="manager-section">
            <header class="manager-section-header">
              <strong>Global dependency</strong>
              <DataSetScopeBadge label="Global" scope="global" />
            </header>
            <div class="manager-form-grid">
              <a-form-item label="Code">
                <a-input v-model:value="form.code" placeholder="web-redis" />
              </a-form-item>
              <a-form-item label="Label">
                <a-input v-model:value="form.label" placeholder="REDIS_HOST" />
              </a-form-item>
              <a-form-item label="Source">
                <a-select v-model:value="form.sourceCode" :options="nodeOptions" show-search />
              </a-form-item>
              <a-form-item label="Target">
                <a-select v-model:value="form.targetCode" :options="nodeOptions" show-search />
              </a-form-item>
              <a-form-item label="Connection">
                <a-input v-model:value="form.connectionType" placeholder="redis" />
              </a-form-item>
              <a-form-item label="Direction">
                <a-select v-model:value="form.direction" :options="directionOptions" />
              </a-form-item>
              <a-form-item label="Port">
                <a-input v-model:value="form.port" placeholder="6379" />
              </a-form-item>
              <a-form-item label="Sort order">
                <a-input-number v-model:value="form.sortOrder" :min="0" />
              </a-form-item>
            </div>
            <a-form-item label="Description">
              <a-textarea v-model:value="form.description" :rows="2" />
            </a-form-item>
          </section>

          <section class="manager-section">
            <header class="manager-section-header">
              <strong>Edge config binding</strong>
              <DataSetScopeBadge :label="dependencyEnvironmentLabel" scope="env" />
            </header>
            <a-form-item label="Environment config">
              <a-select
                v-model:value="form.environmentKey"
                :options="environmentOptions"
                @change="emit('environmentChange', $event)"
              />
            </a-form-item>
            <a-form-item label="Edge config">
              <a-spin :spinning="loadingBinding">
                <a-textarea
                  v-model:value="form.configText"
                  :rows="4"
                  placeholder="KEY=VALUE&#10;SECRET_KEY=secret:VALUE"
                />
              </a-spin>
            </a-form-item>
          </section>
        </div>

        <DataSetActionFooter
          :editing="Boolean(form.originalCode)"
          :saving="saving"
          entity-label="dependency"
          delete-title="Xóa global dependency này ở mọi environment?"
          @save="emit('save')"
          @reset="emit('reset')"
          @remove="emit('remove')"
        />
      </a-form>
    </div>
  </div>
</template>
