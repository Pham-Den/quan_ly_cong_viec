<script setup>
import { computed, onMounted, nextTick, ref, watch } from 'vue'
import { marked } from 'marked'
import { parseDiff, diffStat } from './diff-parse.js'
import { richDiffHtml } from './rich-diff.js'

// Renders ONE unified-diff string in one of three modes:
//  - 'unified'  : GitHub-style +/- lines, line numbers + gutter, intra-line WORD highlighting
//  - 'split'    : side-by-side (old | new), same word highlighting
//  - 'rendered' : a word-level RICH diff — the whole formatted doc with changed words marked inline
//                 (added highlighted, removed struck-through). UNCHANGED mermaid blocks are rendered
//                 as real diagrams (like the viewer); changed ones keep their source so the change is
//                 visible. Needs the full before/after content; falls back to the hunk's "after".
const props = defineProps({
  diff: { type: String, default: '' },
  mode: { type: String, default: 'unified' }, // 'unified' | 'split' | 'rendered'
  // Full before/after markdown of the doc (from the engine's --with-content). null = not available.
  before: { type: String, default: null },
  after: { type: String, default: null },
})

const blocks = computed(() => parseDiff(props.diff))
const stat = computed(() => diffStat(props.diff))

// "After" content reconstructed from the hunk (context + added lines) — render just the changed
// region, not the whole document.
const afterText = computed(() => {
  const out = []
  for (const b of blocks.value) {
    if (b.kind === 'ctx') out.push(b.segs.map((s) => s.t).join(''))
    else if (b.kind === 'change') for (const a of b.adds) out.push(a.segs.map((s) => s.t).join(''))
  }
  return out.join('\n')
})
// Rendered = block-level rich diff when we have full before/after; otherwise just render the hunk's
// reconstructed "after" (older engine without --with-content).
const rendered = computed(() =>
  props.after !== null ? richDiffHtml(props.before ?? '', props.after) : marked.parse(afterText.value, { gfm: true })
)

