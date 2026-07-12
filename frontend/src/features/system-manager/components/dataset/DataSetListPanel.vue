<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    createLabel?: string
  }>(),
  {
    createLabel: 'Tạo mới',
  },
)

const emit = defineEmits<{
  create: []
}>()
</script>

<template>
  <section class="manager-list">
    <header>
      <strong>{{ title }}</strong>
      <a-button size="small" @click="emit('create')">{{ createLabel }}</a-button>
    </header>

    <slot />
  </section>
</template>
