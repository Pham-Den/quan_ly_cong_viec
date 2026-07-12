<script setup lang="ts">
import { computed } from 'vue'

import { statusTagMeta, type StatusTagConfig } from './statusTag'

const props = defineProps<{
  value?: string | null
  config?: StatusTagConfig
  size?: 'default' | 'small'
}>()

const currentStatus = computed(() => statusTagMeta(props.value, props.config))
</script>

<template>
  <a-tag
    :color="currentStatus.color"
    :class="['status-tag', size === 'small' ? 'status-tag-small' : '']"
  >
    <slot>{{ currentStatus.label }}</slot>
  </a-tag>
</template>

<style scoped>
.status-tag {
  margin-inline-end: 0;
}

.status-tag-small {
  font-size: 11px;
  line-height: 18px;
}
</style>
