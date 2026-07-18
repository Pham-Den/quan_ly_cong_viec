import { spawnSync } from 'node:child_process'
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { scanDocs } from '../src/scan.js'
import { mirror } from '../src/mirror.js'
import {
  injectPrismStructure,
  recomposeLivingTruth,
  partitionChildren,
  stateFromBody,
  detect2Layer,
  registerPrismEndpoints,
  DIFF_ENDPOINT,
} from '../src/prism-preview.js'
import { findDocsDir, resolveDocsArg, discoverDocsCandidates } from '../src/resolve-docs.js'
import { renderFolderPicker, resolvePickedDir, listDir, osFolderDialog } from '../src/folder-picker.js'
import { linkFile, copyMode } from '../src/fs-link.js'
import { parseDiff, diffStat, netByDoc } from '../theme/components/diff-parse.js'
import { richDiffHtml } from '../theme/components/rich-diff.js'

/**
 * PRISM structured-view tests for docs-viewer.
 *
 *  1. Node-only unit tests — an INJECTED fake engine drives the tree transform, so they run with
 *     no Python and assert structure, source-safety (./docs never written), picker markup, and the
 *     pure helpers (partitionChildren / stateFromBody).
 *  2. Real-core e2e — when the workspace PRISM engine + python3 are present, build a real PRISM
 *     fixture and assert the REAL composer's output flows through (base vs approved vs drafts, the
 *     per-sprint merged subfolder). Skipped (not failed) when the engine/python is unavailable, so
 *     the package's `npm test` stays green as a standalone install.
 */

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(scriptDir, '..')

let passed = 0
function fail(msg) {
  throw new Error(`[prism-test] ${msg}`)
}
function ok(cond, msg) {
  if (!cond) fail(msg)
  passed++
}
function isSymlink(p) {
  try {
    return lstatSync(p).isSymbolicLink()
  } catch {
    return false
  }
}
function findChild(node, name) {
  return (node.children || []).find((c) => c.name === name)
}
function tmp(prefix) {
  return mkdtempSync(path.join(os.tmpdir(), prefix))
}

// Materialize the minimal bits detectPrism() needs (it never runs the stub — we inject the engine).
function stubPrism(root) {
  mkdirSync(path.join(root, '.prism', 'core', 'tools'), { recursive: true })
  writeFileSync(path.join(root, '.prism', 'core', 'tools', 'effective_truth.py'), '# stub\n', 'utf8')
  writeFileSync(root + '/prism-config.md', '```yaml\nprism:\n  version: "0"\n```\n', 'utf8')
}

// ── 1. node-only unit tests (fake engine) ──────────────────────────────────────

function unit_pureHelpers() {
  // partitionChildren
  const sealedSet = new Set([1])
  const children = [
    { type: 'folder', name: 'product', children: [] },
    { type: 'folder', name: 'architecture', children: [] },
    { type: 'folder', name: 'sprint-v1', children: [] },
    { type: 'folder', name: 'sprint-v2', children: [] },
    { type: 'file', name: 'index.md', isIndex: true },
    { type: 'folder', name: 'assets', children: [] },
  ]
  const { phaseFolders, sprintFolders, others } = partitionChildren(children, sealedSet)
  ok(phaseFolders.map((f) => f.name).sort().join(',') === 'architecture,product', 'partition: phase folders')
  ok(sprintFolders.length === 2, 'partition: two sprint folders')
  ok(sprintFolders.find((s) => s.n === 1).sealed === true, 'partition: v1 sealed')
  ok(sprintFolders.find((s) => s.n === 2).sealed === false, 'partition: v2 unsealed')
  ok(others.map((o) => o.name).sort().join(',') === 'assets,index.md', 'partition: others kept')

  // stateFromBody
  let s = stateFromBody({})
  ok(s.upTo === null && s.stage === 'base', 'state: empty → base')
  s = stateFromBody({ upTo: 2, stage: 'approved' })
  ok(s.upTo === 2 && s.stage === 'approved', 'state: approved upTo 2')
  s = stateFromBody({ upTo: '3', stage: 'drafts' })
  ok(s.upTo === 3 && s.stage === 'drafts', 'state: string upTo coerced')
  s = stateFromBody({ stage: 'bogus', upTo: 5 })
  ok(s.stage === 'base' && s.upTo === null, 'state: bogus stage → base (upTo dropped)')
}

function fakeEngine() {
  return {
    listSources: () => ({
      sealed_sprints: ['v1'],
      sources: [
        {
          sprint: 'v2',
          phase: 'product',
          status: 'DRAFT',
          type: 'proposal',
          path: 'docs/sprint-v2/product/proposals/prd-v2.md',
        },
      ],
    }),
    composeLivingTruth: (state) => [
      { phase: 'product', living: 'docs/product/prd.md', content: `# PRD stage=${state.stage} upTo=${state.upTo}\n` },
      { phase: 'architecture', living: 'docs/architecture/architecture.md', content: '# ARCH composed\n' },
    ],
    composeSprintMerged: (n, draftPaths) => [
      { phase: 'product', living: 'docs/product/prd.md', content: `# MERGED v${n} drafts=${draftPaths.length}\n` },
    ],
    perSourceDiff: (state) =>
      state.stage === 'base'
        ? []
        : [
            {
              sprint: 'v2',
              sprint_n: 2,
              phase: 'product',
              status: 'DRAFT',
              type: 'proposal',
              path: 'docs/sprint-v2/product/proposals/prd-v2.md',
              diffs: [{ living: 'product/prd.md', diff: '@@ -1 +1,2 @@\n base\n+DIFF_NEW_LINE\n' }],
            },
          ],
  }
}

