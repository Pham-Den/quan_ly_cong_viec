#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(scriptDir, '..')
const projectRoot = process.cwd()
const installRoot = path.resolve(
  process.env.DOCS_VIEW_INSTALL_ROOT || path.join(projectRoot, '.tools', 'docs-viewer-install'),
)
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const npmSpawnOptions = process.platform === 'win32' ? { shell: true } : {}
const gitignoreEntry = '.tools/docs-viewer-install/'

const HELP = `docs-view launcher

Usage:
  launch [path]            start dev server (default)
  launch dev [path]        start dev server
  launch build [path]      build static site to <project>/docs-dist

The launcher installs the bundled docs-viewer package into:
  .tools/docs-viewer-install/

It creates the install package.json/package-lock.json there and keeps node_modules
under .tools/docs-viewer-install/node_modules instead of the project root.

Options are passed through to docs-view:
  --port <n>  --host <h>  --open  --help
`

function fail(message) {
  throw new Error(message)
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch (err) {
    fail(`could not read ${file}: ${err.message}`)
  }
}

function assertNodeVersion() {
  const major = Number(process.versions.node.split('.')[0])
  if (!Number.isFinite(major) || major < 20) {
    fail(`Node.js 20 or newer is required (current: ${process.version})`)
  }
}

function assertNpmAvailable() {
  const result = spawnSync(npmCmd, ['--version'], { stdio: 'ignore', ...npmSpawnOptions })
  if (result.error) {
    if (result.error.code === 'ENOENT') {
      fail('npm was not found on PATH. Install Node.js 20+ with npm, then run the launcher again.')
    }
    fail(result.error.message)
  }
  if (result.status !== 0) fail('npm --version failed; check your Node.js/npm installation.')
}

function displayPath(file) {
  const rel = path.relative(projectRoot, file)
  if (rel && !rel.startsWith('..') && !path.isAbsolute(rel)) return rel
  return file
}

function fileDependencySpec(fromDir, toDir) {
  const rel = path.relative(fromDir, toDir)
  if (rel && !path.isAbsolute(rel)) {
    return `file:${rel.split(path.sep).join('/')}`
  }
  return pathToFileURL(toDir).href
}

function ensureInstallManifest(sourceManifest) {
  mkdirSync(installRoot, { recursive: true })
  const manifestPath = path.join(installRoot, 'package.json')
  const installManifest = {
    name: 'sdlc-framework-docs-viewer-install',
    private: true,
    description: 'Local install sandbox for the bundled SDLC Framework docs viewer.',
    dependencies: {
      [sourceManifest.name]: fileDependencySpec(installRoot, packageRoot),
    },
  }
  const desired = `${JSON.stringify(installManifest, null, 2)}\n`
  const current = existsSync(manifestPath) ? readFileSync(manifestPath, 'utf8') : null
  if (current !== desired) writeFileSync(manifestPath, desired, 'utf8')
}

function ensureProjectGitignore() {
  const gitignorePath = path.join(projectRoot, '.gitignore')
  if (!existsSync(gitignorePath)) return
  const content = readFileSync(gitignorePath, 'utf8')
  const lines = content.split('\n').map((line) => line.trim())
  if (lines.includes(gitignoreEntry) || lines.includes(gitignoreEntry.replace(/\/$/, ''))) return
  const sep = content.length === 0 || content.endsWith('\n') ? '' : '\n'
  appendFileSync(
    gitignorePath,
    `${sep}\n# docs-view launcher (auto-added)\n${gitignoreEntry}\n`,
    'utf8',
  )
  console.log(`[docs-view launcher] added to .gitignore: ${gitignoreEntry}`)
}

function runNpm(args, purpose, cwd = projectRoot) {
  const result = spawnSync(npmCmd, args, {
    cwd,
    stdio: 'inherit',
    ...npmSpawnOptions,
  })
  if (result.error) {
    if (result.error.code === 'ENOENT') {
      fail('npm was not found on PATH. Install Node.js 20+ with npm, then run the launcher again.')
    }
    fail(result.error.message)
  }
  if (result.signal) {
    const code = result.signal === 'SIGINT' ? 130 : 1
    process.exit(code)
  }
  if (result.status !== 0) {
    fail(`${purpose} failed with exit code ${result.status}`)
  }
}

function installedPackageDir(packageName) {
  return path.join(installRoot, 'node_modules', ...packageName.split('/'))
}

function docsViewBin(sourceManifest) {
  const bin = sourceManifest.bin
  let binRel = null
  if (typeof bin === 'string') {
    binRel = bin
  } else if (bin && typeof bin === 'object') {
    binRel = bin['docs-view'] || Object.values(bin)[0]
  }
  if (!binRel) fail(`docs-viewer package.json is missing a runnable "bin" entry`)
  return path.join(installedPackageDir(sourceManifest.name), binRel)
}

function runDocsView(sourceManifest, argv) {
  const binPath = docsViewBin(sourceManifest)
  if (!existsSync(binPath)) {
    fail(`installed docs-view binary was not found at ${binPath}`)
  }
  const result = spawnSync(process.execPath, [binPath, ...argv], {
    cwd: projectRoot,
    stdio: 'inherit',
  })
  if (result.error) fail(result.error.message)
  if (result.signal) {
    const code = result.signal === 'SIGINT' ? 130 : 1
    process.exit(code)
  }
  if (result.status !== 0) fail(`docs-view failed with exit code ${result.status}`)
}

function main(argv) {
  if (argv.includes('--launcher-help')) {
    console.log(HELP)
    return
  }

  const sourceManifestPath = path.join(packageRoot, 'package.json')
  if (!existsSync(sourceManifestPath)) {
    fail(`could not find docs-viewer package.json at ${sourceManifestPath}`)
  }
  const sourceManifest = readJson(sourceManifestPath)
  if (!sourceManifest.name) fail(`docs-viewer package.json is missing "name"`)

  assertNodeVersion()
  assertNpmAvailable()
  ensureInstallManifest(sourceManifest)
  ensureProjectGitignore()

  console.log(`[docs-view launcher] install root: ${displayPath(installRoot)}`)
  runNpm(
    ['install', '--install-links', '--no-audit', '--fund=false'],
    'npm install',
    installRoot,
  )
  runDocsView(sourceManifest, argv)
}

try {
  main(process.argv.slice(2))
} catch (err) {
  console.error(`[docs-view launcher] error: ${err.message}`)
  if (process.env.DOCS_VIEW_DEBUG) console.error(err.stack)
  process.exit(1)
}
