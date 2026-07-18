import { diffWordsWithSpace } from 'diff'

/**
 * Parse a unified-diff string into a render model with line numbers + intra-line WORD segments.
 * Shared by the DiffBlock component (browser) and the tests (node) — `diff` (jsdiff) runs in both.
 *
 * Returns an ordered list of blocks:
 *   { kind: 'hunk', text }
 *   { kind: 'ctx', oldLn, newLn, segs }                       // unchanged line (both sides)
 *   { kind: 'change', dels: [{ ln, segs }], adds: [{ ln, segs }] }
 * where `segs` is `[{ t, hl }]` — `hl` marks the word(s) that actually changed (for the highlight).
 * Paired removed/added lines get word-level segments; unpaired ones are highlighted whole.
 */
export function parseDiff(diffText) {
  const lines = String(diffText || '').split('\n')
  const blocks = []
  let oldLn = 0
  let newLn = 0
  let pendDel = []
  let pendAdd = []

  function flush() {
    if (!pendDel.length && !pendAdd.length) return
    const dels = []
    const adds = []
    const n = Math.max(pendDel.length, pendAdd.length)
    for (let i = 0; i < n; i++) {
      const d = pendDel[i]
      const a = pendAdd[i]
      if (d && a) {
        const { del, add } = wordSegs(d.text, a.text)
        dels.push({ ln: d.ln, segs: del })
        adds.push({ ln: a.ln, segs: add })
      } else if (d) {
        dels.push({ ln: d.ln, segs: [{ t: d.text, hl: true }] })
      } else {
        adds.push({ ln: a.ln, segs: [{ t: a.text, hl: true }] })
      }
    }
    blocks.push({ kind: 'change', dels, adds })
    pendDel = []
    pendAdd = []
  }

  for (const line of lines) {
    if (line === '') continue // trailing artifact of split('\n'); real blank context is ' '
    if (line.startsWith('+++') || line.startsWith('---')) continue // file headers
    if (line.startsWith('@@')) {
      flush()
      const m = /@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line)
      if (m) {
        oldLn = Number(m[1])
        newLn = Number(m[2])
      }
      blocks.push({ kind: 'hunk', text: line })
    } else if (line.startsWith('-')) {
      pendDel.push({ ln: oldLn++, text: line.slice(1) })
    } else if (line.startsWith('+')) {
      pendAdd.push({ ln: newLn++, text: line.slice(1) })
    } else {
      flush()
      const t = line.startsWith(' ') ? line.slice(1) : line
      blocks.push({ kind: 'ctx', oldLn: oldLn++, newLn: newLn++, segs: [{ t, hl: false }] })
    }
  }
  flush()
  return blocks
}

/** Word-level segments for a removed/added line pair: del keeps removed+common, add keeps added+common. */
function wordSegs(oldText, newText) {
  const parts = diffWordsWithSpace(oldText, newText)
  const del = []
  const add = []
  for (const p of parts) {
    if (!p.added) del.push({ t: p.value, hl: !!p.removed })
    if (!p.removed) add.push({ t: p.value, hl: !!p.added })
  }
  return { del, add }
}

/**
 * Consolidate per-source diff entries into ONE base→final pair per living doc (the "Net" view):
 * base = the FIRST source's `before` (the sealed Living Truth), final = the LAST source's `after`
 * (the current merged selection). Sources must be in apply order. Returns only docs that actually
 * changed (before !== after), in first-seen order. A doc edited across several sprints collapses to a
 * single bottom-line change here, instead of the N per-sprint fragments shown by Source/Document.
 */
export function netByDoc(sources) {
  const m = new Map()
  for (const s of sources || [])
    for (const d of s.diffs || []) {
      if (d.before == null || d.after == null) continue
      if (!m.has(d.living)) m.set(d.living, { living: d.living, before: d.before, after: d.after })
      else m.get(d.living).after = d.after
    }
  return [...m.values()].filter((x) => x.before !== x.after)
}

/** Cheap +added / -removed line counts for a unified diff (for badges). */
export function diffStat(diffText) {
  let added = 0
  let removed = 0
  for (const line of String(diffText || '').split('\n')) {
    if (line.startsWith('+++') || line.startsWith('---')) continue
    if (line.startsWith('+')) added++
    else if (line.startsWith('-')) removed++
  }
  return { added, removed }
}
