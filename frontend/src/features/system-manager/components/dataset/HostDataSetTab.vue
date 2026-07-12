<script setup lang="ts">
import DataSetActionFooter from './DataSetActionFooter.vue'
import DataSetEditState from './DataSetEditState.vue'
import DataSetListPanel from './DataSetListPanel.vue'
import { hostColor, rowColorStyle } from '../../ts/datasetColors'
import type { HostForm } from '../../ts/datasetForms'
import type { SystemManagerHost } from '../../ts/service'

defineProps<{
  hosts: SystemManagerHost[]
  form: HostForm
  saving: boolean
  loading: boolean
}>()

const emit = defineEmits<{
  reset: []
  edit: [host: SystemManagerHost]
  save: []
  remove: []
}>()
</script>

<template>
  <div class="manager-tab-body">
    <div class="manager-grid">
      <DataSetListPanel title="Hosts" @create="emit('reset')">
        <a-spin :spinning="loading">
          <button
            v-for="host in hosts"
            :key="host.id"
            class="manager-row"
            :class="{ 'manager-row-active': form.id === host.id }"
            :style="rowColorStyle(hostColor(host))"
            type="button"
            @click="emit('edit', host)"
          >
            <span>{{ host.name }}</span>
            <small>{{ host.ip }}</small>
          </button>
        </a-spin>
      </DataSetListPanel>

      <a-form layout="vertical" class="manager-form">
        <div class="manager-form-content">
          <DataSetEditState
            :editing="Boolean(form.id)"
            editing-label="Đang sửa host"
            creating-label="Tạo host mới"
            :title="form.id ? form.name || form.ip : 'Chưa lưu'"
          />

          <a-form-item label="Name">
            <a-input v-model:value="form.name" placeholder="dev-app-01" />
          </a-form-item>
          <a-form-item label="IP">
            <a-input v-model:value="form.ip" placeholder="10.20.1.21" />
          </a-form-item>
          <a-form-item label="Description">
            <a-textarea v-model:value="form.description" :rows="2" />
          </a-form-item>
          <a-form-item label="Sort order">
            <a-input-number v-model:value="form.sortOrder" :min="0" />
          </a-form-item>
        </div>

        <DataSetActionFooter
          :editing="Boolean(form.id)"
          :saving="saving"
          entity-label="host"
          delete-title="Xóa host này? Node đang dùng host sẽ chuyển sang không gắn host."
          @save="emit('save')"
          @reset="emit('reset')"
          @remove="emit('remove')"
        />
      </a-form>
    </div>
  </div>
</template>
