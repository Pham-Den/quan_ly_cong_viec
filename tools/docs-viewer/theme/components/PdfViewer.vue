<script setup>
defineProps({ src: { type: String, required: true } })
</script>

<template>
  <object :data="src" type="application/pdf" class="docs-view-pdf">
    <p>
      Your browser cannot display this PDF inline.
      <a :href="src" target="_blank" rel="noopener">Open / download</a>
    </p>
  </object>
</template>