function fakePresealV1Engine() {
  return {
    listSources: () => ({
      sealed_sprints: [],
      sources: [
        {
          sprint: 'v1',
          phase: 'product',
          status: 'DRAFT',
          type: 'proposal',
          path: 'docs/sprint-v1/product/proposals/prd-v1.md',
        },
        {
          sprint: 'v1',
          phase: 'product',
          status: 'DRAFT',
          type: 'change-pack',
          path: 'docs/sprint-v1/changes/v1.1.0-fix/product-delta-v1.1.0-fix.md',
          pack: 'v1.1.0-fix',
        },
      ],
    }),
    composeLivingTruth: (state) =>
      state.stage === 'base'
        ? []
        : [
            {
              phase: 'product',
              living: 'docs/product/prd.md',
              content: `# PRD preseal stage=${state.stage} upTo=${state.upTo}\n`,
            },
          ],
    composeSprintMerged: (n, draftPaths) => [
      {
        phase: 'product',
        living: 'docs/product/prd.md',
        content: `# PRESEAL MERGED v${n} drafts=${draftPaths.length}\n`,
      },
    ],
    perSourceDiff: () => [],
  }
}

function buildFixtureTree(root) {
  const docs = path.join(root, 'docs')
  mkdirSync(path.join(docs, 'product'), { recursive: true })
  mkdirSync(path.join(docs, 'architecture'), { recursive: true })
  mkdirSync(path.join(docs, 'sprint-v1', 'product', 'proposals'), { recursive: true })
  mkdirSync(path.join(docs, 'sprint-v2', 'product', 'proposals'), { recursive: true })
  writeFileSync(path.join(docs, 'product', 'prd.md'), 'BASE PRD\n', 'utf8')
  writeFileSync(path.join(docs, 'architecture', 'architecture.md'), 'BASE ARCH\n', 'utf8')
  writeFileSync(path.join(docs, 'architecture', 'diagram.drawio'), '<mxfile></mxfile>\n', 'utf8')
  writeFileSync(path.join(docs, 'sprint-v1', 'product', 'proposals', 'prd-v1.md'), '# v1 proposal\n', 'utf8')
  writeFileSync(path.join(docs, 'sprint-v2', 'product', 'proposals', 'prd-v2.md'), '# v2 proposal\n', 'utf8')
  return docs
}

function buildPresealV1Tree(root) {
  const docs = path.join(root, 'docs')
  mkdirSync(path.join(docs, 'sprint-v1', 'product', 'proposals'), { recursive: true })
  mkdirSync(path.join(docs, 'sprint-v1', 'changes', 'v1.1.0-fix'), { recursive: true })
  writeFileSync(path.join(docs, 'sprint-v1', 'product', 'proposals', 'prd-v1.md'), '# v1 draft proposal\n', 'utf8')
  writeFileSync(path.join(docs, 'sprint-v1', 'changes', 'v1.1.0-fix', 'product-delta-v1.1.0-fix.md'), '# v1 draft delta\n', 'utf8')
  return docs
}

