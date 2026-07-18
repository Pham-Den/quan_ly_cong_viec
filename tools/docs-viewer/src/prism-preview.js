import { execFileSync } from 'node:child_process'
import { existsSync, lstatSync, mkdirSync, readdirSync, rmSync, statSync, watch, writeFileSync } from 'node:fs'
import path from 'node:path'
import { makeZip } from './zip.js'

/**
 * Optional PRISM integration — turns the plain ./docs browser into a structured,
 * compose-aware view when the current project is a PRISM project (`prism-config.md` +
 * the installed `.prism/core/tools/effective_truth.py`). Inert otherwise.
 *
 * It does NOT add a second tree next to ./docs. It TRANSFORMS the scanned ./docs tree into
 * ONE organised tree:
 *
 *   Living Truth          ← composed per-document (engine `--format json`), grouped by phase,
 *                           with a sprint picker: pick sprints (prefix), [A] merge approved,
 *                           [B] + merge drafts. The .md the engine recognises show the COMPOSED
 *                           effective truth; assets/extra files in those folders stay raw.
 *   Draft sprints         ← each unsealed sprint: its raw source files + a "Merged (incl. draft)"
 *                           subfolder (effective truth up to that sprint + that sprint's drafts).
 *   <other files>         ← anything the engine doesn't own keeps its real folder position (raw).
 *   Sealed / closed       ← sealed sprints, browse-only, pushed to the bottom.
 *
 * Invariants:
 *  - The merge is NEVER reimplemented here — it is the SAME composer the seal uses
 *    (`effective_truth.py`), invoked on demand. One source of truth, no second copy to drift.
 *  - Generated pages live ONLY in the gitignored shadow runtime (`.docs-view/content/`). We never
 *    write THROUGH a mirror symlink back into ./docs: every write unlinks a symlink first
 *    (`safeWrite`), so the user's sources are never touched.
 */

const PHASE_ORDER = ['product', 'design', 'architecture', 'testing']
const SPRINT_DIR_RE = /^sprint-v(\d+)$/

const LIVING_TRUTH_TITLE = 'Living Truth'
const DRAFT_SPRINTS_TITLE = 'Draft sprints'
const SEALED_SPRINTS_TITLE = 'Sealed / closed sprints'

// Generated page names. Non-underscore on purpose: scan.js ignores `_*` and the VitePress config
// sets srcExclude `**/_*`, so an underscore-prefixed name would be dropped from the build.
const PICKER_PAGE = 'prism-living-truth' // contentDir/prism-living-truth.md → URL /prism-living-truth
const MERGED_DIR = 'prism-merged' // per-sprint composed subfolder under contentDir/sprint-vN/

// Dev-server routes (shared by the picker markup + the server).
export const REFRESH_ENDPOINT = '/__prism-refresh' // recompose Living Truth with the current state
export const COMPOSE_ENDPOINT = '/__prism-compose' // set {upTo, stage} + recompose Living Truth
export const EXPORT_ENDPOINT = '/__prism-export' // download the current Living Truth as one .md/doc, zipped
export const DIFF_ENDPOINT = '/__prism-diff' // per-source diff JSON for the current state (the DiffBrowser)

/** Return `{ tool, config }` if `cwd` is an installed PRISM project, else null. */
export function detectPrism(cwd) {
  const tool = path.join(cwd, '.prism', 'core', 'tools', 'effective_truth.py')
  const config = path.join(cwd, 'prism-config.md')
  if (existsSync(tool) && existsSync(config)) return { tool, config }
  return null
}

function hasMarkdown(dir) {
  const stack = [dir]
  while (stack.length) {
    const cur = stack.pop()
    let entries
    try {
      entries = readdirSync(cur, { withFileTypes: true })
    } catch {
      continue
    }
    for (const e of entries) {
      if (e.name.startsWith('.') || e.name.startsWith('_')) continue
      if (e.isDirectory()) stack.push(path.join(cur, e.name))
      else if (/\.(md|markdown)$/i.test(e.name)) return true
    }
  }
  return false
}

/**
 * True if `docsDir` has the 2-layer phase structure — at least one canonical phase folder
 * (product/design/architecture/testing) that contains a markdown file — ignoring any other
 * folders (sprints, assets…). This still gates the no-engine raw Living Truth layout. With a PRISM
 * engine present, sprint inventory can also activate the composed view, which is how pre-seal v1
 * works before root Living Truth files exist.
 */
export function detect2Layer(docsDir) {
  for (const phase of PHASE_ORDER) {
    const dir = path.join(docsDir, phase)
    try {
      if (statSync(dir).isDirectory() && hasMarkdown(dir)) return true
    } catch {
      /* phase folder absent */
    }
  }
  return false
}

function pickPython() {
  for (const cmd of ['python3', 'python']) {
    try {
      execFileSync(cmd, ['--version'], { stdio: 'ignore' })
      return cmd
    } catch {
      /* try next */
    }
  }
  return null
}

