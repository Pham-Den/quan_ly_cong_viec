<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  value?: string | null
  emptyText?: string
}>()

const formattedValue = computed(() => {
  const rawValue = props.value?.trim() ?? ''

  if (!rawValue) {
    return ''
  }

  try {
    return JSON.stringify(JSON.parse(rawValue), null, 2)
  } catch {
    return rawValue
  }
})
</script>

<template>
  <pre class="json-code-block"><code>{{ formattedValue || emptyText || 'Không có mô tả' }}</code></pre>
</template>
