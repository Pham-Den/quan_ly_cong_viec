<script setup>
import { ref, computed, watch } from 'vue'
import { createPatch } from 'diff'
import DiffBlock from './DiffBlock.vue'
import { diffStat, netByDoc } from './diff-parse.js'

// Lazy diff viewer for the current Living Truth selection. Fetches /__prism-diff only when opened.
// One consistent master-detail layout (left list + right diffs); the LEFT axis follows the view:
//   • Net (default)   → browse by DOCUMENT; right = that doc's whole change vs the sealed Living Truth.
//   • Per sprint ('document') → browse by SPRINT; right = what that sprint changed per doc (vs the prev).
//   • By change ('source')    → browse by SPRINT; right = each proposal/change-pack (DRAFT/APPROVED) + diff.
// View control: Unified / Side-by-side / Rendered — passed to DiffBlock as `mode`.
const DIFF = '/__prism-diff'

const PHASE_ORDER = ['product', 'design', 'architecture', 'testing']
const phaseIdx = (doc) => {
  const i = PHASE_ORDER.indexOf(String(doc).split('/')[0])
  return i === -1 ? 99 : i
}
const byPhaseThenName = (a, b) => phaseIdx(a) - phaseIdx(b) || a.localeCompare(b, undefined, { numeric: true })
const docName = (living) => String(living).split('/').slice(1).join('/') || String(living) // path without the phase prefix

// A unified-diff string from before→after (for the Unified/Side-by-side views), header stripped.
function netPatch(name, before, after) {
  const ud = createPatch(name, String(before || ''), String(after || ''), '', '')
  const at = ud.indexOf('@@')
  return at >= 0 ? ud.slice(at) : ''
}

const opened = ref(false)
const loading = ref(false)
const data = ref(undefined) // undefined = not loaded; null = engine error; array = ok
const groupBy = ref('net') // 'net' | 'document' (Per sprint) | 'source' (By change)
const view = ref('rendered') // 'unified' | 'split' | 'rendered'
const selectedDoc = ref(null) // left selection in Net mode
const selectedSprint = ref(null) // left selection in Per-sprint / By-change mode (sprint_n)
const listOpen = ref(true) // left panel collapsible to reclaim width

async function open() {
  opened.value = true
  if (Array.isArray(data.value)) return
  loading.value = true
  try {
    const r = await fetch(DIFF)
    data.value = r.ok ? await r.json() : null
  } catch {
    data.value = null
  } finally {
    loading.value = false
  }
}

// Summed +added / -removed across a list of unified-diff strings (for the badges).
function statOf(diffStrings) {
  let a = 0
  let r = 0
  for (const t of diffStrings) {
    const s = diffStat(t)
    a += s.added
    r += s.removed
  }
  return { a, r }
}

const cap = (x) => (x ? x[0].toUpperCase() + x.slice(1) : x)
function sourceLabel(s) {
  if (s.pack) return `Change pack ${String(s.pack).replace(/^v\d+\.\d+\.\d+-/, '')} · ${cap(s.phase)}`
  const base = String(s.path || '').split('/').pop().replace(/\.md$/, '').replace(/-v\d+$/, '')
  return `${base.replace(/[-_]+/g, ' ')} · ${cap(s.phase)}`
}

const sources = computed(() => (Array.isArray(data.value) ? data.value : []))

// NET — one consolidated diff per doc (base = sealed Living Truth → final = current selection),
// grouped by phase for the left document browser.
const byNet = computed(() =>
  netByDoc(sources.value)
    .sort((a, b) => byPhaseThenName(a.living, b.living))
    .map((x) => ({ ...x, diff: netPatch(x.living, x.before, x.after) }))
)
const netByPhase = computed(() => {
  const groups = {}
  for (const x of byNet.value) (groups[String(x.living).split('/')[0]] = groups[String(x.living).split('/')[0]] || []).push(x)
  return Object.keys(groups)
    .sort((a, b) => phaseIdx(a) - phaseIdx(b))
    .map((phase) => ({ phase, docs: groups[phase] }))
})
const netDoc = computed(() => byNet.value.find((x) => x.living === selectedDoc.value) || null)

