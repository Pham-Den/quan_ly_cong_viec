<script setup lang="ts">
import { computed } from 'vue'

import { taskWorkStatusMeta, taskWorkStatusOptions } from '../../services/workflow'

const props = defineProps<{
  value?: string | null
  disabled?: boolean
}>()

const emit = defineEmits<{
  change: [value: string]
}>()

const currentStatus = computed(() => taskWorkStatusMeta(props.value || 'TODO'))
</script>

<template>
  <span class="task-work-status-dropdown" @click.stop>
    <a-dropdown :trigger="['click']" :disabled="disabled">
      <a-tag :color="currentStatus.color" :class="['task-work-status-tag', { 'is-clickable': !disabled }]">
        {{ currentStatus.label }}
      </a-tag>
      <template #overlay>
        <a-menu>
          <a-menu-item v-for="option in taskWorkStatusOptions" :key="option.value" @click="emit('change', option.value)">
            <a-tag :color="option.color" class="task-work-status-menu-tag">{{ option.label }}</a-tag>
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>
  </span>
</template>
