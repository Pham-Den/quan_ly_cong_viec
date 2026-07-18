import { marked } from 'marked'
import { diffArrays } from 'diff'

/**
 * Block-aware word-level "rich diff" for the Rendered view. Renders the WHOLE formatted document with
 * changes marked in place: structure (tables, lists, headings, paragraphs) is rendered explicitly so
 * the HTML is always valid, and only the CONTENT inside blocks is word-diffed. A densely-rewritten
 * stretch collapses to one old-run + one new-run instead of word-by-word confetti.
 *
 *   richDiffHtml(beforeMarkdown, afterMarkdown) -> HTML string
 *
 * Diffing the whole rendered HTML token stream (a tempting "word-level on the DOM") is unsafe: an LCS
 * cross-matches identical structural tags (<table>, <tr>, …) and orphans their closers → malformed
 * HTML. Diffing per block avoids that. Pure string ops (no DOM) so it runs in browser + node (tests).
 */
const MD = { gfm: true }
const escCell = (s) => String(s).replace(/\|/g, '\\|')

// Tunables for prose: changes ≤ BRIDGE_WORDS apart are one cluster; a cluster with ≥ COLLAPSE_WORDS
// changed words (both adds AND removals) shows as a clean old-run + new-run, not word-by-word confetti.
const BRIDGE_WORDS = 3
const COLLAPSE_WORDS = 10

// ── markdown normalisation (match the viewer) ────────────────────────────────────
// YAML frontmatter (top + mid) → a table, so it renders readably and diffs cleanly.
function frontmatterToTables(md) {
  const lines = String(md || '').split('\n')
  const out = []
  let i = 0
  while (i < lines.length) {
    if (lines[i].trim() === '---') {
      let j = i + 1
      const inner = []
      while (j < lines.length && lines[j].trim() !== '---') {
        inner.push(lines[j])
        j++
      }
      const nonblank = inner.filter((l) => l.trim())
      const isYaml = nonblank.length > 0 && nonblank.every((l) => /^[A-Za-z][\w.-]*:(\s.*)?$/.test(l.trim()))
      if (j < lines.length && isYaml) {
        out.push('| Field | Value |', '| --- | --- |')
        for (const l of nonblank) {
          const c = l.indexOf(':')
          out.push(`| ${escCell(l.slice(0, c).trim())} | ${escCell(l.slice(c + 1).trim())} |`)
        }
        out.push('')
        i = j + 1
        continue
      }
    }
    out.push(lines[i])
    i++
  }
  return out.join('\n')
}

// Wrap bare code blocks in VitePress's div[class*=language-] so its code styling applies. Skip mermaid.
function styleCodeBlocks(html) {
  return html.replace(/<pre><code(?: class="(language-[\w-]+)")?>([\s\S]*?)<\/code><\/pre>/g, (m, cls) => {
    const lang = cls || 'language-text'
    return lang === 'language-mermaid' ? m : `<div class="${lang}">${m}</div>`
  })
}

const lex = (md) => marked.lexer(frontmatterToTables(md), MD).filter((t) => t.type !== 'space' && t.raw && t.raw.trim())
const render = (raw) => marked.parse(String(raw || ''), MD)
const inlineRender = (text) => marked.parseInline(String(text || ''), MD)

// Inject <ins>/<del> around changed text without crossing a newline (keeps any block structure intact).
function mark(tag, cls, value) {
  return String(value)
    .split('\n')
    .map((seg, i, a) => (seg ? `<${tag} class="${cls}">${seg}</${tag}>` : '') + (i < a.length - 1 ? '\n' : ''))
    .join('')
}

