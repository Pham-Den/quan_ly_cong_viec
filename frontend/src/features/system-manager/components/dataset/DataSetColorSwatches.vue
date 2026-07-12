<script setup lang="ts">
defineProps<{
  modelValue: string
  colors: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div class="manager-color-swatches">
    <button
      v-for="color in colors"
      :key="color"
      :aria-label="`Chọn màu ${color}`"
      class="manager-color-swatch"
      :class="{ 'manager-color-swatch-active': modelValue === color }"
      :style="{ '--manager-swatch-color': color }"
      type="button"
      @click="emit('update:modelValue', color)"
    />
  </div>
</template>