const EXEC_OPTS = {
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
  timeout: 60_000,
  // Capture stdout; silence stdin + the child's stderr. effective_truth emits benign
  // "living truth not found" warnings that would otherwise spam the viewer console on every
  // refresh. A real failure surfaces as a skipped page / empty compose.
  stdio: ['ignore', 'pipe', 'ignore'],
}

// ── small helpers ────────────────────────────────────────────────────────────

const sprintNum = (v) => Number(String(v).replace(/^v/, ''))

function humanize(name) {
  return name
    .replace(/\.md$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

const alphanum = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })

function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// Escape inline JS for an HTML attribute (onclick=). Browsers decode entities BEFORE the JS runs,
// so `&lt;=` reaches JS as `<=` — this lets us keep comparison/logic operators in inline handlers
// without a <script> block (which VitePress/Vue may hoist or mangle). Our JS uses no `"`.
function attrJs(js) {
  return js.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Write `content` to `abs` inside the runtime. CRITICAL: mirror() symlinks ./docs files into the
 * runtime; writing through such a symlink would corrupt the user's source. So we unlink anything
 * present (symlink or file) first, then write a fresh real file. rmSync on a symlink removes the
 * LINK, never the target — ./docs is never touched.
 */
function safeWrite(abs, content) {
  mkdirSync(path.dirname(abs), { recursive: true })
  try {
    if (lstatSync(abs)) rmSync(abs, { force: true })
  } catch {
    /* nothing there */
  }
  writeFileSync(abs, content, 'utf8')
}

function livingTruthPlaceholder(rel) {
  return (
    `# ${humanize(path.basename(rel))}\n\n` +
    '_This Living Truth document has no composed content in the current selection yet. ' +
    'Use the Living Truth picker and Apply to fold in an open sprint._\n'
  )
}

// ── engine (the ONLY place python is invoked) ────────────────────────────────

function runJson(py, tool, cwd, args) {
  try {
    const raw = execFileSync(py, [tool, ...args, '--project-root', cwd], EXEC_OPTS)
    return raw && raw.trim() ? JSON.parse(raw) : null
  } catch (err) {
    // best-effort: a draft caught mid-save / a transient failure returns null, callers degrade.
    const out = err && err.stdout ? String(err.stdout) : ''
    try {
      return out.trim() ? JSON.parse(out) : null
    } catch {
      return null
    }
  }
}

/**
 * Map the global Living Truth state to compose flags.
 *   base               → approved-only, NO unsealed sprints (sealed Living Truth as-is)
 *   approved (upTo=X)  → living + approved proposals/packs up to vX
 *   drafts   (upTo=X)  → … + ALL drafts up to vX (the preview banner is engine-added)
 * `--up-to-sprint v0` excludes every unsealed sprint (n > 0), so base = the sealed base universally.
 */
function livingTruthArgs(state) {
  const stage = state && state.stage ? state.stage : 'base'
  const upTo = stage === 'base' || !state || state.upTo == null ? 0 : Number(state.upTo)
  const args = ['--phase', 'all', '--up-to-sprint', `v${upTo}`, '--format', 'json']
  if (stage === 'drafts') args.push('--with-drafts')
  return args
}

/** The composer the viewer uses everywhere. Returns `[{ phase, living, content }]` (may be []). */
function composeLivingTruth(py, tool, cwd, state) {
  const data = runJson(py, tool, cwd, livingTruthArgs(state))
  return Array.isArray(data) ? data : []
}

/**
 * Per-sprint merged preview (requirement #3): effective truth up to sprint N PLUS that sprint's
 * own drafts (D2 — cumulative, not isolated). Independent of the global Living Truth state (Q5a).
 * `draftPaths` are sprint N's DRAFT source paths from the inventory; with none it is approved-up-to-N.
 */
function composeSprintMerged(py, tool, cwd, n, draftPaths) {
  const args = ['--phase', 'all', '--up-to-sprint', `v${n}`, '--preview', '--format', 'json']
  for (const p of draftPaths) args.push('--include-draft', p)
  const data = runJson(py, tool, cwd, args)
  return Array.isArray(data) ? data : []
}

function listSources(py, tool, cwd) {
  const inv = runJson(py, tool, cwd, ['--list-sources', '--format', 'json'])
  return {
    sealed_sprints: (inv && inv.sealed_sprints) || [],
    sources: (inv && inv.sources) || [],
  }
}

/** Per-source line-level diff for the current selection (the "show diffs" surface). Same stage→args
 * mapping as the Living Truth compose, but via `--per-source-diff`. Returns `[]` on any failure. */
function perSourceDiff(py, tool, cwd, state) {
  const stage = state && state.stage ? state.stage : 'base'
  const upTo = stage === 'base' || !state || state.upTo == null ? 0 : Number(state.upTo)
  const base = ['--per-source-diff', '--phase', 'all', '--up-to-sprint', `v${upTo}`, '--format', 'json']
  if (stage === 'drafts') base.push('--with-drafts')
  // Prefer the full before/after content (for the block-level rich rendered diff). Gracefully fall
  // back for an older installed engine that has --per-source-diff but not --with-content — the rich
  // view then renders from the hunk instead.
  let data = runJson(py, tool, cwd, ['--with-content', ...base])
  if (!Array.isArray(data)) data = runJson(py, tool, cwd, base)
  // null = the engine call FAILED (non-zero/exception — e.g. an older installed `.prism` engine that
  // lacks --per-source-diff entirely). Surface that distinctly from a genuine empty result (`[]`).
  return Array.isArray(data) ? data : null
}

/** Real python-backed engine, or null when no python is available. */
function defaultEngine(prism, cwd) {
  const py = pickPython()
  if (!py) return null
  return {
    listSources: () => listSources(py, prism.tool, cwd),
    composeLivingTruth: (state) => composeLivingTruth(py, prism.tool, cwd, state),
    composeSprintMerged: (n, draftPaths) => composeSprintMerged(py, prism.tool, cwd, n, draftPaths),
    perSourceDiff: (state) => perSourceDiff(py, prism.tool, cwd, state),
  }
}

// ── tree building (pure: no python, no I/O beyond the file writes the caller asks for) ─────────

/** Split scanned root children into the parts the transform reorganises. */
export function partitionChildren(children, sealedSet) {
  const phaseFolders = []
  const sprintFolders = []
  const others = []
  for (const node of children) {
    if (node.type === 'folder' && PHASE_ORDER.includes(node.name)) {
      phaseFolders.push(node)
      continue
    }
    const m = node.type === 'folder' && SPRINT_DIR_RE.exec(node.name)
    if (m) {
      const n = Number(m[1])
      sprintFolders.push({ node, n, sealed: sealedSet.has(n) })
      continue
    }
    others.push(node)
  }
  return { phaseFolders, sprintFolders, others }
}

function collectLinks(nodes, set) {
  for (const node of nodes) {
    if (node.type === 'file' && node.link) set.add(node.link)
    if (node.children) collectLinks(node.children, set)
  }
  return set
}

/**
 * Build nested nav nodes from composed docs AND optionally write their content into the runtime.
 * `living` looks like `docs/product/epics/EP-1.md`; we mirror that nesting under `urlPrefix`
 * and write the file under `fileBaseDir`. Used for per-sprint merged + Living-Truth reconcile.
 */
function nodesFromComposed(composed, { fileBaseDir, urlPrefix, stripPrefix = '', contentForEntry = null }) {
  const roots = []
  for (const entry of composed) {
    const rel = String(entry.living || '').replace(/^docs\//, '')
    if (!rel) continue
    const nodeRel = stripPrefix && rel.startsWith(`${stripPrefix}/`) ? rel.slice(stripPrefix.length + 1) : rel
    if (!nodeRel) continue
    if (contentForEntry !== null) {
      safeWrite(path.join(fileBaseDir, rel), contentForEntry(entry, rel))
    }

    const parts = nodeRel.split('/')
    const fname = parts.pop()
    let level = roots
    for (const seg of parts) {
      let folder = level.find((c) => c.type === 'folder' && c.name === seg)
      if (!folder) {
        folder = { type: 'folder', name: seg, title: humanize(seg), indexLink: null, children: [] }
        level.push(folder)
      }
      level = folder.children
    }
    level.push({
      type: 'file',
      name: fname,
      title: humanize(fname),
      link: `${urlPrefix}/${rel.replace(/\.md$/, '')}`,
      kind: 'md',
      viewer: null,
      srcAbs: path.join(fileBaseDir, rel),
    })
  }
  sortNodes(roots)
  return roots
}

function sortNodes(nodes) {
  nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
    return alphanum(a.name, b.name)
  })
  for (const node of nodes) if (node.children) sortNodes(node.children)
  return nodes
}

