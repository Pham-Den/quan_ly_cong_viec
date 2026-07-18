<script setup>
import { ref, onMounted } from 'vue'

// Interactive folder chooser shown when no docs/ was found. Talks to the local dev server:
//  - GET  /__docs-list?dir=   → list subfolders (+ nearby docs candidates)
//  - POST /__docs-native      → open the OS-native folder dialog, return its path
//  - POST /__docs-pick {dir}  → re-point the server at the chosen folder (page reloads)
const LIST = '/__docs-list'
const NATIVE = '/__docs-native'
const PICK = '/__docs-pick'
const READY = '/__docs-ready'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function currentGen() {
  try {
    const r = await fetch(READY, { cache: 'no-store' })
    if (r.ok) return (await r.json()).gen
  } catch {
    /* server is mid-restart */
  }
  return null
}

const loading = ref(true)
const error = ref('')
const cur = ref(null) // { dir, parent, isDocs, hasDocs, entries }
const candidates = ref([])
const busy = ref('')
const manual = ref('')

async function list(dir) {
  loading.value = true
  error.value = ''
  try {
    const r = await fetch(dir ? `${LIST}?dir=${encodeURIComponent(dir)}` : LIST)
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const d = await r.json()
    cur.value = d
    if (d.candidates) candidates.value = d.candidates
  } catch (e) {
    error.value = `Cannot list folders: ${e.message || e}`
  } finally {
    loading.value = false
  }
}

async function pick(dir) {
  if (!dir) return
  busy.value = `Opening ${dir} …`
  const gen0 = await currentGen() // the current server's readiness token, before we re-point
  let r
  try {
    r = await fetch(PICK, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ dir }),
    })
  } catch (e) {
    busy.value = ''
    error.value = `Open failed: ${e.message || e}`
    return
  }
  if (!r.ok) {
    busy.value = ''
    error.value = `Not a valid docs folder: ${dir}`
    return
  }
  // Poll until the server has torn down + re-served on this port (its token advances), THEN reload —
  // no fixed-delay race (which caused "unreachable"/404).
  busy.value = 'Loading the docs view…'
  for (let i = 0; i < 80; i++) {
    await sleep(250)
    const g = await currentGen()
    if (g != null && (gen0 == null || g > gen0)) {
      location.reload()
      return
    }
  }
  location.reload() // fallback after ~20s
}

async function osDialog() {
  busy.value = 'Opening your OS folder dialog…'
  try {
    const r = await fetch(NATIVE, { method: 'POST' })
    const d = await r.json().catch(() => ({}))
    if (!r.ok || !d.dir) {
      busy.value = ''
      error.value = 'OS dialog unavailable or cancelled — browse below instead.'
      return
    }
    pick(d.dir)
  } catch (e) {
    busy.value = ''
    error.value = `OS dialog failed: ${e.message || e}`
  }
}

onMounted(() => list())
</script>

