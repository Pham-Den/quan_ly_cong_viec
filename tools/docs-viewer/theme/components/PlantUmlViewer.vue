<script setup>
import { ref, onMounted, watch } from 'vue'

// Renders a PlantUML source file via the public plantuml.com server (like the drawio viewer uses
// viewer.diagrams.net): the .puml text is hex-encoded (`~h` form — no deflate needed) into the SVG
// URL. Needs internet; the diagram text is sent to plantuml.com.
const props = defineProps({ src: { type: String, required: true } })
const SERVER = 'https://www.plantuml.com/plantuml'

const status = ref('loading')
const imgUrl = ref('')
const errorMsg = ref('')

function hexEncode(text) {
  const bytes = new TextEncoder().encode(text)
  let h = ''
  for (let i = 0; i < bytes.length; i++) h += bytes[i].toString(16).padStart(2, '0')
  return h
}

async function load() {
  status.value = 'loading'
  errorMsg.value = ''
  try {
    const res = await fetch(props.src)
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${props.src}`)
    const text = await res.text()
    imgUrl.value = `${SERVER}/svg/~h${hexEncode(text)}`
    status.value = 'ready'
  } catch (err) {
    status.value = 'error'
    errorMsg.value = err.message || String(err)
  }
}

function onImgError() {
  status.value = 'error'
  errorMsg.value = 'could not load the rendered image from plantuml.com (needs internet)'
}

onMounted(load)
watch(() => props.src, load)
</script>

<template>
  <div class="docs-view-plantuml">
    <p v-if="status === 'loading'">Rendering PlantUML…</p>
    <p v-else-if="status === 'error'" class="docs-view-plantuml-error">PlantUML error: {{ errorMsg }}</p>
    <template v-else>
      <img :src="imgUrl" alt="PlantUML diagram" loading="lazy" @error="onImgError" />
      <p class="docs-view-plantuml-link"><a :href="imgUrl" target="_blank" rel="noopener">Open SVG ↗</a></p>
    </template>
  </div>
</template>

<style scoped>
.docs-view-plantuml img {
  max-width: 100%;
  height: auto;
}
.docs-view-plantuml-error {
  color: var(--vp-c-danger-1, #c00);
}
.docs-view-plantuml-link {
  font-size: 13px;
  opacity: 0.7;
  margin-top: 0.3rem;
}
</style>
