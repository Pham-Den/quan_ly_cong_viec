<script setup>
defineProps({
  href: { type: String, required: true },
  name: { type: String, required: true },
})
</script>

<template>
  <div class="docs-view-download">
    <span class="name">{{ name }}</span>
    <a class="btn" :href="href" :download="name">Download</a>
  </div>
</template>