<template>
  <div class="dv-fb">
    <div v-if="busy" class="dv-fb-busy">{{ busy }}</div>

    <p class="dv-fb-intro">Pick the docs folder to view — choose one of three ways:</p>

    <!-- Option 1: native OS dialog -->
    <div class="dv-fb-card dv-fb-opt">
      <p class="dv-fb-h"><span class="dv-fb-num">1</span> Open your computer's folder dialog</p>
      <button class="dv-fb-btn dv-fb-primary" type="button" @click="osDialog">📂 Browse with your OS…</button>
    </div>

    <div class="dv-fb-or">or</div>

    <!-- Option 2: in-page filesystem browser -->
    <div class="dv-fb-card dv-fb-opt">
      <p class="dv-fb-h"><span class="dv-fb-num">2</span> Browse folders here</p>
      <div v-if="candidates.length" class="dv-fb-nearby">
        <p class="dv-fb-h-sm">Found nearby — quick pick:</p>
        <ul class="dv-fb-list">
          <li v-for="c in candidates" :key="c"><button class="dv-fb-link" type="button" @click="pick(c)">📁 {{ c }}</button></li>
        </ul>
      </div>
      <p v-if="error" class="dv-fb-err">{{ error }}</p>
      <template v-if="cur">
        <p class="dv-fb-path">📂 <code>{{ cur.dir }}</code></p>

        <!-- detected docs in the current folder — set apart + highlighted -->
        <div v-if="cur.hasDocs || cur.isDocs" class="dv-fb-detected">
          <span>✓ Found a <code>docs/</code> folder here.</span>
          <button class="dv-fb-btn dv-fb-primary" type="button" @click="pick(cur.dir)">Open this folder</button>
        </div>

        <ul class="dv-fb-list">
          <li v-if="cur.parent"><button class="dv-fb-link" type="button" @click="list(cur.parent)">⬆ ..</button></li>
          <li v-for="e in cur.entries" :key="e.path" :class="{ 'dv-fb-row-docs': e.hasDocs || e.isDocs }">
            <button class="dv-fb-link" type="button" @click="list(e.path)">📁 {{ e.name }}</button>
            <template v-if="e.hasDocs || e.isDocs">
              <span class="dv-fb-tag">docs/</span>
              <button class="dv-fb-open" type="button" @click="pick(e.path)">open</button>
            </template>
          </li>
        </ul>
        <p v-if="!cur.entries.length" class="dv-fb-note">(no subfolders here)</p>
      </template>
      <p v-else-if="loading">Loading…</p>
    </div>

    <div class="dv-fb-or">or</div>

    <!-- Option 3: paste a path -->
    <div class="dv-fb-card dv-fb-opt">
      <p class="dv-fb-h"><span class="dv-fb-num">3</span> Paste a path</p>
      <div class="dv-fb-paste">
        <input v-model="manual" class="dv-fb-input" type="text" placeholder="/absolute/path/to/docs or project root" @keyup.enter="pick(manual)" />
        <button class="dv-fb-btn dv-fb-primary" type="button" @click="pick(manual)">Open</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dv-fb-busy {
  position: fixed;
  inset: 0;
  z-index: 99;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font: 600 16px system-ui, sans-serif;
}
.dv-fb-intro {
  margin: 0.2rem 0 0.8rem;
  opacity: 0.85;
}
.dv-fb-card {
  border: 1px solid var(--vp-c-divider, #ddd);
  border-radius: 10px;
  padding: 14px 18px;
  margin: 0.8rem 0;
}
.dv-fb-opt {
  background: var(--vp-c-bg-soft, #f6f6f7);
}
.dv-fb-or {
  text-align: center;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.5;
  margin: 0.2rem 0;
}
.dv-fb-h {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.7rem;
  font-weight: 600;
}
.dv-fb-h-sm {
  font-size: 13px;
  font-weight: 600;
  opacity: 0.75;
  margin-bottom: 0.4rem;
}
.dv-fb-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--vp-c-brand-soft, rgba(100, 108, 255, 0.16));
  color: var(--vp-c-brand-1, #3451b2);
  font-size: 12px;
  font-weight: 700;
  flex: 0 0 auto;
}
.dv-fb-detected {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  flex-wrap: wrap;
  margin: 0.5rem 0;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--vp-c-brand-soft, rgba(100, 108, 255, 0.14));
}
.dv-fb-tag {
  font: 600 11px var(--vp-font-family-mono, monospace);
  color: var(--vp-c-brand-1, #3451b2);
  background: var(--vp-c-brand-soft, rgba(100, 108, 255, 0.14));
  border-radius: 5px;
  padding: 1px 6px;
}
.dv-fb-row-docs {
  border-radius: 6px;
  padding: 1px 4px;
  background: var(--vp-c-brand-soft, rgba(100, 108, 255, 0.08));
}
.dv-fb-path {
  margin: 0.2rem 0;
  opacity: 0.8;
}
.dv-fb-err {
  color: var(--vp-c-warning-1, #9a6700);
}
.dv-fb-note {
  opacity: 0.6;
  font-size: 13px;
}
.dv-fb-list {
  list-style: none;
  padding: 0;
  margin: 0.3rem 0;
  max-height: 360px;
  overflow-y: auto;
}
.dv-fb-list li {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 1px 0;
}
.dv-fb-btn {
  padding: 7px 16px;
  font-size: 14px;
  cursor: pointer;
  border-radius: 6px;
  border: 1px solid var(--vp-c-brand-1, #3451b2);
  background: transparent;
  color: var(--vp-c-brand-1, #3451b2);
  transition: background-color 0.15s, color 0.15s;
}
.dv-fb-btn:hover {
  background: var(--vp-c-brand-soft, rgba(100, 108, 255, 0.16));
}
.dv-fb-primary {
  background: var(--vp-c-brand-3, var(--vp-c-brand-1, #3451b2));
  color: var(--vp-c-white, #fff);
  border-color: transparent;
}
.dv-fb-primary:hover {
  background: var(--vp-c-brand-2, var(--vp-c-brand-1, #3451b2));
}
.dv-fb-link {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--vp-c-text-1);
  padding: 2px 0;
  font-size: 14px;
  text-align: left;
}
.dv-fb-link:hover {
  color: var(--vp-c-brand-1, #3451b2);
}
.dv-fb-open {
  font-size: 12px;
  cursor: pointer;
  border: 1px solid var(--vp-c-brand-1, #3451b2);
  border-radius: 5px;
  background: transparent;
  color: var(--vp-c-brand-1, #3451b2);
  padding: 1px 8px;
}
.dv-fb-nearby {
  margin: 0.1rem 0 0.7rem;
}
.dv-fb-nearby .dv-fb-list {
  max-height: 120px;
}
/* paste row: input grows, stays the SAME height as the Open button (align-items: stretch), with a gap. */
.dv-fb-paste {
  display: flex;
  gap: 10px;
  align-items: stretch;
  flex-wrap: wrap;
}
.dv-fb-input {
  flex: 1 1 320px;
  min-width: 0;
  padding: 7px 12px;
  font-size: 14px;
  border: 1px solid var(--vp-c-divider, #ccc);
  border-radius: 6px;
  background: var(--vp-c-bg, #fff);
  color: var(--vp-c-text-1);
  box-sizing: border-box;
}
.dv-fb-input:focus {
  outline: none;
  border-color: var(--vp-c-brand-1, #3451b2);
}
.dv-fb-paste .dv-fb-btn {
  white-space: nowrap;
  flex: 0 0 auto;
}
</style>