/**
 * The Living Truth group: the scanned phase folders (reordered to canonical phase order) whose
 * recognised .md now hold COMPOSED content (written by the caller). Composed docs that have no
 * scanned node (e.g. a not-yet-on-disk Living Truth file the engine bootstraps) are reconciled in
 * so the nav never hides composed content. The group's index is the picker page.
 */
function buildLivingTruthGroup(phaseFolders, composed, contentDir, { navComposed = composed } = {}) {
  const ordered = PHASE_ORDER.map((name) => phaseFolders.find((f) => f.name === name)).filter(Boolean)

  // Reconcile: any composed/nav-seeded doc not already represented as a node gets added under its
  // phase. Pre-seal sprint v1 can have no root Living Truth files yet; in that case `navComposed`
  // is a preview-only seed so the sidebar has stable links before the user presses Apply.
  const present = collectLinks(ordered, new Set())
  const missingByPhase = new Map()
  const currentByRel = new Map()
  for (const entry of composed) {
    const rel = String(entry.living || '').replace(/^docs\//, '')
    if (rel) currentByRel.set(rel, entry)
  }
  for (const entry of navComposed) {
    const rel = String(entry.living || '').replace(/^docs\//, '')
    if (!rel) continue
    const link = '/' + rel.replace(/\.md$/, '')
    if (present.has(link)) continue
    const phase = rel.split('/')[0]
    if (!missingByPhase.has(phase)) missingByPhase.set(phase, [])
    missingByPhase.get(phase).push({ entry, rel, current: currentByRel.get(rel) || null })
  }
  for (const [phase, items] of missingByPhase) {
    let folder = ordered.find((f) => f.name === phase)
    if (!folder) {
      folder = { type: 'folder', name: phase, title: humanize(phase), indexLink: null, children: [] }
      // keep canonical phase order even for a reconciled-in phase
      const at = PHASE_ORDER.indexOf(phase)
      const before = ordered.findIndex((f) => PHASE_ORDER.indexOf(f.name) > at)
      ordered.splice(before === -1 ? ordered.length : before, 0, folder)
    }
    const currentEntries = items.filter((i) => i.current).map((i) => i.current)
    const seedEntries = items.filter((i) => !i.current).map((i) => i.entry)
    folder.children.push(
      ...nodesFromComposed(currentEntries, {
        fileBaseDir: contentDir,
        urlPrefix: '',
        stripPrefix: phase,
        contentForEntry: (entry) => entry.content || '',
      }),
    )
    folder.children.push(
      ...nodesFromComposed(seedEntries, {
        fileBaseDir: contentDir,
        urlPrefix: '',
        stripPrefix: phase,
        contentForEntry: (_entry, rel) => livingTruthPlaceholder(rel),
      }),
    )
    sortNodes(folder.children)
  }

  return {
    type: 'folder',
    name: 'living-truth',
    title: LIVING_TRUTH_TITLE,
    indexLink: `/${PICKER_PAGE}`,
    children: ordered,
  }
}

/**
 * No-engine fallback: a 2-layer project without the `.prism` composer still gets the Living Truth
 * LAYOUT — the phase folders grouped (canonical order) under one node, shown RAW (no compose, no
 * picker). Returns null if no phase folder is present.
 */
function buildLivingTruthRaw(phaseFolders) {
  const ordered = PHASE_ORDER.map((name) => phaseFolders.find((f) => f.name === name)).filter(Boolean)
  if (!ordered.length) return null
  return { type: 'folder', name: 'living-truth', title: LIVING_TRUTH_TITLE, indexLink: null, children: ordered }
}

/**
 * A draft sprint node: its raw source files (kept from the scan) PLUS a "Merged (incl. draft)"
 * subfolder of composed pages. `engine.composeSprintMerged` is called per draft sprint (independent
 * of the global state — Q5a). Sealed sprints are returned untouched (browse-only — Q5b/D-decision).
 */
function buildSprintNode({ node, n, sealed }, inventory, engine, contentDir) {
  if (sealed) return node
  const draftPaths = inventory.sources
    .filter((s) => sprintNum(s.sprint) === n && s.status === 'DRAFT')
    .map((s) => s.path)
  const merged = engine.composeSprintMerged(n, draftPaths)
  if (!merged.length) return node
  const mergedChildren = nodesFromComposed(merged, {
    fileBaseDir: path.join(contentDir, `sprint-v${n}`, MERGED_DIR),
    urlPrefix: `/sprint-v${n}/${MERGED_DIR}`,
    contentForEntry: (entry) => entry.content || '',
  })
  const mergedNode = {
    type: 'folder',
    name: MERGED_DIR,
    title: 'Merged (incl. draft)',
    indexLink: null,
    children: mergedChildren,
  }
  return { ...node, children: [mergedNode, ...node.children] }
}

// ── picker markup ─────────────────────────────────────────────────────────────

// Calmer in dark mode (brand-3 instead of the brighter brand-1) + more breathing room between buttons.
const BTN =
  'margin:.7rem .7rem .2rem 0;padding:7px 16px;font-size:14px;cursor:pointer;border-radius:6px;' +
  'border:1px solid transparent;background:var(--vp-c-brand-3,#3451b2);color:var(--vp-c-white,#fff)'
const BTN_GHOST =
  'margin:.7rem .7rem .2rem 0;padding:7px 16px;font-size:14px;cursor:pointer;border-radius:6px;' +
  'border:1px solid var(--vp-c-divider,#ccc);background:transparent;color:var(--vp-c-brand-1,#3451b2)'

/**
 * Render the source picker as plain checkboxes + ONE Apply action (raw HTML embedded in the page).
 * Tick the open sprints (prefix: ticking vN ticks every sprint ≤ N, unticking vN unticks every
 * sprint ≥ N — matches the engine's cumulative `--up-to-sprint`) and optionally "Include drafts",
 * then Apply recomposes. Apply/Export show a blocking overlay so the recompose is never a silent
 * no-op. All logic is inline (no <script> block — VitePress would hoist it); operators are entity-
 * escaped so the browser decodes them back to valid JS.
 */
function renderPicker({ unsealed, sealedSprints, state, interactive, manualRefresh }) {
  const stage = state && state.stage ? state.stage : 'base'
  const upTo = stage === 'base' || !state || state.upTo == null ? 0 : Number(state.upTo)
  const L = []

  const stageNote =
    stage === 'drafts'
      ? `Showing **approved + drafts** up to **v${upTo}**.`
      : stage === 'approved'
        ? `Showing **approved** up to **v${upTo}**.`
        : 'Showing the **sealed base** (no open sprint folded in yet).'
  L.push(`> ${stageNote} Composed live by \`effective_truth.py\`; never written to \`./docs\`, never sealed.`)
  L.push('')

  if (!interactive) {
    L.push('_Static snapshot composed at build time. The source picker + Apply + Export are available when you run `docs-view dev`._')
    return L.join('\n')
  }

  L.push(
    '<div class="prism-picker" style="border:1px solid var(--vp-c-divider,#ddd);border-radius:8px;padding:12px 16px;margin:1rem 0">',
  )
  L.push(
    '<p style="margin:0 0 .5rem"><strong>Compose the Living Truth.</strong> Tick the open sprints to fold in ' +
      '(cumulative: v2 implies v1), tick <em>Include drafts</em> to also fold in unapproved changes, then ' +
      '<strong>Apply</strong>.</p>',
  )
  if (sealedSprints.length) {
    L.push(
      `<div style="margin:.3rem 0"><label><input type="checkbox" checked disabled> 🔒 <strong>Sealed base</strong> ` +
        `(${escHtml(sealedSprints.join(', '))}) — always included</label></div>`,
    )
  }

  if (!unsealed.length) {
    L.push('<p style="opacity:.7;margin:.4rem 0">No open sprints — the Living Truth is fully sealed.</p>')
  } else {
    L.push('<ul style="margin:.2rem 0 .2rem 1.2rem;padding:0;list-style:none">')
    for (const n of unsealed) {
      const chk = stage !== 'base' && n <= upTo ? ' checked' : ''
      // Prefix tick: ticking n ticks all ≤ n, unticking n unticks all ≥ n.
      const pick =
        `(function(c){Array.prototype.forEach.call(document.querySelectorAll('.prism-sprint'),` +
        `function(b){var bn=+b.getAttribute('data-n');b.checked=c?bn<=${n}:bn<${n}})})(this.checked)`
      L.push(
        `<li><label><input type="checkbox" class="prism-sprint" data-n="${n}"${chk} onclick="${attrJs(pick)}"> ` +
          `Sprint <strong>v${n}</strong></label></li>`,
      )
    }
    L.push('</ul>')
    // Include-drafts toggle (replaces the old two-stage A→B buttons — clearer).
    const draftsChk = stage === 'drafts' ? ' checked' : ''
    L.push(
      `<div style="margin:.3rem 0"><label><input type="checkbox" id="prism-drafts"${draftsChk}> ` +
        'Include <strong>drafts</strong> (unapproved changes)</label></div>',
    )
  }

  // Shared inline JS. `sel` returns {upTo, stage}; `overlay(label)` shows a full-screen blocking
  // spinner so a recompose/export is never a silent no-op.
  const gather =
    "Array.prototype.reduce.call(document.querySelectorAll('.prism-sprint')," +
    "function(m,b){return b.checked?Math.max(m,+b.getAttribute('data-n')):m},0)"
  const sel =
    `(function(){var u=${gather};var d=document.getElementById('prism-drafts');` +
    "return {upTo:u,stage:u>0?(d&&d.checked?'drafts':'approved'):'base'}})()"
  // NB: all string literals here MUST be single-quoted — the onclick attribute is double-quoted and
  // attrJs only escapes & < > (not "). `label` is plain text with no single quotes.
  const overlay = (label) =>
    "(function(){var o=document.createElement('div');o.setAttribute('style'," +
    "'position:fixed;inset:0;z-index:99;display:flex;align-items:center;justify-content:center;" +
    "background:rgba(0,0,0,.55);color:#fff;font:600 16px system-ui,sans-serif');" +
    `o.textContent='${label}';document.body.appendChild(o);return o})()`

  const applyJs =
    `(function(){var s=${sel};var o=${overlay('Composing the Living Truth…')};` +
    `fetch('${COMPOSE_ENDPOINT}',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(s)})` +
    ".then(function(r){if(r.ok){location.reload()}else{o.textContent='Compose failed — see the terminal'}})" +
    ".catch(function(){o.textContent='Compose failed — see the terminal'})})()"
  const exportJs =
    `(function(){var s=${sel};var o=${overlay('Exporting…')};` +
    `fetch('${EXPORT_ENDPOINT}',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(s)})` +
    '.then(function(r){return r.blob()}).then(function(b){var u=URL.createObjectURL(b);var a=document.createElement(\'a\');' +
    "a.href=u;a.download='prism-living-truth.zip';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(u);o.remove()})" +
    ".catch(function(){o.textContent='Export failed'})})()"

  L.push(`<button type="button" id="prism-apply" onclick="${attrJs(applyJs)}" style="${BTN}">Apply</button>`)
  L.push(`<button type="button" id="prism-export" onclick="${attrJs(exportJs)}" style="${BTN_GHOST}">⬇ Export .zip</button>`)
  L.push('<p style="opacity:.7;margin:.4rem 0 0;font-size:13px">Changing a tick updates nothing until you press <strong>Apply</strong>.</p>')
  if (manualRefresh) {
    L.push(
      '<p style="opacity:.8;margin:.3rem 0 0">ℹ Auto-refresh is unavailable here (recursive file-watch needs ' +
        'Node ≥ 20 on Linux) — re-press <strong>Apply</strong> after editing sources.</p>',
    )
  }
  L.push('</div>')
  return L.join('\n')
}

/**
 * Write the picker page (Living Truth index). Diffs are rendered by the interactive <DiffBrowser>
 * component (it lazily fetches `/__prism-diff` and offers source/document grouping + side-by-side),
 * so nothing diff-related is embedded server-side here.
 */
function writePickerPage({ contentDir, inventory, state, interactive, manualRefresh }) {
  const sealedSprints = (inventory.sealed_sprints || []).slice().sort(alphanum)
  const unsealed = [...new Set(inventory.sources.map((s) => sprintNum(s.sprint)))].sort((a, b) => a - b)
  const body = renderPicker({ unsealed, sealedSprints, state, interactive, manualRefresh })
  // aside:false frees the right TOC column; pageClass widens the content to the full layout band
  // (see theme/style.css .prism-wide) so the diff browser / side-by-side has room.
  const frontmatter = ['---', 'aside: false', 'pageClass: prism-wide', '---', '']
  const parts = [...frontmatter, `# ${LIVING_TRUTH_TITLE}`, '', body, '']
  if (interactive) parts.push('<DiffBrowser />', '')
  const md = parts.join('\n')
  safeWrite(path.join(contentDir, `${PICKER_PAGE}.md`), md)
}

function composeLatestSprintSeed(inventory, engine) {
  if (!(inventory.sources || []).length) return []
  const latest = Math.max(...inventory.sources.map((s) => sprintNum(s.sprint)).filter(Number.isFinite))
  if (!Number.isFinite(latest) || latest <= 0) return []
  const draftPaths = inventory.sources
    .filter((s) => sprintNum(s.sprint) === latest && s.status === 'DRAFT')
    .map((s) => s.path)
  return engine.composeSprintMerged(latest, draftPaths)
}

function writeLivingTruthPlaceholders(contentDir, composed) {
  for (const entry of composed) {
    const rel = String(entry.living || '').replace(/^docs\//, '')
    if (rel) safeWrite(path.join(contentDir, rel), livingTruthPlaceholder(rel))
  }
}

// ── public entry points ───────────────────────────────────────────────────────

/**
 * Transform the scanned `tree` in place. Returns `{ mode }`:
 *   - 'composed' — PRISM engine + either root Living Truth folders or sprint inventory:
 *                  Living Truth composed per-doc + picker + sprints.
 *   - 'raw'      — 2-layer, NO engine: Living Truth LAYOUT (phase folders grouped, raw, no picker).
 *   - 'none'     — no PRISM/2-layer structure: tree left untouched (caller shows the plain browser).
 * `cwd` is the project root (= dirname(docsDir)); `docsDir` defaults to `<cwd>/docs`. Never throws.
 * `engine` can be injected for tests; defaults to the python-backed composer.
 */
export function injectPrismStructure({
  cwd,
  docsDir = null,
  contentDir,
  tree,
  state = { upTo: null, stage: 'base' },
  interactive = false,
  manualRefresh = false,
  engine = null,
}) {
  try {
    const docs = docsDir || path.join(cwd, 'docs')
    const has2Layer = detect2Layer(docs)
    const prism = detectPrism(cwd)
    const eng = engine || (prism ? defaultEngine(prism, cwd) : null)

    if (!has2Layer && !eng) {
      if (interactive) console.log('[docs-view] no 2-layer phase structure — plain browser view')
      return { mode: 'none' }
    }

    // RAW layout (2-layer, no composer): group the phase folders; everything else keeps its place.
    if (!eng) {
      const phaseFolders = tree.children.filter((n) => n.type === 'folder' && PHASE_ORDER.includes(n.name))
      const livingGroup = buildLivingTruthRaw(phaseFolders)
      const rest = tree.children.filter((n) => !(n.type === 'folder' && PHASE_ORDER.includes(n.name)))
      tree.children = [livingGroup, ...rest].filter(Boolean)
      if (interactive) {
        console.log(
          prism
            ? '[docs-view] PRISM project but no python — Living Truth LAYOUT (raw, no compose)'
            : '[docs-view] 2-layer phase structure — Living Truth LAYOUT (raw, no PRISM engine)',
        )
      }
      return { mode: 'raw' }
    }

    // COMPOSED view (engine present).
    const inventory = eng.listSources()
    const sealedSet = new Set((inventory.sealed_sprints || []).map(sprintNum))
    const partitioned = partitionChildren(tree.children, sealedSet)
    const hasPrismSources =
      (inventory.sources || []).length > 0 ||
      (inventory.sealed_sprints || []).length > 0 ||
      partitioned.sprintFolders.length > 0
    if (!has2Layer && !hasPrismSources) {
      if (interactive) console.log('[docs-view] no 2-layer phase structure or PRISM sprint sources — plain browser view')
      return { mode: 'none' }
    }

    // Compose + write the Living Truth docs (override the mirror symlinks with composed content).
    const composed = eng.composeLivingTruth(state)
    for (const entry of composed) {
      const rel = String(entry.living || '').replace(/^docs\//, '')
      if (rel) safeWrite(path.join(contentDir, rel), entry.content || '')
    }
    let navComposed = composed
    if (interactive && !composed.length && (inventory.sources || []).length) {
      navComposed = composeLatestSprintSeed(inventory, eng)
    }

    writePickerPage({ contentDir, inventory, state, interactive, manualRefresh })

    const { phaseFolders, sprintFolders, others } = partitioned

    const livingGroup = buildLivingTruthGroup(phaseFolders, composed, contentDir, { navComposed })

    const draft = sprintFolders.filter((s) => !s.sealed).sort((a, b) => a.n - b.n)
    const sealed = sprintFolders.filter((s) => s.sealed).sort((a, b) => a.n - b.n)

    const draftGroup = draft.length
      ? {
          type: 'folder',
          name: 'draft-sprints',
          title: DRAFT_SPRINTS_TITLE,
          indexLink: null,
          children: draft.map((s) => buildSprintNode(s, inventory, eng, contentDir)),
        }
      : null
    const sealedGroup = sealed.length
      ? {
          type: 'folder',
          name: 'sealed-sprints',
          title: SEALED_SPRINTS_TITLE,
          indexLink: null,
          children: sealed.map((s) => s.node),
        }
      : null

    // Final order: Living Truth → Draft sprints → other files (their real position) → Sealed (bottom).
    tree.children = [livingGroup, draftGroup, ...others, sealedGroup].filter(Boolean)

    if (interactive) {
      const note = composed.length ? `${composed.length} living-truth doc(s)` : 'no living-truth docs'
      console.log(
        `[docs-view] PRISM structured view: ${note}, ${draft.length} draft + ${sealed.length} sealed sprint(s)`,
      )
    }
    return { mode: 'composed' }
  } catch (err) {
    console.warn(`[docs-view] PRISM structured view skipped: ${err && err.message ? err.message : err}`)
    return { mode: 'none' }
  }
}

/**
 * Recompose ONLY the Living Truth doc contents + the picker page for a new state. The sidebar
 * structure is fixed at startup, so a state change (picker A/B) just rewrites files; the page
 * reloads. Returns true on success. Used by the dev endpoints + the source watcher.
 */
export function recomposeLivingTruth({ cwd, contentDir, state, interactive = true, manualRefresh = false, engine = null }) {
  const prism = detectPrism(cwd)
  if (!prism) return false
  const eng = engine || defaultEngine(prism, cwd)
  if (!eng) return false
  try {
    const composed = eng.composeLivingTruth(state)
    for (const entry of composed) {
      const rel = String(entry.living || '').replace(/^docs\//, '')
      if (rel) safeWrite(path.join(contentDir, rel), entry.content || '')
    }
    const inventory = eng.listSources()
    if (!composed.length) writeLivingTruthPlaceholders(contentDir, composeLatestSprintSeed(inventory, eng))
    writePickerPage({ contentDir, inventory, state, interactive, manualRefresh })
    return true
  } catch {
    return false
  }
}

/**
 * Watch PRISM source files and recompose the Living Truth when they change (dev live-reload).
 * Recomposes with the current shared `state` ({ upTo, stage }). Writes never touch ./docs → no
 * watch feedback loop. Returns a `{ close() }` handle, or null when recursive fs.watch is
 * unavailable (Linux Node < 20) — the caller then offers a manual re-merge.
 */
export function watchPrismPreview({ cwd, contentDir, state }) {
  const prism = detectPrism(cwd)
  if (!prism) return null
  const docsDir = path.join(cwd, 'docs')

  function feedsPreview(filename) {
    if (!filename) return true
    const f = filename.split(path.sep).join('/')
    return f.includes('sprint-v') || /^(product|design|architecture|testing)\//.test(f)
  }

  let timer = null
  function schedule() {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      if (recomposeLivingTruth({ cwd, contentDir, state })) {
        console.log('[docs-view] PRISM Living Truth refreshed (source changed)')
      }
    }, 300)
  }

  try {
    const docsWatcher = watch(docsDir, { recursive: true }, (_event, filename) => {
      if (feedsPreview(filename)) schedule()
    })
    const cfgWatcher = watch(prism.config, () => schedule())
    console.log('[docs-view] watching PRISM sources — Living Truth auto-refreshes on change')
    return {
      close() {
        if (timer) clearTimeout(timer)
        docsWatcher.close()
        cfgWatcher.close()
      },
    }
  } catch (err) {
    console.warn(
      `[docs-view] PRISM auto-refresh unavailable (${err && err.message ? err.message : err}); ` +
        'use the Merge button to recompose.',
    )
    return null
  }
}

// ── dev endpoints ─────────────────────────────────────────────────────────────

/** Collect a request body and JSON-parse it; resolves `{}` on empty/invalid/oversized. */
function readJsonBody(req) {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
      if (data.length > 5_000_000) {
        data = ''
        req.destroy()
        resolve({})
      }
    })
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {})
      } catch {
        resolve({})
      }
    })
    req.on('error', () => resolve({}))
  })
}

