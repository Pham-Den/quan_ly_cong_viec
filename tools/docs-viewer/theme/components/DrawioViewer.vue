<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({ src: { type: String, required: true } })
const iframe = ref(null)
const status = ref('loading')
const errorMsg = ref('')
let content = ''

async function loadAsset() {
  try {
    const res = await fetch(props.src)
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${props.src}`)
    content = await res.text()
  } catch (err) {
    status.value = 'error'
    errorMsg.value = err.message || String(err)
  }
}

function onMessage(e) {
  if (typeof e.data !== 'string' || !iframe.value) return
  let msg
  try {
    msg = JSON.parse(e.data)
  } catch {
    return
  }
  if (msg.event === 'init') {
    iframe.value.contentWindow.postMessage(
      JSON.stringify({ action: 'load', xml: content }),
      '*',
    )
    status.value = 'ready'
  }
}

onMounted(async () => {
  window.addEventListener('message', onMessage)
  await loadAsset()
})

onUnmounted(() => window.removeEventListener('message', onMessage))
</script>

<template>
  <div class="docs-view-drawio">
    <iframe
      ref="iframe"
      src="https://viewer.diagrams.net/?embed=1&proto=json&saveAndExit=0&noSaveBtn=1&noExitBtn=1&lightbox=1"
      title="drawio diagram"
    />
    <div v-if="status === 'loading'" class="loading">Loading diagram…</div>
    <div v-else-if="status === 'error'" class="error">Failed to load: {{ errorMsg }}</div>
  </div>
</template>