// SPRINT list — for the left browser of Per-sprint / By-change.
const sprintList = computed(() => {
  const m = {}
  for (const s of sources.value) {
    const k = String(s.sprint_n)
    if (!m[k]) m[k] = { n: s.sprint_n, sprint: s.sprint, draft: false, diffs: [] }
    if (s.status === 'DRAFT') m[k].draft = true
    for (const d of s.diffs || []) if (d.diff) m[k].diffs.push(d.diff)
  }
  return Object.values(m).sort((a, b) => Number(a.n) - Number(b.n))
})

// SPRINT FOLDERS — the left browser for Per-sprint / By-change is a FILE browser like Net, but the
// files are grouped into big sprint folders. Each folder = a sprint → the docs it changed, each doc
// carrying both its per-sprint merged delta (Per sprint) and its individual change-units (By change).
const sprintFolders = computed(() =>
  sprintList.value.map((sp) => {
    const srcs = sources.value.filter((s) => String(s.sprint_n) === String(sp.n))
    const docs = netByDoc(srcs)
      .sort((a, b) => byPhaseThenName(a.living, b.living))
      .map((m) => ({
        living: m.living,
        before: m.before,
        after: m.after,
        diff: netPatch(m.living, m.before, m.after),
        changes: srcs.flatMap((s) =>
          (s.diffs || [])
            .filter((d) => d.living === m.living)
            .map((d) => ({ ...d, status: s.status, label: sourceLabel(s), path: s.path }))
        ),
      }))
    return { ...sp, docs }
  })
)
const curFolder = computed(() => sprintFolders.value.find((f) => String(f.n) === String(selectedSprint.value)) || null)
const curSprintDoc = computed(() => curFolder.value?.docs.find((d) => d.living === selectedDoc.value) || null)

const leftTitle = computed(() => (groupBy.value === 'net' ? `Documents (${byNet.value.length})` : `Sprints (${sprintFolders.value.length})`))

function setGroup(g) {
  groupBy.value = g
}

// Keep a valid left selection when data loads or the grouping switches.
watch(
  [data, groupBy],
  () => {
    if (groupBy.value === 'net') {
      if (!byNet.value.some((x) => x.living === selectedDoc.value)) selectedDoc.value = byNet.value[0]?.living ?? null
    } else {
      const folders = sprintFolders.value
      const f = folders.find((x) => String(x.n) === String(selectedSprint.value)) || folders[0]
      selectedSprint.value = f?.n ?? null
      if (!f || !f.docs.some((d) => d.living === selectedDoc.value)) selectedDoc.value = f?.docs[0]?.living ?? null
    }
  },
  { immediate: true }
)

const groupHint = computed(() =>
  groupBy.value === 'net'
    ? 'Net: pick a document — its whole change vs the sealed Living Truth (drafts included if applied).'
    : groupBy.value === 'document'
      ? 'Per sprint: pick a sprint — what it changed, per document, vs the sprint before it (the first vs the Living Truth).'
      : 'By change: pick a sprint — each individual proposal / change-pack (DRAFT or APPROVED) and what it edits.'
)
const viewHint = computed(() =>
  view.value === 'unified' ? 'raw +/- lines' : view.value === 'split' ? 'old | new side by side' : 'formatted, marked in place'
)
</script>

