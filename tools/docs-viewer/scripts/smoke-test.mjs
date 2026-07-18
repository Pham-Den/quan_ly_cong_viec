import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  registerPrismEndpoints,
  REFRESH_ENDPOINT,
  COMPOSE_ENDPOINT,
  EXPORT_ENDPOINT,
} from '../src/prism-preview.js'
import { makeZip } from '../src/zip.js'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(scriptDir, '..')
const cliPath = path.join(packageRoot, 'bin', 'docs-view.js')

function fail(message) {
  throw new Error(`[docs-view smoke] ${message}`)
}

function expectFile(file) {
  if (!existsSync(file)) fail(`missing expected file: ${file}`)
}

function writeFixture(projectRoot) {
  const docsDir = path.join(projectRoot, 'docs')
  const archDir = path.join(docsDir, 'arch')
  mkdirSync(archDir, { recursive: true })

  writeFileSync(path.join(projectRoot, '.gitignore'), '# project ignores\n', 'utf8')
  writeFileSync(
    path.join(docsDir, 'index.md'),
    [
      '# Smoke Docs',
      '',
      'This page exercises markdown, inline Mermaid, and an inline image.',
      '',
      '```mermaid',
      'graph TD',
      '  A[Start] --> B[Docs Viewer]',
      '```',
      '',
      '![Logo](./logo.svg)',
      '',
    ].join('\n'),
    'utf8',
  )
  writeFileSync(path.join(archDir, 'index.md'), '# Architecture\n', 'utf8')
  writeFileSync(
    path.join(archDir, 'flow.mmd'),
    ['sequenceDiagram', '  participant A', '  participant B', '  A->>B: hello', ''].join('\n'),
    'utf8',
  )
  writeFileSync(
    path.join(archDir, 'sample.drawio'),
    '<mxfile><diagram name="Page-1">test</diagram></mxfile>\n',
    'utf8',
  )
  writeFileSync(
    path.join(archDir, 'diagram.puml'),
    '@startuml\nAlice -> Bob: hello\n@enduml\n',
    'utf8',
  )
  writeFileSync(path.join(docsDir, 'data.csv'), 'name,count\nalpha,1\nbeta,2\n', 'utf8')
  writeFileSync(
    path.join(docsDir, 'logo.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="40"><rect width="80" height="40" fill="#2f6feb"/><text x="8" y="25" fill="white">DV</text></svg>',
    'utf8',
  )
  writeFileSync(
    path.join(docsDir, 'sample.pdf'),
    '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n',
    'utf8',
  )
  writeFileSync(path.join(docsDir, 'handoff.docx'), 'download placeholder', 'utf8')
}

function runCliBuild(projectRoot) {
  const result = spawnSync(process.execPath, [cliPath, 'build'], {
    cwd: projectRoot,
    stdio: 'inherit',
    // Pin the runtime into the project so the in-project runtime assertions below hold. By default
    // the runtime lives under the OS temp dir (out of the project) — that path is exercised live.
    env: { ...process.env, CI: '1', DOCS_VIEW_RUNTIME_DIR: path.join(projectRoot, '.docs-view') },
  })
  if (result.error) fail(result.error.message)
  if (result.status !== 0) fail(`build exited with status ${result.status}`)
}

function verify(projectRoot) {
  const dist = path.join(projectRoot, 'docs-dist')
  const runtime = path.join(projectRoot, '.docs-view', 'content')

  for (const rel of [
    'index.html',
    'arch/index.html',
    'arch/flow.mmd',
    'arch/flow.mmd.view.html',
    'arch/sample.drawio',
    'arch/sample.drawio.view.html',
    'arch/diagram.puml',
    'arch/diagram.puml.view.html',
    'data.csv',
    'data.csv.view.html',
    'logo.svg',
    'logo.svg.view.html',
    'sample.pdf',
    'sample.pdf.view.html',
    'handoff.docx',
    'handoff.docx.view.html',
  ]) {
    expectFile(path.join(dist, rel))
  }

  for (const rel of [
    'arch/flow.mmd.view.md',
    'arch/sample.drawio.view.md',
    'arch/diagram.puml.view.md',
    'data.csv.view.md',
    'logo.svg.view.md',
    'sample.pdf.view.md',
    'handoff.docx.view.md',
  ]) {
    expectFile(path.join(runtime, rel))
  }

  if (existsSync(path.join(projectRoot, 'docs', 'data.csv.view.md'))) {
    fail('generated viewer stub leaked into ./docs')
  }

  // The PRISM structured view is inert for a non-PRISM project (no prism-config.md / .prism).
  if (existsSync(path.join(runtime, 'prism-living-truth.md'))) {
    fail('PRISM structured view was generated for a non-PRISM project')
  }

  const gitignore = readFileSync(path.join(projectRoot, '.gitignore'), 'utf8')
  if (!gitignore.includes('.docs-view/') || !gitignore.includes('docs-dist/')) {
    fail('runtime output entries were not added to .gitignore')
  }
}

/**
 * Node-only checks for the PRISM dev-endpoint wiring + the zip writer. No Python / PRISM core
 * needed — covers the connect registration + routing + a valid zip. The tree transform, picker
 * markup, source-safety, and real composition are covered by scripts/prism-test.mjs.
 */
function verifyPrismEndpoints() {
  for (const [name, value] of [['REFRESH', REFRESH_ENDPOINT], ['COMPOSE', COMPOSE_ENDPOINT], ['EXPORT', EXPORT_ENDPOINT]]) {
    if (!value || !value.startsWith('/__prism-')) fail(`bad ${name} endpoint: ${value}`)
  }

  // The dispatcher is prepended onto the connect stack so Vite's SPA fallback can't swallow it.
  const fakeServer = { middlewares: { stack: [{ route: '', handle() {} }] } }
  if (!registerPrismEndpoints(fakeServer, { cwd: '/x', contentDir: '/y', state: { upTo: null, stage: 'base' } })) {
    fail('registerPrismEndpoints returned false')
  }
  const stack = fakeServer.middlewares.stack
  if (stack.length !== 2 || stack[0].route !== '') fail('endpoints not prepended onto the connect stack')

  // The dispatcher passes unrelated URLs through to next() (and leaves the response alone).
  let nexted = false
  const res = {}
  stack[0].handle({ url: '/something-else' }, res, () => { nexted = true })
  if (!nexted) fail('endpoint dispatcher did not call next() for an unrelated URL')
  if (Object.keys(res).length !== 0) fail('endpoint dispatcher touched the response for an unrelated URL')

  // The export zip writer produces a non-empty, signature-valid archive (PK\x03\x04).
  const zip = makeZip([{ name: 'product.md', data: '# Product\n' }, { name: 'design.md', data: '# Design\n' }])
  if (!Buffer.isBuffer(zip) || zip.length < 100) fail('makeZip produced no/short archive')
  if (zip[0] !== 0x50 || zip[1] !== 0x4b || zip[2] !== 0x03 || zip[3] !== 0x04) fail('zip missing PK local-file signature')
}

function verifyLauncherWindowsNpmSpawnContract() {
  const launcher = readFileSync(path.join(packageRoot, 'scripts', 'launch.mjs'), 'utf8')
  if (!launcher.includes("const npmSpawnOptions = process.platform === 'win32' ? { shell: true } : {}")) {
    fail('launcher must run npm through a shell on Windows so npm.cmd can execute')
  }
  if (!launcher.includes("stdio: 'ignore', ...npmSpawnOptions")) {
    fail('launcher npm availability check does not use npmSpawnOptions')
  }
  if (!launcher.includes('function runNpm(args, purpose, cwd = projectRoot)')) {
    fail('launcher npm install helper must allow the install sandbox as cwd')
  }
  if (!launcher.includes("cwd,\n    stdio: 'inherit',\n    ...npmSpawnOptions")) {
    fail('launcher npm install does not use npmSpawnOptions with the selected cwd')
  }
}

const projectRoot = mkdtempSync(path.join(os.tmpdir(), 'docs-viewer-smoke-'))

try {
  writeFixture(projectRoot)
  runCliBuild(projectRoot)
  verify(projectRoot)
  verifyPrismEndpoints()
  verifyLauncherWindowsNpmSpawnContract()
  console.log(`[docs-view smoke] ok: ${projectRoot}`)
} finally {
  if (process.env.DOCS_VIEW_KEEP_SMOKE === '1') {
    console.log(`[docs-view smoke] kept fixture: ${projectRoot}`)
  } else {
    rmSync(projectRoot, { recursive: true, force: true })
  }
}
