<script setup lang="ts">
import { CloseOutlined, CopyOutlined } from '@ant-design/icons-vue'

import type { ConfigItem } from '../ts/mockTopology'

type QuickConfigItem = ConfigItem & {
  displayValue: string
}

defineProps<{
  title: string
  items: QuickConfigItem[]
  popoverStyle: Record<string, string>
}>()

const emit = defineEmits<{
  close: []
  copy: [item: ConfigItem]
  copyAll: []
}>()
</script>

<template>
  <div class="edge-config-popover" :style="popoverStyle" @click.stop>
    <header>
      <div>
        <span>Config nhanh</span>
        <strong>{{ title }}</strong>
      </div>
      <div class="edge-config-actions">
        <a-tooltip v-if="items.length" title="Copy all">
          <button
            aria-label="Copy all config nhanh"
            class="edge-config-copy-all"
            type="button"
            @click.stop="emit('copyAll')"
          >
            <CopyOutlined />
          </button>
        </a-tooltip>
        <a-tooltip title="Đóng">
          <button
            aria-label="Đóng config nhanh"
            class="edge-config-close"
            type="button"
            @click.stop="emit('close')"
          >
            <CloseOutlined />
          </button>
        </a-tooltip>
      </div>
    </header>

    <div v-if="items.length" class="edge-config-popover-list">
      <div v-for="item in items" :key="item.key" class="edge-config-popover-row">
        <code>{{ item.key }}={{ item.displayValue }}</code>
        <a-tooltip title="Copy">
          <button
            aria-label="Copy config nhanh"
            class="edge-config-copy"
            type="button"
            @click.stop="emit('copy', item)"
          >
            <CopyOutlined />
          </button>
        </a-tooltip>
      </div>
    </div>
    <div v-else class="edge-config-popover-empty">Chưa có config cho environment này</div>
  </div>
</template>

<style scoped>
.edge-config-popover {
  position: fixed;
  z-index: 1200;
  width: min(320px, 70vw);
  padding: 10px;
  pointer-events: all;
  background: #ffffff;
  border: 1px solid #d9e2ec;
  border-radius: 8px;
  box-shadow: 0 18px 42px rgba(23, 32, 51, 0.18);
}

.edge-config-popover header {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 8px;
}

.edge-config-popover header span {
  display: block;
  color: #667085;
  font-size: 11px;
  font-weight: 750;
  text-transform: uppercase;
}

.edge-config-popover header strong {
  display: block;
  margin-top: 2px;
  overflow-wrap: anywhere;
  color: #172033;
  font-size: 13px;
  line-height: 1.25;
}

.edge-config-close,
.edge-config-copy-all,
.edge-config-copy {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #344054;
  cursor: pointer;
  background: #ffffff;
  border: 1px solid #d9e2ec;
  border-radius: 5px;
}

.edge-config-actions {
  display: inline-flex;
  gap: 6px;
  align-items: center;
}

.edge-config-close,
.edge-config-copy-all {
  width: 24px;
  min-width: 24px;
  height: 24px;
}

.edge-config-popover-list {
  display: grid;
  gap: 6px;
}

.edge-config-popover-row {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 7px 8px;
  background: #f8fafc;
  border: 1px solid #e5e9f0;
  border-radius: 6px;
}

.edge-config-popover-row code {
  min-width: 0;
  flex: 1;
  color: #172033;
  font-size: 11px;
  line-height: 1.45;
  overflow-wrap: anywhere;
  white-space: normal;
}

.edge-config-copy {
  width: 26px;
  min-width: 26px;
  height: 26px;
}

.edge-config-popover-empty {
  padding: 10px;
  color: #667085;
  font-size: 12px;
  text-align: center;
  background: #f8fafc;
  border: 1px dashed #d9e2ec;
  border-radius: 6px;
}

.edge-config-close:hover,
.edge-config-copy-all:hover,
.edge-config-copy:hover {
  color: #147c74;
  border-color: #9edbd1;
}
</style>
