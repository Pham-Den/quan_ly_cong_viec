<script setup lang="ts">
import DataSetActionFooter from './DataSetActionFooter.vue'
import DataSetColorSwatches from './DataSetColorSwatches.vue'
import DataSetEditState from './DataSetEditState.vue'
import DataSetListPanel from './DataSetListPanel.vue'
import DataSetScopeBadge from './DataSetScopeBadge.vue'
import { environmentColor, rowColorStyle } from '../../ts/datasetColors'
import type { EnvironmentForm } from '../../ts/datasetForms'
import type { SystemManagerEnvironment } from '../../ts/service'

defineProps<{
  environments: SystemManagerEnvironment[]
  form: EnvironmentForm
  saving: boolean
  colorPresets: string[]
}>()

const emit = defineEmits<{
  reset: []
  edit: [environment: SystemManagerEnvironment]
  save: []
  remove: []
}>()
</script>

<template>
  <div class="manager-tab-body">
    <div class="manager-grid">
      <DataSetListPanel title="Danh sách environment" @create="emit('reset')">
        <button
          v-for="environment in environments"
          :key="environment.id"
          class="manager-row"
          :class="{ 'manager-row-active': form.id === environment.id }"
          :style="rowColorStyle(environmentColor(environment))"
          type="button"
          @click="emit('edit', environment)"
        >
          <span>{{ environment.label }}</span>
          <small>{{ environment.key }}</small>
        </button>
      </DataSetListPanel>

      <a-form layout="vertical" class="manager-form">
        <div class="manager-form-content">
          <DataSetEditState
            :editing="Boolean(form.id)"
            editing-label="Đang sửa environment"
            creating-label="Tạo environment mới"
            :title="form.id ? form.name || form.key : 'Chưa lưu'"
          />

          <section class="manager-section">
            <header class="manager-section-header">
              <strong>Environment catalog</strong>
              <DataSetScopeBadge label="Global" scope="global" />
            </header>
            <a-form-item label="Key">
              <a-input v-model:value="form.key" placeholder="staging" />
            </a-form-item>
            <a-form-item label="Name">
              <a-input v-model:value="form.name" placeholder="Staging" />
            </a-form-item>
            <a-form-item label="Description">
              <a-textarea v-model:value="form.description" :rows="2" />
            </a-form-item>
            <a-form-item label="Color">
              <div class="manager-color-field">
                <a-input
                  v-model:value="form.color"
                  aria-label="Chọn màu environment"
                  class="manager-color-native"
                  type="color"
                />
                <a-input v-model:value="form.color" placeholder="#2563eb" />
              </div>
              <DataSetColorSwatches v-model="form.color" :colors="colorPresets" />
            </a-form-item>
            <a-form-item label="Sort order">
              <a-input-number v-model:value="form.sortOrder" :min="0" />
            </a-form-item>
          </section>
        </div>

        <DataSetActionFooter
          :editing="Boolean(form.id)"
          :saving="saving"
          entity-label="environment"
          delete-title="Xóa environment này và toàn bộ binding/host bên trong? Global topology vẫn giữ nguyên."
          @save="emit('save')"
          @reset="emit('reset')"
          @remove="emit('remove')"
        />
      </a-form>
    </div>
  </div>
</template>
