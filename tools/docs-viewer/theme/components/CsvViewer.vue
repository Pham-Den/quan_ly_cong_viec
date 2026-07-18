<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({ src: { type: String, required: true } })
const rows = ref([])
const headers = ref([])
const status = ref('loading')
const errorMsg = ref('')

onMounted(async () => {
  try {
    const [res, Papa] = await Promise.all([fetch(props.src), import('papaparse')])
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const text = await res.text()
    const parsed = Papa.default.parse(text, { header: true, skipEmptyLines: true })
    headers.value = parsed.meta.fields || []
    rows.value = parsed.data
    status.value = 'ready'
  } catch (err) {
    status.value = 'error'
    errorMsg.value = err.message || String(err)
  }
})
</script>

<template>
  <div class="docs-view-csv-table">
    <p v-if="status === 'loading'" style="padding: 1rem">Loading…</p>
    <p v-else-if="status === 'error'" style="padding: 1rem; color: var(--vp-c-danger-1)">
      Failed to parse CSV: {{ errorMsg }}
    </p>
    <table v-else>
      <thead>
        <tr>
          <th v-for="h in headers" :key="h">{{ h }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in rows" :key="i">
          <td v-for="h in headers" :key="h">{{ row[h] }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