function unit_transform() {
  const root = tmp('prism-unit-')
  try {
    stubPrism(root)
    const docsDir = buildFixtureTree(root)
    const contentDir = path.join(root, '.docs-view', 'content')
    const tree = scanDocs(docsDir)
    mirror({ tree, docsDir, contentDir })

    const state = { upTo: null, stage: 'base' }
    const r = injectPrismStructure({ cwd: root, docsDir, contentDir, tree, interactive: true, state, engine: fakeEngine() })
    ok(r.mode === 'composed', 'transform: composed mode')

    // top-level order: Living Truth → Draft sprints → Sealed (no "others" in this fixture)
    const titles = tree.children.map((c) => c.title)
    ok(titles[0] === 'Living Truth', 'transform: Living Truth first')
    ok(titles[titles.length - 1] === 'Sealed / closed sprints', 'transform: Sealed last')
    ok(titles.includes('Draft sprints'), 'transform: Draft sprints present')

    const living = tree.children[0]
    ok(living.indexLink === '/prism-living-truth', 'transform: living indexLink = picker')
    ok(
      living.children.map((c) => c.name).join(',') === 'product,architecture',
      'transform: living truth in phase order (product before architecture)',
    )
    // asset kept raw under architecture
    const arch = findChild(living, 'architecture')
    ok(!!findChild(arch, 'diagram.drawio'), 'transform: drawio asset kept under architecture')

    const draft = tree.children.find((c) => c.title === 'Draft sprints')
    const sv2 = findChild(draft, 'sprint-v2')
    ok(!!sv2, 'transform: sprint-v2 under Draft sprints')
    const merged = findChild(sv2, 'prism-merged')
    ok(merged && merged.title === 'Merged (incl. draft)', 'transform: per-sprint merged subfolder')

    const sealed = tree.children[titles.length - 1]
    ok(!!findChild(sealed, 'sprint-v1'), 'transform: sprint-v1 under Sealed')

    // composed content written, ./docs untouched, override is a real file (not a symlink)
    const prdRuntime = path.join(contentDir, 'product', 'prd.md')
    ok(readFileSync(prdRuntime, 'utf8').includes('stage=base'), 'transform: composed content written to runtime')
    ok(!isSymlink(prdRuntime), 'transform: override replaced the mirror symlink with a real file')
    ok(readFileSync(path.join(docsDir, 'product', 'prd.md'), 'utf8') === 'BASE PRD\n', 'transform: ./docs source UNTOUCHED')

    // picker page: checkbox model — Apply + Include-drafts checkbox + open sprint + blocking overlay
    const picker = readFileSync(path.join(contentDir, 'prism-living-truth.md'), 'utf8')
    ok(picker.includes('>Apply<'), 'picker: single Apply button')
    ok(picker.includes('id="prism-drafts"'), 'picker: Include-drafts checkbox')
    ok(!/id="prism-drafts"[^>]*checked/.test(picker), 'picker: drafts unchecked at base')
    ok(picker.includes('Sprint <strong>v2</strong>'), 'picker: open sprint checkbox')
    ok(picker.includes('Sealed base') && picker.includes('v1'), 'picker: locked sealed base')
    ok(picker.includes('Composing the Living Truth'), 'picker: Apply shows a blocking loading overlay')
    ok(!picker.includes('Merge approved') && !picker.includes('+ Merge drafts'), 'picker: old A/B buttons gone')
    ok(picker.includes('<DiffBrowser'), 'picker: embeds the DiffBrowser component (diffs lazy via endpoint)')
    // Container tags must be balanced or VitePress's Vue compiler rejects the page ("missing end
    // tag"). Cheap structural guard so a dropped </ul>/</div> is caught without a VitePress build.
    for (const tag of ['div', 'ul', 'li', 'p', 'label', 'button']) {
      const open = (picker.match(new RegExp(`<${tag}[\\s>]`, 'g')) || []).length
      const close = (picker.match(new RegExp(`</${tag}>`, 'g')) || []).length
      ok(open === close, `picker: <${tag}> balanced (${open} open / ${close} close)`)
    }

    // per-sprint merged file
    const mergedFile = path.join(contentDir, 'sprint-v2', 'prism-merged', 'product', 'prd.md')
    ok(readFileSync(mergedFile, 'utf8').includes('MERGED v2 drafts=1'), 'transform: per-sprint merged file written')

    // recompose → content + picker reflect the new state without touching structure
    recomposeLivingTruth({ cwd: root, contentDir, state: { upTo: 2, stage: 'drafts' }, engine: fakeEngine() })
    ok(readFileSync(prdRuntime, 'utf8').includes('stage=drafts upTo=2'), 'recompose: content updated')
    const picker2 = readFileSync(path.join(contentDir, 'prism-living-truth.md'), 'utf8')
    ok(/id="prism-drafts" checked/.test(picker2), 'recompose: Include-drafts ticked when stage=drafts')
    ok(/data-n="2" checked/.test(picker2), 'recompose: v2 ticked')
    ok(picker2.includes('<DiffBrowser'), 'recompose: still embeds the DiffBrowser component')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

function unit_presealV1WithoutLivingTruth() {
  const root = tmp('prism-preseal-unit-')
  try {
    stubPrism(root)
    const docsDir = buildPresealV1Tree(root)
    const contentDir = path.join(root, '.docs-view', 'content')
    const tree = scanDocs(docsDir)
    mirror({ tree, docsDir, contentDir })

    const state = { upTo: null, stage: 'base' }
    const r = injectPrismStructure({
      cwd: root,
      docsDir,
      contentDir,
      tree,
      interactive: true,
      state,
      engine: fakePresealV1Engine(),
    })
    ok(r.mode === 'composed', 'preseal v1: sprint inventory without root LT → composed mode')

    const living = tree.children[0]
    ok(living.title === 'Living Truth' && living.indexLink === '/prism-living-truth', 'preseal v1: Living Truth picker is present')
    const product = findChild(living, 'product')
    ok(!!product && !!findChild(product, 'prd.md'), 'preseal v1: future PRD node is seeded under Living Truth')
    const prdRuntime = path.join(contentDir, 'product', 'prd.md')
    ok(readFileSync(prdRuntime, 'utf8').includes('no composed content'), 'preseal v1: seeded PRD is a placeholder, not preview content')
    ok(!existsSync(path.join(docsDir, 'product', 'prd.md')), 'preseal v1: no root Living Truth file written to ./docs')

    const draft = tree.children.find((c) => c.title === 'Draft sprints')
    const sv1 = findChild(draft, 'sprint-v1')
    const merged = findChild(sv1, 'prism-merged')
    ok(!!merged, 'preseal v1: sprint-v1 has per-sprint merged subfolder')
    const mergedFile = path.join(contentDir, 'sprint-v1', 'prism-merged', 'product', 'prd.md')
    ok(readFileSync(mergedFile, 'utf8').includes('PRESEAL MERGED v1 drafts=2'), 'preseal v1: merged file includes v1 draft proposal + change pack')

    recomposeLivingTruth({ cwd: root, contentDir, state: { upTo: 1, stage: 'drafts' }, engine: fakePresealV1Engine() })
    ok(readFileSync(prdRuntime, 'utf8').includes('stage=drafts upTo=1'), 'preseal v1: Apply overwrites placeholder with composed Living Truth')
    recomposeLivingTruth({ cwd: root, contentDir, state: { upTo: null, stage: 'base' }, engine: fakePresealV1Engine() })
    ok(readFileSync(prdRuntime, 'utf8').includes('no composed content'), 'preseal v1: unticking back to base restores the placeholder')
    ok(!existsSync(path.join(docsDir, 'product', 'prd.md')), 'preseal v1: recompose still does not write root LT to ./docs')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

function unit_noneMode() {
  // No 2-layer phase structure (just loose files) → mode 'none', tree untouched (plain browser).
  const root = tmp('prism-none-')
  try {
    const docsDir = path.join(root, 'docs')
    mkdirSync(path.join(docsDir, 'guides'), { recursive: true })
    writeFileSync(path.join(docsDir, 'index.md'), '# Hi\n', 'utf8')
    writeFileSync(path.join(docsDir, 'guides', 'a.md'), '# A\n', 'utf8')
    const contentDir = path.join(root, '.docs-view', 'content')
    const tree = scanDocs(docsDir)
    mirror({ tree, docsDir, contentDir })
    const before = JSON.stringify(tree.children.map((c) => c.name))
    const r = injectPrismStructure({ cwd: root, docsDir, contentDir, tree })
    ok(r.mode === 'none', 'none: no 2-layer → mode none')
    ok(JSON.stringify(tree.children.map((c) => c.name)) === before, 'none: tree untouched')
    ok(!existsSync(path.join(contentDir, 'prism-living-truth.md')), 'none: no picker page written')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

function unit_rawMode() {
  // 2-layer phase structure but NO engine (.prism absent, no engine injected) → 'raw' layout.
  const root = tmp('prism-raw-')
  try {
    const docsDir = path.join(root, 'docs')
    mkdirSync(path.join(docsDir, 'product'), { recursive: true })
    mkdirSync(path.join(docsDir, 'architecture'), { recursive: true })
    mkdirSync(path.join(docsDir, 'sprint-v2'), { recursive: true })
    writeFileSync(path.join(docsDir, 'product', 'prd.md'), '# PRD raw\n', 'utf8')
    writeFileSync(path.join(docsDir, 'architecture', 'arch.md'), '# Arch raw\n', 'utf8')
    writeFileSync(path.join(docsDir, 'sprint-v2', 'note.md'), '# sprint note\n', 'utf8')
    const contentDir = path.join(root, '.docs-view', 'content')
    const tree = scanDocs(docsDir)
    mirror({ tree, docsDir, contentDir })
    const r = injectPrismStructure({ cwd: root, docsDir, contentDir, tree, interactive: false })
    ok(r.mode === 'raw', 'raw: 2-layer, no engine → mode raw')
    ok(tree.children[0].title === 'Living Truth', 'raw: Living Truth group first')
    ok(tree.children[0].children.map((c) => c.name).join(',') === 'product,architecture', 'raw: phase order')
    ok(findChild(tree.children[0], 'product').children.length > 0, 'raw: phase folder keeps its files')
    // raw = no compose, no picker page, sprint folder stays in place (not split)
    ok(!existsSync(path.join(contentDir, 'prism-living-truth.md')), 'raw: no picker page')
    ok(tree.children.some((c) => c.name === 'sprint-v2'), 'raw: sprint folder kept in place (no split)')
    // content NOT overridden (raw = symlink stays)
    ok(isSymlink(path.join(contentDir, 'product', 'prd.md')), 'raw: living-truth files left raw (symlink)')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

function unit_fsLink() {
  const root = tmp('fs-link-')
  try {
    writeFileSync(path.join(root, 'src.txt'), 'HELLO', 'utf8')

    // Default (POSIX here): symlink — edits to source show through.
    linkFile(path.join(root, 'src.txt'), path.join(root, 'as-symlink'))
    ok(isSymlink(path.join(root, 'as-symlink')), 'fs-link: POSIX default symlinks files')
    ok(readFileSync(path.join(root, 'as-symlink'), 'utf8') === 'HELLO', 'fs-link: symlink reads source')

    // Copy-mode (simulates Windows): a real copy, not a symlink.
    process.env.DOCS_VIEW_COPY = '1'
    try {
      ok(copyMode() === true, 'fs-link: copyMode honors DOCS_VIEW_COPY')
      linkFile(path.join(root, 'src.txt'), path.join(root, 'as-copy'))
      ok(!isSymlink(path.join(root, 'as-copy')), 'fs-link: copy-mode makes a real file (not symlink)')
      ok(readFileSync(path.join(root, 'as-copy'), 'utf8') === 'HELLO', 'fs-link: copy has the content')
      // a copy does NOT reflect later edits to the source (documented Windows trade-off)
      writeFileSync(path.join(root, 'src.txt'), 'CHANGED', 'utf8')
      ok(readFileSync(path.join(root, 'as-copy'), 'utf8') === 'HELLO', 'fs-link: copy is a snapshot (stale vs source)')
    } finally {
      delete process.env.DOCS_VIEW_COPY
    }
    ok(copyMode() === false, 'fs-link: copyMode off again after unset (POSIX)')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

async function unit_nativeDialog() {
  // ASYNC + test hook: returns a thenable, resolves the env-provided path without a real GUI.
  process.env.DOCS_VIEW_NATIVE_DIR = '/tmp/picked-by-os'
  try {
    const p = osFolderDialog()
    ok(typeof p.then === 'function', 'native dialog: returns a Promise (async, non-blocking)')
    ok((await p) === '/tmp/picked-by-os', 'native dialog: resolves the chosen path')
  } finally {
    delete process.env.DOCS_VIEW_NATIVE_DIR
  }
  process.env.DOCS_VIEW_NATIVE_DIR = '' // simulate cancel
  try {
    ok((await osFolderDialog()) === null, 'native dialog: empty/cancel → null')
  } finally {
    delete process.env.DOCS_VIEW_NATIVE_DIR
  }
}

function unit_diffParse() {
  const s = diffStat('@@ -1 +1 @@\n-a\n+b\n c\n')
  ok(s.added === 1 && s.removed === 1, 'diffStat: counts +/- (ignores headers/context)')

  const blocks = parseDiff('@@ -1,2 +1,2 @@\n line one\n-the quick fox\n+the slow fox\n')
  ok(blocks.some((b) => b.kind === 'hunk'), 'parseDiff: emits a hunk block')
  const ctx = blocks.find((b) => b.kind === 'ctx')
  ok(ctx && ctx.oldLn === 1 && ctx.newLn === 1, 'parseDiff: context carries old/new line numbers')
  const ch = blocks.find((b) => b.kind === 'change')
  ok(ch && ch.dels[0].ln === 2 && ch.adds[0].ln === 2, 'parseDiff: change carries line numbers')
  ok(ch.dels[0].segs.some((g) => g.t === 'quick' && g.hl), 'parseDiff: removed WORD highlighted')
  ok(ch.adds[0].segs.some((g) => g.t === 'slow' && g.hl), 'parseDiff: added WORD highlighted')
  ok(ch.dels[0].segs.some((g) => !g.hl && g.t.includes('the')), 'parseDiff: unchanged words NOT highlighted')
}

// Net view consolidation: collapse per-source deltas to one base→final pair per doc.
function unit_netByDoc() {
  // prd touched by v3 (base→mid) then v4 (mid→final); arch touched once; glossary unchanged-net.
  const sources = [
    { sprint: 'v3', diffs: [{ living: 'product/prd.md', before: 'base', after: 'mid', diff: '' }] },
    { sprint: 'v3', diffs: [{ living: 'architecture/arch.md', before: 'A', after: 'B', diff: '' }] },
    { sprint: 'v4', diffs: [{ living: 'product/prd.md', before: 'mid', after: 'final', diff: '' }] },
    { sprint: 'v4', diffs: [{ living: 'product/glossary.md', before: 'g', after: 'g', diff: '' }] }, // net no-op
    { sprint: 'v4', diffs: [{ living: 'product/skip.md', diff: 'x' }] }, // no before/after → ignored
  ]
  const net = netByDoc(sources)
  const prd = net.find((x) => x.living === 'product/prd.md')
  ok(prd && prd.before === 'base' && prd.after === 'final', 'netByDoc: consolidates first.before → last.after across sprints')
  ok(net.some((x) => x.living === 'architecture/arch.md'), 'netByDoc: single-sprint doc included')
  ok(!net.some((x) => x.living === 'product/glossary.md'), 'netByDoc: net no-op doc (before===after) excluded')
  ok(!net.some((x) => x.living === 'product/skip.md'), 'netByDoc: entries without before/after ignored')
  ok(netByDoc([]).length === 0 && netByDoc(undefined).length === 0, 'netByDoc: empty/undefined safe')
}

// Rich diff (Hướng B = word-level on the rendered HTML): render whole doc, mark changed WORDS inline;
// structure always stays valid (added row = real <tr> with marked text, removed item = struck <li>).
const tagBalance = (html) => {
  const o = (html.match(/<(table|thead|tbody|tr|td|th|ul|ol|li|p|h[1-6]|blockquote|pre)\b/g) || []).length
  const c = (html.match(/<\/(table|thead|tbody|tr|td|th|ul|ol|li|p|h[1-6]|blockquote|pre)>/g) || []).length
  return o === c
}
function unit_richDiff() {
  const before = `# Title

Intro stays the same.

The quick brown fox.

| ID | Status |
|----|--------|
| R1 | old    |

- first
- second
`
  const after = `# Title

Intro stays the same.

The quick red fox.

| ID | Status |
|----|--------|
| R1 | new    |
| R2 | added  |

- first
- second
- third
`
  const html = richDiffHtml(before, after)
  ok(/<del class="rd-del">brown<\/del>/.test(html), 'richDiff: removed WORD struck (brown)')
  ok(/<ins class="rd-ins">red<\/ins>/.test(html), 'richDiff: added WORD highlighted (red)')
  ok(html.includes('Intro stays the same'), 'richDiff: whole doc rendered — unchanged content kept in context')
  ok(html.includes('<h1') && html.includes('Title'), 'richDiff: formatting preserved (heading renders)')
  // table stays a real table; changed cell word-marked
  ok(html.includes('<table') && tagBalance(html), 'richDiff: output is a real table with balanced tags')
  ok(html.includes('<del class="rd-del">old</del>') && html.includes('<ins class="rd-ins">new</ins>'), 'richDiff: table cell change marked inline (old→new)')
  // ADDED row is a real highlighted <tr> (not broken/raw pipes)
  ok(/<tr class="rd-row-ins"><td>R2<\/td>/.test(html), 'richDiff: ADDED table row is a real highlighted <tr>')
  ok(!html.includes('| R2'), 'richDiff: added row does NOT leak raw markdown pipes')
  // ADDED list item is a real highlighted <li>; unchanged items stay plain
  ok(/<li class="rd-li-ins">third<\/li>/.test(html), 'richDiff: ADDED list item is a real highlighted <li>')
  ok(html.includes('<li>first</li>') && html.includes('<li>second</li>'), 'richDiff: unchanged list items stay plain')

  // removed table row → still a real <tr>, highlighted; tags balanced
  const rm = richDiffHtml('| ID |\n|----|\n| A |\n| B |\n', '| ID |\n|----|\n| A |\n')
  ok(/<tr class="rd-row-del"><td>B<\/td>/.test(rm) && tagBalance(rm), 'richDiff: removed table row kept as a real highlighted row, balanced')

  // New doc (before empty) → all additions; identical → plain render, no marks.
  const fresh = richDiffHtml('', '# New\n\nbody\n')
  ok(fresh.includes('rd-blk-ins') && !fresh.includes('rd-del'), 'richDiff: empty before → all additions (block tint), nothing removed')
  const same = richDiffHtml('# Same\n\nx\n', '# Same\n\nx\n')
  ok(!same.includes('rd-ins') && !same.includes('rd-del') && same.includes('<h1'), 'richDiff: identical content → plain render, no marks')

  // YAML frontmatter (top + mid) → rendered as a TABLE, not a setext <h2>; changes diff in the table.
  const fmBefore = `---\nstatus: DRAFT\nversion: v3\n---\n\n# Doc\n\nbody\n`
  const fmAfter = `---\nstatus: APPROVED\nversion: v4\n---\n\n# Doc\n\nbody\n`
  const fm = richDiffHtml(fmBefore, fmAfter)
  ok(fm.includes('<table') && tagBalance(fm), 'richDiff: frontmatter rendered as a table')
  ok(!/<h2[^>]*>status/.test(fm), 'richDiff: frontmatter NOT misparsed as a heading')
  ok(/<del class="rd-del">DRAFT<\/del>/.test(fm) && /<ins class="rd-ins">APPROVED<\/ins>/.test(fm), 'richDiff: frontmatter value change diffed in the table')
  // a '---' break followed by a real list is NOT treated as frontmatter
  const notFm = richDiffHtml('---\n\n- a\n- b\n', '---\n\n- a\n- b\n- c\n')
  ok(notFm.includes('<hr') && notFm.includes('<li'), 'richDiff: non-YAML --- stays a thematic break + list')

  // code fence → wrapped in VitePress language div (so its styling applies); mermaid is NOT wrapped
  const code = richDiffHtml('# H\n\n```json\n{"a":1}\n```\n', '# H\n\n```json\n{"a":2}\n```\n')
  ok(/<div class="language-json"><pre><code/.test(code), 'richDiff: code block wrapped in VitePress language div')
  const mmd = richDiffHtml('# H\n\n```mermaid\ngraph TD\nA-->B\n```\n', '# H\n\n```mermaid\ngraph TD\nA-->C\n```\n')
  ok(!mmd.includes('<div class="language-mermaid"') && /<code class="language-mermaid">/.test(mmd), 'richDiff: mermaid left as code (component renders the diagram)')

  const delCount = (h) => (h.match(/<del class="rd-del">/g) || []).length
  const insCount = (h) => (h.match(/<ins class="rd-ins">/g) || []).length
  // DENSE rewrite (changes bridged by ≤3 common words, ≥10 changed words) → collapse to ONE old + ONE new
  const dense = richDiffHtml(
    'the alpha and bravo or charlie then delta plus echo with foxtrot end\n',
    'the ALPHA and BRAVO or CHARLIE then DELTA plus ECHO with FOXTROT end\n'
  )
  ok(delCount(dense) === 1 && insCount(dense) === 1, 'richDiff: dense cluster collapses to one old + one new (no confetti)')
  ok(/<del class="rd-del">alpha and bravo or charlie/.test(dense), 'richDiff: collapsed old run is contiguous (reads as the old text)')
  ok(/<ins class="rd-ins">ALPHA and BRAVO or CHARLIE/.test(dense), 'richDiff: collapsed new run is contiguous (reads as the new text)')

  // SPARSE: two small changes far apart (separated by >3 common words) → stay separate inline marks
  const sparse = richDiffHtml(
    'change alpha here then many many many many common words remain and bravo there\n',
    'change ALPHA here then many many many many common words remain and BRAVO there\n'
  )
  ok(delCount(sparse) === 2 && insCount(sparse) === 2, 'richDiff: far-apart changes stay separate inline marks (not collapsed)')

  // a single small edit stays word-level (not collapsed)
  const small = richDiffHtml('hold time is 60 seconds total\n', 'hold time is 90 seconds total\n')
  ok(/<del class="rd-del">60<\/del>/.test(small) && /<ins class="rd-ins">90<\/ins>/.test(small), 'richDiff: small edit stays word-level')
}

function unit_resolveAndDetect() {
  const root = tmp('prism-resolve-')
  try {
    // detect2Layer
    const d2 = path.join(root, 'p2', 'docs')
    mkdirSync(path.join(d2, 'product'), { recursive: true })
    writeFileSync(path.join(d2, 'product', 'prd.md'), '# x\n', 'utf8')
    ok(detect2Layer(d2) === true, 'detect2Layer: phase folder with md → true')
    const dflat = path.join(root, 'flat', 'docs')
    mkdirSync(path.join(dflat, 'misc'), { recursive: true })
    writeFileSync(path.join(dflat, 'misc', 'x.md'), '# x\n', 'utf8')
    ok(detect2Layer(dflat) === false, 'detect2Layer: no phase folder → false')

    // findDocsDir walks up
    const deep = path.join(root, 'p2', 'a', 'b', 'c')
    mkdirSync(deep, { recursive: true })
    ok(findDocsDir(deep) === d2, 'findDocsDir: walks up to nearest docs/')
    ok(findDocsDir(path.join(root, 'flat')) === dflat, 'findDocsDir: finds docs/ in cwd')

    // resolveDocsArg: project root → docs/, or a docs dir directly
    ok(resolveDocsArg(path.join(root, 'p2'), root) === d2, 'resolveDocsArg: project root → docs/')
    ok(resolveDocsArg(d2, root) === d2, 'resolveDocsArg: docs dir as-is')

    // discoverDocsCandidates finds both nearby
    const cands = discoverDocsCandidates(path.join(root, 'p2'))
    ok(cands.includes(d2), 'discoverDocsCandidates: includes ancestor docs')

    // resolvePickedDir (folder-picker)
    ok(resolvePickedDir(path.join(root, 'p2')) === d2, 'resolvePickedDir: project root → docs/')
    ok(resolvePickedDir('/no/such/dir') === null, 'resolvePickedDir: missing → null')

    // listDir (in-page browser backend)
    const lst = listDir(path.join(root, 'p2'))
    ok(lst.hasDocs === true, 'listDir: p2 hasDocs')
    ok(lst.parent === root, 'listDir: parent is the project root')
    ok(lst.entries.some((e) => e.name === 'docs' && e.isDocs), 'listDir: lists the docs/ entry')
    ok(lst.entries.every((e) => e.name !== 'node_modules'), 'listDir: skips heavy/hidden dirs')

    // renderFolderPicker now embeds the interactive component
    const md = renderFolderPicker()
    ok(md.includes('Pick a docs folder'), 'picker: heading')
    ok(md.includes('<FolderBrowser'), 'picker: embeds the interactive FolderBrowser component')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

// ── 2. real-core e2e (python + workspace engine) ───────────────────────────────

function hasPython() {
  const r = spawnSync('python3', ['--version'], { stdio: 'ignore' })
  return !r.error && r.status === 0
}

// Replicate the engine's Approach-A fixtures (see prism/tests/_phase6_helpers.py).
function prismConfig(sprints) {
  const rows = sprints.map(([id, sealed]) => `  - id: ${id}\n    sealed: ${sealed}`).join('\n')
  return `# cfg\n\`\`\`yaml\nprism:\n  version: "1.0.0"\n\nsprints:\n${rows}\n\`\`\`\n`
}
function fm(extra) {
  return [
    '---',
    `status: ${extra.status}`,
    `version: v${extra.n}`,
    `sprint: ${extra.n}`,
    `phase: ${extra.phase}`,
    `sprint_id: sprint-v${extra.n}`,
    'created: 2026-05-18',
    'updated: 2026-05-18 10:00',
    `approved_by: ${extra.status === 'APPROVED' ? 'tester' : ''}`,
    ...(extra.pack ? [`change_pack: ${extra.pack}`] : []),
    'applied_to_living: false',
    '---',
    '',
  ].join('\n')
}
const proposal = (n, phase, status, body) => fm({ n, phase, status }) + body + '\n'
const delta = (n, phase, pack, status, body) => fm({ n, phase, status, pack }) + body + '\n'
const changeRequest = (status) => `---\nstatus: ${status}\n---\n# Change Request\n`

function e2e_realCore() {
  const prismCore = path.resolve(packageRoot, '..', 'prism', 'core')
  if (!existsSync(path.join(prismCore, 'tools', 'effective_truth.py'))) {
    console.log('[prism-test] skip real-core e2e: workspace prism/core not found (standalone install)')
    return
  }
  if (!hasPython()) {
    console.log('[prism-test] skip real-core e2e: python3 not available')
    return
  }

  const root = tmp('prism-e2e-')
  try {
    mkdirSync(path.join(root, '.prism'), { recursive: true })
    symlinkSync(prismCore, path.join(root, '.prism', 'core'), 'dir')

    const docs = path.join(root, 'docs')
    const files = {
      'prism-config.md': prismConfig([
        ['v1', 'true'],
        ['v2', 'false'],
      ]),
      // sealed base living truth
      'docs/product/prd.md': '# PRD\n\n<!-- ID: BR-001 -->\n### BR-001: base\nbody\n',
      'docs/architecture/architecture.md': '# Architecture\n\n<!-- ID: AD-001 -->\n### AD-001: base\nx\n',
      'docs/architecture/diagram.drawio': '<mxfile></mxfile>\n',
      // sealed sprint folder (skipped as a source, but present on disk → Sealed group)
      'docs/sprint-v1/product/proposals/prd-v1.md': proposal(1, 'product', 'APPROVED', '## New\n\n<!-- ID: BR-010 -->\n### BR-010: v1\nx'),
      // open sprint v2: APPROVED proposal + DRAFT change pack
      'docs/sprint-v2/product/proposals/prd-v2.md': proposal(2, 'product', 'APPROVED', '## New\n\n<!-- ID: BR-100 -->\n### BR-100: approved-v2\nx'),
      'docs/sprint-v2/changes/v2.1.0-fix/change-request.md': changeRequest('DRAFT'),
      'docs/sprint-v2/changes/v2.1.0-fix/product-delta-v2.1.0-fix.md': delta(2, 'product', 'v2.1.0-fix', 'DRAFT', '## New\n\n<!-- ID: BR-200 -->\n### BR-200: draft-v2-delta\nx'),
    }
    for (const [rel, content] of Object.entries(files)) {
      const abs = path.join(root, rel)
      mkdirSync(path.dirname(abs), { recursive: true })
      writeFileSync(abs, content, 'utf8')
    }

    const contentDir = path.join(root, '.docs-view', 'content')
    const tree = scanDocs(docs)
    mirror({ tree, docsDir: docs, contentDir })

    const state = { upTo: null, stage: 'base' }
    const r = injectPrismStructure({ cwd: root, docsDir: docs, contentDir, tree, interactive: true, state })
    ok(r.mode === 'composed', 'e2e: composed mode with the real engine')

    const prdRuntime = path.join(contentDir, 'product', 'prd.md')
    const basePrd = readFileSync(prdRuntime, 'utf8')
    ok(basePrd.includes('BR-001'), 'e2e: base shows sealed living truth')
    ok(!basePrd.includes('BR-100'), 'e2e: base excludes the open sprint (approved)')
    ok(readFileSync(path.join(docs, 'product', 'prd.md'), 'utf8').includes('BR-001') &&
      !readFileSync(path.join(docs, 'product', 'prd.md'), 'utf8').includes('BR-100'),
      'e2e: ./docs source UNTOUCHED by compose')

    // structure
    const titles = tree.children.map((c) => c.title)
    ok(titles[0] === 'Living Truth', 'e2e: Living Truth first')
    ok(titles[titles.length - 1] === 'Sealed / closed sprints', 'e2e: Sealed last')
    const living = tree.children[0]
    ok(living.children.map((c) => c.name).join(',') === 'product,architecture', 'e2e: phase order')
    ok(!!findChild(findChild(living, 'architecture'), 'diagram.drawio'), 'e2e: drawio asset kept')
    const sv2 = findChild(tree.children.find((c) => c.title === 'Draft sprints'), 'sprint-v2')
    ok(!!findChild(sv2, 'prism-merged'), 'e2e: per-sprint merged subfolder')

    // approved up to v2 → BR-100 in, BR-200 (draft) out
    recomposeLivingTruth({ cwd: root, contentDir, state: { upTo: 2, stage: 'approved' } })
    const approvedPrd = readFileSync(prdRuntime, 'utf8')
    ok(approvedPrd.includes('BR-100'), 'e2e: approved merge includes approved-v2')
    ok(!approvedPrd.includes('BR-200'), 'e2e: approved merge excludes the draft delta')

    // approved + drafts up to v2 → both
    recomposeLivingTruth({ cwd: root, contentDir, state: { upTo: 2, stage: 'drafts' } })
    const draftsPrd = readFileSync(prdRuntime, 'utf8')
    ok(draftsPrd.includes('BR-100') && draftsPrd.includes('BR-200'), 'e2e: drafts merge includes approved + draft')

    // picker embeds the lazy DiffBrowser; the engine per-source-diff (what /__prism-diff serves) shows the draft delta
    const pickerE2E = readFileSync(path.join(contentDir, 'prism-living-truth.md'), 'utf8')
    ok(pickerE2E.includes('<DiffBrowser'), 'e2e: picker embeds the DiffBrowser component')
    const diffRes = spawnSync(
      'python3',
      [path.join(prismCore, 'tools', 'effective_truth.py'), '--per-source-diff', '--phase', 'all', '--up-to-sprint', 'v2', '--with-drafts', '--project-root', root],
      { encoding: 'utf8' },
    )
    const diffJson = JSON.parse(diffRes.stdout)
    const draftEntry = diffJson.find((e) => e.status === 'DRAFT')
    ok(draftEntry && JSON.stringify(draftEntry.diffs).includes('BR-200'), 'e2e: engine per-source-diff shows the DRAFT delta (BR-200)')

    // --with-content: each changed doc carries full before/after markdown → feeds the rich rendered diff
    const wcRes = spawnSync(
      'python3',
      [path.join(prismCore, 'tools', 'effective_truth.py'), '--per-source-diff', '--with-content', '--phase', 'all', '--up-to-sprint', 'v2', '--with-drafts', '--project-root', root],
      { encoding: 'utf8' },
    )
    const wcJson = JSON.parse(wcRes.stdout)
    const wcDraft = wcJson.find((e) => e.status === 'DRAFT')
    const wcDiff = wcDraft && (wcDraft.diffs || []).find((d) => typeof d.after === 'string')
    ok(wcDiff && typeof wcDiff.before === 'string' && typeof wcDiff.after === 'string', 'e2e: --with-content adds before/after to each diff entry')
    ok(wcDiff && wcDiff.after.includes('BR-200') && !wcDiff.before.includes('BR-200'), 'e2e: --with-content after adds the draft, before omits it')
    // and the rich diff over that real before/after marks the new requirement inline, valid HTML
    const richHtml = richDiffHtml(wcDiff.before, wcDiff.after)
    ok(/rd-(ins|blk-ins|row-ins|li-ins)/.test(richHtml) && richHtml.includes('BR-200'), 'e2e: rich diff over real before/after marks the BR-200 addition')
    ok(tagBalance(richHtml), 'e2e: rich diff over real content stays balanced/valid HTML (no broken tags)')
    // default (no --with-content) stays lean — no before/after fields
    const leanDraft = diffJson.find((e) => e.status === 'DRAFT')
    ok((leanDraft.diffs || []).every((d) => d.before === undefined && d.after === undefined), 'e2e: default per-source-diff stays lean (no content)')

    // full runtime path: the /__prism-diff endpoint (handler → engine runner --with-content) serves
    // before/after so the DiffBrowser/DiffBlock rich view has real content end-to-end.
    let captured = null
    const attached = registerPrismEndpoints({ middlewares: { use: (h) => (captured = h) } }, { cwd: root, contentDir, state: { upTo: 2, stage: 'drafts' } })
    ok(attached && typeof captured === 'function', 'e2e: registerPrismEndpoints attached the handler')
    const resCap = { statusCode: 0, headers: {}, body: '', setHeader(k, v) { this.headers[k] = v }, end(s) { this.body = s } }
    captured({ url: DIFF_ENDPOINT }, resCap, () => {})
    const served = JSON.parse(resCap.body)
    const servedDiff = (served.find((e) => e.status === 'DRAFT')?.diffs || []).find((d) => typeof d.after === 'string')
    ok(resCap.statusCode === 200 && servedDiff && servedDiff.after.includes('BR-200'), 'e2e: /__prism-diff serves rich-diff before/after end-to-end')

    // per-sprint merged for v2 includes its own draft (independent of the global state)
    const mergedV2 = readFileSync(path.join(contentDir, 'sprint-v2', 'prism-merged', 'product', 'prd.md'), 'utf8')
    ok(mergedV2.includes('BR-100') && mergedV2.includes('BR-200'), 'e2e: per-sprint merged = approved + that sprint drafts')

    console.log('[prism-test] real-core e2e: ok')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

function e2e_realCorePresealV1() {
  const prismCore = path.resolve(packageRoot, '..', 'prism', 'core')
  if (!existsSync(path.join(prismCore, 'tools', 'effective_truth.py'))) {
    console.log('[prism-test] skip real-core preseal v1 e2e: workspace prism/core not found (standalone install)')
    return
  }
  if (!hasPython()) {
    console.log('[prism-test] skip real-core preseal v1 e2e: python3 not available')
    return
  }

  const root = tmp('prism-e2e-preseal-v1-')
  try {
    mkdirSync(path.join(root, '.prism'), { recursive: true })
    symlinkSync(prismCore, path.join(root, '.prism', 'core'), 'dir')

    const docs = path.join(root, 'docs')
    const files = {
      'prism-config.md': prismConfig([['v1', 'false']]),
      // No root docs/product/prd.md: sprint v1 has not sealed Living Truth yet.
      'docs/sprint-v1/product/proposals/prd-v1.md': proposal(
        1,
        'product',
        'DRAFT',
        '## New\n\n<!-- ID: BR-001 -->\n### BR-001: preseal draft proposal\nbody',
      ),
      'docs/sprint-v1/changes/v1.1.0-fix/change-request.md': changeRequest('DRAFT'),
      'docs/sprint-v1/changes/v1.1.0-fix/product-delta-v1.1.0-fix.md': delta(
        1,
        'product',
        'v1.1.0-fix',
        'DRAFT',
        '## New\n\n<!-- ID: BR-002 -->\n### BR-002: preseal draft change\nbody',
      ),
    }
    for (const [rel, content] of Object.entries(files)) {
      const abs = path.join(root, rel)
      mkdirSync(path.dirname(abs), { recursive: true })
      writeFileSync(abs, content, 'utf8')
    }

    const contentDir = path.join(root, '.docs-view', 'content')
    const tree = scanDocs(docs)
    mirror({ tree, docsDir: docs, contentDir })

    const state = { upTo: null, stage: 'base' }
    const r = injectPrismStructure({ cwd: root, docsDir: docs, contentDir, tree, interactive: true, state })
    ok(r.mode === 'composed', 'e2e preseal v1: composed mode without root Living Truth')

    const living = tree.children[0]
    ok(living.title === 'Living Truth' && living.indexLink === '/prism-living-truth', 'e2e preseal v1: Living Truth picker present')
    const product = findChild(living, 'product')
    ok(product && findChild(product, 'prd.md'), 'e2e preseal v1: PRD node seeded under Living Truth')

    const mergedV1 = readFileSync(path.join(contentDir, 'sprint-v1', 'prism-merged', 'product', 'prd.md'), 'utf8')
    ok(mergedV1.includes('BR-001') && mergedV1.includes('BR-002'), 'e2e preseal v1: merged view includes v1 proposal + change pack')
    ok(!existsSync(path.join(docs, 'product', 'prd.md')), 'e2e preseal v1: source root PRD still absent after merged preview')

    const prdRuntime = path.join(contentDir, 'product', 'prd.md')
    ok(readFileSync(prdRuntime, 'utf8').includes('no composed content'), 'e2e preseal v1: root PRD starts as placeholder')
    recomposeLivingTruth({ cwd: root, contentDir, state: { upTo: 1, stage: 'drafts' } })
    const draftsPrd = readFileSync(prdRuntime, 'utf8')
    ok(draftsPrd.includes('BR-001') && draftsPrd.includes('BR-002'), 'e2e preseal v1: Apply composes v1 drafts into root runtime PRD')
    recomposeLivingTruth({ cwd: root, contentDir, state: { upTo: null, stage: 'base' } })
    ok(readFileSync(prdRuntime, 'utf8').includes('no composed content'), 'e2e preseal v1: base selection restores placeholder instead of stale draft content')
    ok(!existsSync(path.join(docs, 'product', 'prd.md')), 'e2e preseal v1: Apply does not create source root PRD')

    console.log('[prism-test] real-core preseal v1 e2e: ok')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

// ── run ────────────────────────────────────────────────────────────────────────

unit_pureHelpers()
unit_fsLink()
unit_diffParse()
unit_netByDoc()
unit_richDiff()
await unit_nativeDialog()
unit_resolveAndDetect()
unit_transform()
unit_presealV1WithoutLivingTruth()
unit_rawMode()
unit_noneMode()
e2e_realCore()
e2e_realCorePresealV1()
console.log(`[prism-test] ok: ${passed} assertions`)