<template>
  <div class="dvb">
    <button v-if="!opened" type="button" class="dvb-btn dvb-primary" @click="open">Show diffs</button>

    <template v-else>
      <p v-if="loading">Loading diffs…</p>
      <p v-else-if="data === null" class="dvb-err">
        ⚠ Diff unavailable — the PRISM engine call failed. Make sure this project's
        <code>.prism/core/tools/effective_truth.py</code> is up to date (it must support <code>--per-source-diff</code>).
      </p>
      <p v-else-if="!sources.length" class="dvb-note">No source changes in the current selection.</p>

      <template v-else>
        <div class="dvb-controls">
          <span>Group by:</span>
          <button type="button" class="dvb-tab" :class="{ on: groupBy === 'net' }" @click="setGroup('net')">Net</button>
          <button type="button" class="dvb-tab" :class="{ on: groupBy === 'document' }" @click="setGroup('document')">Per sprint</button>
          <button type="button" class="dvb-tab" :class="{ on: groupBy === 'source' }" @click="setGroup('source')">By change</button>
          <span class="dvb-view-lbl">View:</span>
          <button type="button" class="dvb-tab" :class="{ on: view === 'unified' }" @click="view = 'unified'">Unified</button>
          <button type="button" class="dvb-tab" :class="{ on: view === 'split' }" @click="view = 'split'">Side by side</button>
          <button type="button" class="dvb-tab" :class="{ on: view === 'rendered' }" @click="view = 'rendered'">Rendered</button>
        </div>

        <!-- One-line explainer so it's clear what the current grouping/view shows -->
        <p class="dvb-hint">
          <span>{{ groupHint }}</span>
          <span class="dvb-hint-dim"> · View = how each diff is shown ({{ viewHint }}).</span>
        </p>

        <div class="dvb-md">
          <!-- LEFT browser: documents (Net) or sprints (Per sprint / By change) -->
          <div v-show="listOpen" class="dvb-list">
            <div class="dvb-list-head">
              <span>{{ leftTitle }}</span>
              <button type="button" class="dvb-collapse" title="Hide list" @click="listOpen = false">‹ hide</button>
            </div>

            <!-- by document -->
            <template v-if="groupBy === 'net'">
              <template v-for="g in netByPhase" :key="g.phase">
                <div class="dvb-phase">{{ cap(g.phase) }}</div>
                <button
                  v-for="x in g.docs"
                  :key="x.living"
                  type="button"
                  class="dvb-doc-btn"
                  :class="{ on: x.living === selectedDoc }"
                  @click="selectedDoc = x.living"
                >
                  📄 {{ docName(x.living) }}
                  <span class="dvb-stat"><span class="p">+{{ statOf([x.diff]).a }}</span> <span class="m">−{{ statOf([x.diff]).r }}</span></span>
                </button>
              </template>
            </template>

            <!-- by sprint: big sprint folders → the files changed in each -->
            <template v-else>
              <template v-for="f in sprintFolders" :key="f.n">
                <div class="dvb-folder">
                  📂 Sprint {{ f.sprint }}
                  <span v-if="f.draft" class="dvb-draft dvb-draft-dot">draft</span>
                </div>
                <button
                  v-for="d in f.docs"
                  :key="d.living"
                  type="button"
                  class="dvb-doc-btn"
                  :class="{ on: String(f.n) === String(selectedSprint) && d.living === selectedDoc }"
                  @click="((selectedSprint = f.n), (selectedDoc = d.living))"
                >
                  📄 {{ docName(d.living) }}
                  <span class="dvb-stat"><span class="p">+{{ statOf([d.diff]).a }}</span> <span class="m">−{{ statOf([d.diff]).r }}</span></span>
                </button>
              </template>
            </template>
          </div>
          <button v-show="!listOpen" type="button" class="dvb-expand" title="Show list" @click="listOpen = true">›</button>

          <!-- RIGHT: diffs for the selection -->
          <div class="dvb-detail">
            <!-- Net: the selected doc's consolidated diff -->
            <template v-if="groupBy === 'net'">
              <div v-if="netDoc" class="dvb-src">
                <div class="dvb-src-h">
                  📄 <code>{{ netDoc.living }}</code>
                  <span class="dvb-stat"><span class="p">+{{ statOf([netDoc.diff]).a }}</span> <span class="m">−{{ statOf([netDoc.diff]).r }}</span></span>
                </div>
                <DiffBlock :diff="netDoc.diff" :before="netDoc.before" :after="netDoc.after" :mode="view" />
              </div>
              <p v-else class="dvb-note">No net change vs the sealed Living Truth.</p>
            </template>

            <!-- Per sprint: the selected file's delta in the selected sprint (vs the previous sprint) -->
            <template v-else-if="groupBy === 'document'">
              <div v-if="curSprintDoc" class="dvb-src">
                <div class="dvb-src-h">
                  📄 <code>{{ curSprintDoc.living }}</code>
                  <span class="dvb-sprint-tag">Sprint {{ curFolder.sprint }}</span>
                  <span class="dvb-stat"><span class="p">+{{ statOf([curSprintDoc.diff]).a }}</span> <span class="m">−{{ statOf([curSprintDoc.diff]).r }}</span></span>
                </div>
                <DiffBlock :diff="curSprintDoc.diff" :before="curSprintDoc.before" :after="curSprintDoc.after" :mode="view" />
              </div>
              <p v-else class="dvb-note">Pick a file on the left.</p>
            </template>

            <!-- By change: the selected file's individual change-units in the selected sprint -->
            <template v-else>
              <template v-if="curSprintDoc">
                <div class="dvb-src-h dvb-detail-head">
                  📄 <code>{{ curSprintDoc.living }}</code>
                  <span class="dvb-sprint-tag">Sprint {{ curFolder.sprint }}</span>
                </div>
                <div v-for="(c, i) in curSprintDoc.changes" :key="i" class="dvb-src">
                  <div class="dvb-src-h">
                    {{ c.label }}
                    <code :class="c.status === 'DRAFT' ? 'dvb-draft' : ''">[{{ c.status }}]</code>
                    <span class="dvb-stat"><span class="p">+{{ statOf([c.diff]).a }}</span> <span class="m">−{{ statOf([c.diff]).r }}</span></span>
                    <small class="dvb-path">{{ c.path }}</small>
                  </div>
                  <DiffBlock :diff="c.diff" :before="c.before" :after="c.after" :mode="view" />
                </div>
                <p v-if="!curSprintDoc.changes.length" class="dvb-note">No change-units for this file in this sprint.</p>
              </template>
              <p v-else class="dvb-note">Pick a file on the left.</p>
            </template>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.dvb {
  margin: 1rem 0;
}
.dvb-btn {
  padding: 6px 14px;
  font-size: 14px;
  cursor: pointer;
  border-radius: 6px;
  border: 1px solid var(--vp-c-brand-1, #3451b2);
  background: transparent;
  color: var(--vp-c-brand-1, #3451b2);
}
.dvb-primary {
  background: var(--vp-c-brand-3, var(--vp-c-brand-1, #3451b2));
  color: var(--vp-c-white, #fff);
  border-color: transparent;
}
.dvb-controls {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  row-gap: 0.5rem;
  margin: 0.3rem 0 0.8rem;
  flex-wrap: wrap;
}
.dvb-tab {
  padding: 4px 13px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid var(--vp-c-divider, #ccc);
  border-radius: 6px;
  background: transparent;
  color: var(--vp-c-text-2);
  transition: background-color 0.15s, color 0.15s, border-color 0.15s;
}
.dvb-tab:hover {
  border-color: var(--vp-c-brand-1, #3451b2);
  color: var(--vp-c-brand-1, #3451b2);
}
/* Active = soft brand tint (gentle in both light + dark), not a harsh solid fill. */
.dvb-tab.on {
  border-color: transparent;
  background: var(--vp-c-brand-soft, rgba(100, 108, 255, 0.16));
  color: var(--vp-c-brand-1, #3451b2);
  font-weight: 600;
}
.dvb-view-lbl {
  margin-left: auto;
  font-size: 13px;
  opacity: 0.8;
}
.dvb-hint {
  margin: 0 0 1rem;
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
}
.dvb-hint-dim {
  color: var(--vp-c-text-3);
}
/* phase header inside the left document browser (Net) */
.dvb-phase {
  margin: 0.7rem 0 0.2rem;
  padding: 0 4px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--vp-c-text-3, #98989f);
}
.dvb-phase:first-child {
  margin-top: 0.2rem;
}
/* big sprint folder header inside the left browser (Per sprint / By change) */
.dvb-folder {
  margin: 0.9rem 0 0.3rem;
  padding: 4px 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--vp-c-brand-1, #3451b2);
  border-bottom: 1px solid var(--vp-c-divider, #e2e2e3);
}
.dvb-folder:first-child {
  margin-top: 0.2rem;
}
/* the file title shown above its change-units in By change */
.dvb-detail-head {
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--vp-c-divider, #e2e2e3);
  margin-bottom: 1rem;
}
.dvb-draft-dot {
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-left: 2px;
}
.dvb-src {
  margin: 0 0 1.4rem;
}
/* a visible divider + breathing room between consecutive changes */
.dvb-src + .dvb-src {
  border-top: 2px solid var(--vp-c-divider, #e2e2e3);
  padding-top: 1.3rem;
}
.dvb-src-h {
  margin: 0.2rem 0 0.6rem;
  font-weight: 600;
  font-size: 14.5px;
}
/* sprint pill (used in the by-document view where each change is one sprint's delta) */
.dvb-sprint-tag {
  display: inline-block;
  font-weight: 700;
  font-size: 13px;
  color: var(--vp-c-brand-1, #3451b2);
  background: var(--vp-c-brand-soft, rgba(100, 108, 255, 0.16));
  border-radius: 6px;
  padding: 2px 9px;
  margin-right: 6px;
}
.dvb-draft {
  color: var(--vp-c-warning-1, #9a6700);
}
.dvb-path {
  opacity: 0.55;
}
.dvb-doc {
  opacity: 0.7;
  font-size: 12px;
  margin: 0.2rem 0 0;
}
.dvb-note {
  opacity: 0.65;
  font-size: 12.5px;
}
.dvb-err {
  color: var(--vp-c-warning-1, #9a6700);
}
.dvb-md {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.dvb-list {
  flex: 0 0 260px;
  max-width: 42%;
  display: flex;
  flex-direction: column;
  gap: 3px;
  max-height: 70vh;
  overflow-y: auto;
  border-right: 1px solid var(--vp-c-divider, #ddd);
  padding-right: 10px;
}
.dvb-list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  opacity: 0.75;
  padding: 0 4px 5px;
  border-bottom: 1px solid var(--vp-c-divider, #e2e2e3);
}
.dvb-collapse,
.dvb-expand {
  cursor: pointer;
  border: 1px solid var(--vp-c-divider, #ccc);
  border-radius: 6px;
  background: transparent;
  color: var(--vp-c-text-2);
  font-size: 12px;
  padding: 2px 8px;
}
.dvb-collapse:hover,
.dvb-expand:hover {
  color: var(--vp-c-brand-1, #3451b2);
  border-color: var(--vp-c-brand-1, #3451b2);
}
.dvb-expand {
  align-self: flex-start;
  margin-right: 10px;
  flex: 0 0 auto;
}
.dvb-doc-btn {
  text-align: left;
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  padding: 4px 6px;
  font-size: 13px;
  color: var(--vp-c-text-1);
  word-break: break-all;
}
.dvb-doc-btn:hover {
  background: var(--vp-c-bg-soft, #f6f6f7);
}
.dvb-doc-btn.on {
  background: var(--vp-c-brand-soft, rgba(52, 81, 178, 0.14));
  color: var(--vp-c-brand-1, #3451b2);
}
.dvb-stat {
  font: 600 11px var(--vp-font-family-mono, monospace);
  margin-left: 4px;
  white-space: nowrap;
}
.dvb-stat .p {
  color: #1a7f37;
}
.dvb-stat .m {
  color: #cf222e;
}
.dvb-detail {
  flex: 1 1 auto;
  min-width: 0;
}
</style>
