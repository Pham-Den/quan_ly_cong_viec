<script setup lang="ts">
defineProps<{
  label: string
  scope: 'global' | 'env'
}>()
</script>

<template>
  <span
    class="manager-scope-badge"
    :class="scope === 'global' ? 'manager-scope-badge-global' : 'manager-scope-badge-env'"
  >
    {{ label }}
  </span>
</template>
