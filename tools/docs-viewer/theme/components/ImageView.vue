<script setup>
defineProps({ src: { type: String, required: true } })
</script>

<template>
  <div class="docs-view-image">
    <img :src="src" loading="lazy" />
  </div>
</template>