// `marked` renders ```mermaid as a plain code block (it has no mermaid plugin like VitePress). After
// the rendered HTML is in the DOM, turn UNCHANGED mermaid code blocks into real diagrams (matching the
// viewer). A changed block (has ins/del inside) is left as source so its change stays visible.
const renderedRef = ref(null)
async function renderDiagrams() {
  if (props.mode !== 'rendered' || typeof document === 'undefined' || !renderedRef.value) return
  const codes = renderedRef.value.querySelectorAll('pre > code.language-mermaid')
  if (!codes.length) return
  let mermaid
  try {
    mermaid = (await import('mermaid')).default
    // suppressErrorRendering: don't dump "bomb" error SVGs into the page when a diagram fails to parse.
    mermaid.initialize({ startOnLoad: false, suppressErrorRendering: true, theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default' })
  } catch {
    return // mermaid unavailable → leave the code blocks as-is
  }
  for (const code of codes) {
    if (code.querySelector('ins, del')) continue // changed diagram → keep the source diff visible
    const src = code.textContent
    try {
      // Render directly. (Don't gate on mermaid.parse — it can return false for valid diagrams.)
      // A genuinely invalid diagram throws here → caught → left as code; suppressErrorRendering
      // (set above) keeps a failed render from injecting an error "bomb" into the page. The id is
      // globally unique — a per-instance counter would collide across the many DiffBlocks on a page.
      const id = `rd-mmd-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
      const { svg } = await mermaid.render(id, src)
      const fig = document.createElement('div')
      fig.className = 'rd-mermaid'
      fig.innerHTML = svg
      ;(code.closest('pre') || code).replaceWith(fig)
    } catch {
      /* invalid mermaid → leave the code block */
    }
  }
}
onMounted(() => nextTick(renderDiagrams))
watch(() => [props.mode, rendered.value], () => nextTick(renderDiagrams))

const uniRows = computed(() => {
  const rows = []
  for (const b of blocks.value) {
    if (b.kind === 'hunk') rows.push({ t: 'hunk', text: b.text })
    else if (b.kind === 'ctx') rows.push({ t: 'ctx', oldLn: b.oldLn, newLn: b.newLn, segs: b.segs })
    else {
      for (const d of b.dels) rows.push({ t: 'del', oldLn: d.ln, segs: d.segs })
      for (const a of b.adds) rows.push({ t: 'add', newLn: a.ln, segs: a.segs })
    }
  }
  return rows
})

const splitRows = computed(() => {
  const rows = []
  for (const b of blocks.value) {
    if (b.kind === 'hunk') {
      rows.push({ hunk: b.text })
    } else if (b.kind === 'ctx') {
      rows.push({ l: { ln: b.oldLn, segs: b.segs, t: 'ctx' }, r: { ln: b.newLn, segs: b.segs, t: 'ctx' } })
    } else {
      const n = Math.max(b.dels.length, b.adds.length)
      for (let i = 0; i < n; i++) {
        rows.push({
          l: b.dels[i] ? { ln: b.dels[i].ln, segs: b.dels[i].segs, t: 'del' } : null,
          r: b.adds[i] ? { ln: b.adds[i].ln, segs: b.adds[i].segs, t: 'add' } : null,
        })
      }
    }
  }
  return rows
})

const mark = (t) => (t === 'del' ? '-' : t === 'add' ? '+' : ' ')
const hasText = (segs) => segs.some((s) => s.t.length > 0)
</script>

<template>
  <div class="dvd" :class="{ 'dvd-flat': mode === 'rendered' }">
    <div v-if="mode !== 'rendered'" class="dvd-stat"><span class="dvd-plus">+{{ stat.added }}</span> <span class="dvd-minus">−{{ stat.removed }}</span></div>

    <!-- Rendered = rich diff (.vp-doc, same as the rest of the viewer). If the engine gave us no
         before/after, say so instead of silently showing an unmarked render. -->
    <div v-if="mode === 'rendered'" class="dvd-rendered-wrap">
      <p v-if="after === null" class="dvd-oldengine">
        ℹ Rich diff needs an updated PRISM engine (the <code>--with-content</code> flag). Showing a plain
        render — update this project's <code>.prism</code> to see +/− marks on the rendered doc.
      </p>
      <div ref="renderedRef" class="vp-doc dvd-rendered" v-html="rendered"></div>
    </div>

    <!-- Unified -->
    <table v-else-if="mode !== 'split'" class="dvd-tbl">
      <tbody>
        <tr v-for="(r, i) in uniRows" :key="i" :class="`r-${r.t}`">
          <template v-if="r.t === 'hunk'">
            <td class="ln" colspan="3"></td>
            <td class="code hunk">{{ r.text }}</td>
          </template>
          <template v-else>
            <td class="ln">{{ r.oldLn ?? '' }}</td>
            <td class="ln">{{ r.newLn ?? '' }}</td>
            <td class="mk">{{ mark(r.t) }}</td>
            <td class="code">
              <template v-if="hasText(r.segs)"><span v-for="(s, k) in r.segs" :key="k" :class="{ w: s.hl }">{{ s.t }}</span></template>
              <template v-else>&nbsp;</template>
            </td>
          </template>
        </tr>
      </tbody>
    </table>

    <!-- Side by side -->
    <table v-else class="dvd-tbl dvd-split">

      <tbody>
        <tr v-for="(row, i) in splitRows" :key="i">
          <td v-if="row.hunk" class="code hunk" colspan="4">{{ row.hunk }}</td>
          <template v-else>
            <td class="ln">{{ row.l ? row.l.ln : '' }}</td>
            <td class="code" :class="row.l ? `r-${row.l.t}` : 'r-empty'">
              <template v-if="row.l && hasText(row.l.segs)"><span v-for="(s, k) in row.l.segs" :key="k" :class="{ w: s.hl }">{{ s.t }}</span></template>
              <template v-else>&nbsp;</template>
            </td>
            <td class="ln">{{ row.r ? row.r.ln : '' }}</td>
            <td class="code" :class="row.r ? `r-${row.r.t}` : 'r-empty'">
              <template v-if="row.r && hasText(row.r.segs)"><span v-for="(s, k) in row.r.segs" :key="k" :class="{ w: s.hl }">{{ s.t }}</span></template>
              <template v-else>&nbsp;</template>
            </td>
          </template>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.dvd {
  position: relative;
  overflow-x: auto;
  border: 1px solid var(--vp-c-divider, #e2e2e3);
  border-radius: 8px;
  margin: 0.25rem 0 0.7rem;
  background: var(--vp-c-bg, #fff);
}
.dvd-stat {
  position: absolute;
  top: 4px;
  right: 8px;
  font: 600 11px var(--vp-font-family-mono, monospace);
  pointer-events: none;
  opacity: 0.8;
}
.dvd-plus {
  color: #1a7f37;
}
.dvd-minus {
  color: #cf222e;
}
.dvd-tbl {
  border-collapse: collapse;
  width: 100%;
  font-family: var(--vp-font-family-mono, monospace);
  font-size: 12.5px;
  line-height: 1.55;
  tab-size: 2;
}
.dvd-tbl td {
  padding: 0;
  vertical-align: top;
}
.ln {
  width: 1%;
  white-space: nowrap;
  text-align: right;
  padding: 0 8px;
  color: var(--vp-c-text-3, #98989f);
  background: var(--vp-c-bg-soft, #f6f6f7);
  user-select: none;
  border-right: 1px solid var(--vp-c-divider, #e2e2e3);
}
.mk {
  width: 1%;
  text-align: center;
  padding: 0 4px;
  user-select: none;
  color: var(--vp-c-text-3, #98989f);
}
.code {
  white-space: pre;
  padding: 0 10px;
  width: 100%;
}
/* Row tints — whole changed line gets a soft tint; the changed words get a stronger one. */
.r-del .code,
.code.r-del {
  background: rgba(248, 81, 73, 0.12);
}
.r-add .code,
.code.r-add {
  background: rgba(46, 160, 67, 0.12);
}
.r-del .mk {
  color: #cf222e;
}
.r-add .mk {
  color: #1a7f37;
}
.code.r-empty {
  background: var(--vp-c-bg-soft, #f6f6f7);
}
.r-del .w,
.code.r-del .w {
  background: rgba(248, 81, 73, 0.4);
  border-radius: 2px;
}
.r-add .w,
.code.r-add .w {
  background: rgba(46, 160, 67, 0.4);
  border-radius: 2px;
}
.code.hunk {
  color: var(--vp-c-brand-1, #3451b2);
  background: var(--vp-c-default-soft, rgba(142, 150, 170, 0.1));
  padding-top: 2px;
  padding-bottom: 2px;
}
.dvd-split .code {
  border-right: 1px solid var(--vp-c-divider, #e2e2e3);
}
/* Rendered mode = a faithful doc render: no code-box chrome, let global .vp-doc styles apply exactly
   like the rest of the viewer. Only trim the leading/trailing margins so it sits flush in the panel. */
.dvd-flat {
  border: none;
  overflow: visible;
  background: transparent;
}
.dvd-rendered :deep(> :first-child) {
  margin-top: 0;
}
.dvd-rendered :deep(> :last-child) {
  margin-bottom: 0;
}
.dvd-oldengine {
  font-size: 12.5px;
  color: var(--vp-c-warning-1, #9a6700);
  background: var(--vp-c-warning-soft, rgba(234, 179, 8, 0.14));
  border-radius: 6px;
  padding: 6px 10px;
  margin: 0 0 0.5rem;
}
/* Rich diff (Hướng B, word-level on the rendered HTML): the whole doc renders normally; only the
   changed WORDS are wrapped — added (green, underlined) vs removed (red, struck). Colours are picked
   to be clearly distinct AND distinguishable without relying on hue alone (underline vs strike), in
   both light and dark themes. */
.dvd-rendered :deep(ins.rd-ins) {
  background: rgba(46, 160, 67, 0.42);
  color: #0a5028;
  text-decoration: none;
  box-shadow: inset 0 -2px 0 rgba(35, 134, 54, 0.85);
  border-radius: 3px;
  padding: 0 2px;
}
.dvd-rendered :deep(del.rd-del) {
  background: rgba(207, 34, 46, 0.18);
  color: #8a1c24;
  text-decoration: line-through;
  text-decoration-color: rgba(207, 34, 46, 0.85);
  text-decoration-thickness: 2px;
  border-radius: 3px;
  padding: 0 2px;
}
/* Dark theme: brighter fills + light text so the marks pop against the dark background. */
.dark .dvd-rendered :deep(ins.rd-ins) {
  background: rgba(63, 185, 80, 0.3);
  color: #82e896;
  box-shadow: inset 0 -2px 0 rgba(126, 231, 135, 0.75);
}
.dark .dvd-rendered :deep(del.rd-del) {
  background: rgba(248, 81, 73, 0.28);
  color: #ffb3ad;
  text-decoration-color: rgba(255, 150, 140, 0.9);
}
/* Whole added / removed table ROWS, list ITEMS, and blocks get a full tint so they're unmistakable. */
/* A whole new/removed line is a SIGNIFICANT change — make it unmistakable with a bold left accent bar
   (the strong signal) + a soft full-width tint (so a big area isn't overwhelming). The lightness of the
   band is about area, not importance. box-shadow = no layout shift / no bullet displacement. */
.dvd-rendered :deep(tr.rd-row-ins > td),
.dvd-rendered :deep(li.rd-li-ins) {
  background: rgba(46, 160, 67, 0.2);
}
.dvd-rendered :deep(li.rd-li-ins) {
  box-shadow: inset 3px 0 0 #2ea043;
}
.dvd-rendered :deep(tr.rd-row-ins > td:first-child) {
  box-shadow: inset 3px 0 0 #2ea043;
}
.dvd-rendered :deep(tr.rd-row-del > td),
.dvd-rendered :deep(li.rd-li-del) {
  background: rgba(207, 34, 46, 0.16);
}
.dvd-rendered :deep(li.rd-li-del) {
  box-shadow: inset 3px 0 0 #cf222e;
  text-decoration: line-through;
  text-decoration-color: rgba(207, 34, 46, 0.5);
}
.dvd-rendered :deep(tr.rd-row-del > td:first-child) {
  box-shadow: inset 3px 0 0 #cf222e;
}
.dvd-rendered :deep(.rd-blk) {
  padding-left: 9px;
  border-left: 3px solid transparent;
  margin: 0.2rem 0;
}
.dvd-rendered :deep(.rd-blk-ins) {
  border-left-color: #2ea043;
  background: rgba(46, 160, 67, 0.13);
}
.dvd-rendered :deep(.rd-blk-del) {
  border-left-color: #cf222e;
  background: rgba(248, 81, 73, 0.11);
}
.dvd-rendered :deep(.rd-blk-del > *) {
  text-decoration: line-through;
  text-decoration-color: rgba(207, 34, 46, 0.45);
}
.dark .dvd-rendered :deep(tr.rd-row-ins > td),
.dark .dvd-rendered :deep(li.rd-li-ins) {
  background: rgba(63, 185, 80, 0.24);
}
.dark .dvd-rendered :deep(tr.rd-row-del > td),
.dark .dvd-rendered :deep(li.rd-li-del) {
  background: rgba(248, 81, 73, 0.22);
}
/* code blocks: keep VitePress's box styling but drop its full-bleed negative margins in the panel */
.dvd-rendered :deep(div[class*='language-']) {
  margin: 0.7rem 0;
}
/* rendered mermaid diagram (unchanged blocks) */
.dvd-rendered :deep(.rd-mermaid) {
  margin: 0.8rem 0;
  text-align: center;
}
.dvd-rendered :deep(.rd-mermaid svg) {
  max-width: 100%;
  height: auto;
}
</style>