// Word-diff the raw markdown into a marked-up string (<ins>/<del>) with dense-cluster collapse.
// Tokenized so INLINE-CODE spans (`…`) stay atomic — marks go AROUND them, never inside (injecting
// into a code span makes marked escape the tags → literal "<ins>" text). Shared by prose + table cells.
const mdWordTokens = (s) => String(s).match(/`[^`]*`|[\p{L}\p{N}_]+|\s+|[^\s]/gu) || []
const tokWords = (toks) => toks.reduce((n, t) => n + (!/^\s+$/.test(t) && /[\p{L}\p{N}]/u.test(t) ? 1 : 0), 0)

function diffMarks(beforeRaw, afterRaw) {
  const parts = diffArrays(mdWordTokens(beforeRaw), mdWordTokens(afterRaw))
  let md = ''
  let cluster = []
  const flush = () => {
    if (!cluster.length) return
    const addW = cluster.reduce((n, p) => n + (p.added ? tokWords(p.value) : 0), 0)
    const delW = cluster.reduce((n, p) => n + (p.removed ? tokWords(p.value) : 0), 0)
    if (addW > 0 && delW > 0 && addW + delW >= COLLAPSE_WORDS) {
      const oldText = cluster.filter((p) => !p.added).flatMap((p) => p.value).join('')
      const newText = cluster.filter((p) => !p.removed).flatMap((p) => p.value).join('')
      md += mark('del', 'rd-del', oldText) + mark('ins', 'rd-ins', newText)
    } else {
      for (const p of cluster) {
        const t = p.value.join('')
        md += p.added ? mark('ins', 'rd-ins', t) : p.removed ? mark('del', 'rd-del', t) : t
      }
    }
    cluster = []
  }
  for (const part of parts) {
    if (part.added || part.removed) cluster.push(part)
    else {
      const txt = part.value.join('')
      if (cluster.length && !txt.includes('\n') && tokWords(part.value) <= BRIDGE_WORDS) cluster.push(part)
      else {
        flush()
        md += txt
      }
    }
  }
  flush()
  return md
}

const proseDiff = (beforeRaw, afterRaw) => render(diffMarks(beforeRaw, afterRaw))
const inlineDiff = (beforeText, afterText) =>
  String(beforeText) === String(afterText) ? inlineRender(afterText) : inlineRender(diffMarks(beforeText, afterText))

// ── tables: diff rows, word-diff changed cells (before/after may be null = wholly added/removed) ──
function tableDiff(before, after) {
  const t = after || before
  const align = t.align
  const head = t.header.map((c, i) => `<th${align[i] ? ` style="text-align:${align[i]}"` : ''}>${inlineRender(c.text)}</th>`).join('')
  const row = (cells, cls) => `<tr${cls ? ` class="${cls}"` : ''}>${cells.map((c, i) => `<td${align[i] ? ` style="text-align:${align[i]}"` : ''}>${inlineRender(c.text)}</td>`).join('')}</tr>`
  const rowDiff = (bRow, aRow) => `<tr>${aRow.map((c, i) => `<td${align[i] ? ` style="text-align:${align[i]}"` : ''}>${inlineDiff(bRow[i]?.text ?? '', c.text)}</td>`).join('')}</tr>`
  let body = ''
  if (!before) for (const r of after.rows) body += row(r, 'rd-row-ins')
  else if (!after) for (const r of before.rows) body += row(r, 'rd-row-del')
  else {
    const key = (r) => r.map((c) => c.text).join('')
    const parts = diffArrays(before.rows.map(key), after.rows.map(key))
    let bi = 0
    let ai = 0
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (!part.added && !part.removed) {
        for (let k = 0; k < part.count; k++) body += row(after.rows[ai + k], '')
        bi += part.count
        ai += part.count
      } else if (part.removed) {
        const dels = before.rows.slice(bi, bi + part.count)
        bi += part.count
        const next = parts[i + 1]
        if (next && next.added) {
          const adds = after.rows.slice(ai, ai + next.count)
          ai += next.count
          i++
          const n = Math.min(dels.length, adds.length)
          for (let k = 0; k < n; k++) body += rowDiff(dels[k], adds[k])
          for (let k = n; k < dels.length; k++) body += row(dels[k], 'rd-row-del')
          for (let k = n; k < adds.length; k++) body += row(adds[k], 'rd-row-ins')
        } else for (const r of dels) body += row(r, 'rd-row-del')
      } else {
        const adds = after.rows.slice(ai, ai + part.count)
        ai += part.count
        for (const r of adds) body += row(r, 'rd-row-ins')
      }
    }
  }
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`
}

