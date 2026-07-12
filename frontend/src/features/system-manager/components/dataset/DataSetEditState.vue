<script setup lang="ts">
defineProps<{
  editing: boolean
  editingLabel: string
  creatingLabel: string
  title: string
}>()
</script>

<template>
  <div class="manager-edit-state" :class="{ 'manager-edit-state-active': editing }">
    <span>{{ editing ? editingLabel : creatingLabel }}</span>
    <strong>{{ title }}</strong>
  </div>
</template>