/** Normalise a posted {upTo, stage} into a clean state object. */
export function stateFromBody(body) {
  const stage = body && (body.stage === 'approved' || body.stage === 'drafts') ? body.stage : 'base'
  if (stage === 'base') return { upTo: null, stage }
  let upTo = body && body.upTo != null ? Number(body.upTo) : 0
  if (!Number.isFinite(upTo) || upTo < 0) upTo = 0
  return { upTo, stage }
}

function plain(res, code, text) {
  res.statusCode = code
  if (typeof res.setHeader === 'function') res.setHeader('content-type', 'text/plain; charset=utf-8')
  res.end(text)
}

function handleRefresh(res, { cwd, contentDir, state }) {
  const ok = recomposeLivingTruth({ cwd, contentDir, state, manualRefresh: true })
  plain(res, ok ? 200 : 500, ok ? 'refreshed' : 'refresh-failed')
}

/** Per-source diff JSON for the current selection — lazily fetched by the <DiffBrowser> component.
 * Each per-doc diff entry also carries `content`: the FULL composed (after) markdown of that doc, so
 * the "Rendered" view can render the whole document (tables/lists stay intact — a diff fragment
 * would drop a table's header/separator and fail to render). */
function handleDiff(res, { cwd, state }) {
  let data = null
  try {
    const prism = detectPrism(cwd)
    const eng = prism && defaultEngine(prism, cwd)
    if (eng) data = eng.perSourceDiff(state)
  } catch {
    data = null
  }
  res.statusCode = data === null ? 500 : 200
  if (typeof res.setHeader === 'function') res.setHeader('content-type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(data === null ? { error: 'diff unavailable' } : data))
}

async function handleCompose(req, res, { cwd, contentDir, state }) {
  const next = stateFromBody(await readJsonBody(req))
  state.upTo = next.upTo
  state.stage = next.stage
  const ok = recomposeLivingTruth({ cwd, contentDir, state })
  plain(res, ok ? 200 : 500, ok ? 'composed' : 'compose-failed')
}

async function handleExport(req, res, { cwd }) {
  const next = stateFromBody(await readJsonBody(req))
  let zip = null
  try {
    const prism = detectPrism(cwd)
    const eng = prism && defaultEngine(prism, cwd)
    if (eng) {
      const composed = eng.composeLivingTruth(next)
      const files = composed
        .map((e) => ({ name: String(e.living || '').replace(/^docs\//, ''), data: e.content || '' }))
        .filter((f) => f.name)
      if (files.length) zip = makeZip(files)
    }
  } catch {
    zip = null
  }
  if (!zip) {
    plain(res, 500, 'export-failed')
    return
  }
  // Timestamped so repeated exports don't overwrite each other in Downloads.
  const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  res.statusCode = 200
  if (typeof res.setHeader === 'function') {
    res.setHeader('content-type', 'application/zip')
    res.setHeader('content-disposition', `attachment; filename="prism-living-truth-${ts}.zip"`)
  }
  res.end(zip)
}

/**
 * Register the dev-server endpoints on the Vite connect stack. Prepended (`.stack` unshift) so the
 * custom routes run BEFORE Vite's SPA fallback; falls back to `.use`. The shared `state`
 * (`{ upTo, stage }`) is mutated by compose so refresh/auto-watch recompose with the latest pick.
 */
export function registerPrismEndpoints(server, { cwd, contentDir, state }) {
  const mw = server && server.middlewares
  if (!mw) return false
  const ctx = { cwd, contentDir, state: state || { upTo: null, stage: 'base' } }
  const handle = (req, res, next) => {
    const url = (req && req.url ? req.url : '').split('?')[0]
    if (url === REFRESH_ENDPOINT) return void handleRefresh(res, ctx)
    if (url === COMPOSE_ENDPOINT) return void handleCompose(req, res, ctx)
    if (url === EXPORT_ENDPOINT) return void handleExport(req, res, ctx)
    if (url === DIFF_ENDPOINT) return void handleDiff(res, ctx)
    if (typeof next === 'function') return next()
    return undefined
  }
  if (Array.isArray(mw.stack)) {
    mw.stack.unshift({ route: '', handle })
    return true
  }
  if (typeof mw.use === 'function') {
    mw.use(handle)
    return true
  }
  return false
}