// ── lists: diff items, word-diff changed items ───────────────────────────────────
function listDiff(before, after) {
  const tag = (after || before).ordered ? 'ol' : 'ul'
  const li = (text, cls) => `<li${cls ? ` class="${cls}"` : ''}>${inlineRender(text)}</li>`
  let html = ''
  if (!before) for (const it of after.items) html += li(it.text, 'rd-li-ins')
  else if (!after) for (const it of before.items) html += li(it.text, 'rd-li-del')
  else {
    const parts = diffArrays(before.items.map((it) => it.text), after.items.map((it) => it.text))
    let bi = 0
    let ai = 0
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (!part.added && !part.removed) {
        for (let k = 0; k < part.count; k++) html += li(after.items[ai + k].text, '')
        bi += part.count
        ai += part.count
      } else if (part.removed) {
        const dels = before.items.slice(bi, bi + part.count)
        bi += part.count
        const next = parts[i + 1]
        if (next && next.added) {
          const adds = after.items.slice(ai, ai + next.count)
          ai += next.count
          i++
          const n = Math.min(dels.length, adds.length)
          for (let k = 0; k < n; k++) html += `<li>${inlineDiff(dels[k].text, adds[k].text)}</li>`
          for (let k = n; k < dels.length; k++) html += li(dels[k].text, 'rd-li-del')
          for (let k = n; k < adds.length; k++) html += li(adds[k].text, 'rd-li-ins')
        } else for (const it of dels) html += li(it.text, 'rd-li-del')
      } else {
        const adds = after.items.slice(ai, ai + part.count)
        ai += part.count
        for (const it of adds) html += li(it.text, 'rd-li-ins')
      }
    }
  }
  return `<${tag}>${html}</${tag}>`
}

// Prose blocks can take inline <ins>/<del> word marks. Code/html can't (marked escapes the marks),
// and a wholly added/removed block's leading markdown (e.g. "# ") breaks if a tag precedes it — so
// those render whole and get a block-level tint instead.
const PROSE = new Set(['paragraph', 'heading', 'blockquote', 'text'])
const blockTint = (raw, cls) => `<div class="rd-blk ${cls}">${render(raw)}</div>`
const addedBlock = (b) => (b.type === 'table' ? tableDiff(null, b) : b.type === 'list' ? listDiff(null, b) : blockTint(b.raw, 'rd-blk-ins'))
const removedBlock = (b) => (b.type === 'table' ? tableDiff(b, null) : b.type === 'list' ? listDiff(b, null) : blockTint(b.raw, 'rd-blk-del'))

function modBlock(b, a) {
  if (a.type === 'table' && b.type === 'table') return tableDiff(b, a)
  if (a.type === 'list' && b.type === 'list') return listDiff(b, a)
  if (a.type === b.type && PROSE.has(a.type)) return proseDiff(b.raw, a.raw) // word-level (common prefix keeps syntax)
  if (a.type === b.type) return render(a.raw) // code/html/etc — show the new version cleanly
  return removedBlock(b) + addedBlock(a)
}

export function richDiffHtml(before, after) {
  const A = lex(before)
  const B = lex(after)
  const parts = diffArrays(
    A.map((t) => t.raw.trim()),
    B.map((t) => t.raw.trim())
  )
  let ai = 0
  let bi = 0
  let out = ''
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    if (!part.added && !part.removed) {
      for (let k = 0; k < part.count; k++) out += render(B[bi + k].raw)
      ai += part.count
      bi += part.count
    } else if (part.removed) {
      const dels = A.slice(ai, ai + part.count)
      ai += part.count
      const next = parts[i + 1]
      if (next && next.added) {
        const adds = B.slice(bi, bi + next.count)
        bi += next.count
        i++
        const n = Math.min(dels.length, adds.length)
        for (let k = 0; k < n; k++) out += modBlock(dels[k], adds[k])
        for (let k = n; k < dels.length; k++) out += removedBlock(dels[k])
        for (let k = n; k < adds.length; k++) out += addedBlock(adds[k])
      } else for (const blk of dels) out += removedBlock(blk)
    } else {
      const adds = B.slice(bi, bi + part.count)
      bi += part.count
      for (const blk of adds) out += addedBlock(blk)
    }
  }
  return styleCodeBlocks(out)
}
