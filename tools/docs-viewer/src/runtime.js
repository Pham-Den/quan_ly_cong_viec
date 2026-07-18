import { mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { serializeConfig } from './config-builder.js'
import { linkDir } from './fs-link.js'

/**
 * OS-appropriate per-user cache base, so docs-view never writes into the project's working tree
 * (no `.docs-view/` polluting the repo / AI context) yet stays in a conventional, stable place:
 *   - Windows: %LOCALAPPDATA% (then %APPDATA%)
 *   - macOS:   ~/Library/Caches
 *   - Linux/other: $XDG_CACHE_HOME, else ~/.cache
 * Falls back to the OS temp dir when none resolve.
 */
function cacheBase() {
  const home = os.homedir()
  if (process.platform === 'win32') return process.env.LOCALAPPDATA || process.env.APPDATA || os.tmpdir()
  if (process.platform === 'darwin') return home ? path.join(home, 'Library', 'Caches') : os.tmpdir()
  return process.env.XDG_CACHE_HOME || (home ? path.join(home, '.cache') : os.tmpdir())
}

/**
 * The runtime directory — OUTSIDE the project, but named PER PROJECT so it's identifiable + isolated:
 * `<cacheBase>/docs-view/<project-name>-<short-hash-of-path>/`. The readable name ties it to the
 * project; the hash disambiguates same-named projects. It still reads the project's `./docs` via
 * absolute symlinks + the engine via `--project-root`, so content is always current.
 *
 * Override the whole location with `DOCS_VIEW_RUNTIME_DIR` (tests, or to pin it — e.g. inside the
 * project if you actually want that).
 */
function runtimeRootFor(cwd) {
  if (process.env.DOCS_VIEW_RUNTIME_DIR) return path.resolve(process.env.DOCS_VIEW_RUNTIME_DIR)
  const abs = path.resolve(cwd)
  const hash = createHash('sha1').update(abs).digest('hex').slice(0, 8)
  const name = (path.basename(abs) || 'project').replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 40)
  return path.join(cacheBase(), 'docs-view', `${name}-${hash}`)
}

/**
 * Locate the node_modules directory that contains docs-viewer's own deps
 * (vitepress, vue, mermaid, papaparse). Walks up from this source file
 * looking for a node_modules folder that contains vitepress — handles both:
 *   - direct invocation: docs-viewer/node_modules/vitepress
 *   - npm flatten:       <parent>/node_modules/{docs-viewer,vitepress}
 *   - launcher install:  project/.tools/docs-viewer-install/node_modules/vitepress
 */
function findDepsRoot() {
  const here = path.dirname(fileURLToPath(import.meta.url))
  let dir = here
  while (dir !== path.dirname(dir)) {
    const nm = path.join(dir, 'node_modules')
    if (existsSync(path.join(nm, 'vitepress'))) return nm
    dir = path.dirname(dir)
  }

  const resolved = [
    resolveDepsRootFrom(import.meta.url),
    resolveDepsRootFrom(path.join(process.cwd(), 'docs-viewer-deps-probe.cjs')),
    process.argv[1] ? resolveDepsRootFrom(path.resolve(process.argv[1])) : null,
  ].find(Boolean)
  if (resolved) return resolved

  return null
}

function resolveDepsRootFrom(baseFile) {
  try {
    const require = createRequire(baseFile)
    return nodeModulesRootFor(require.resolve('vitepress/package.json'))
  } catch {
    return null
  }
}

function nodeModulesRootFor(packageJsonPath) {
  let dir = path.dirname(packageJsonPath)
  while (dir !== path.dirname(dir)) {
    if (path.basename(dir) === 'vitepress' && path.basename(path.dirname(dir)) === 'node_modules') {
      return path.dirname(dir)
    }
    dir = path.dirname(dir)
  }
  return null
}

/**
 * Locate docs-viewer's theme/ directory (sibling of src/).
 */
function findThemeDir() {
  const here = path.dirname(fileURLToPath(import.meta.url))
  return path.resolve(here, '..', 'theme')
}

/**
 * The "shadow runtime" (see `runtimeRootFor` — by default under the OS temp dir, OUT of the user's
 * project) contains everything VitePress needs to render the user's docs without ever modifying or
 * even sitting inside ./docs / the project tree.
 *
*   <runtimeRoot>/
 *     content/                  # real dir, populated by mirror.js
 *       <relpath>.md            # POSIX: symlink to user's .md (reads latest); Windows: a copy
 *       <relpath>.<ext>         # POSIX: symlink to non-MD asset;            Windows: a copy
 *       <relpath>.<ext>.view.md # generated stub (renders the viewer page)
 *     .vitepress/
 *       config.mjs              # generated each run
 *       theme/                  # symlink (POSIX) / junction (Windows) to docs-viewer/theme/
 *     node_modules/             # symlink (POSIX) / junction (Windows) to docs-viewer/node_modules/
 *
 * The whole runtime is recreated from scratch each invocation, so there is
 * no stale state to worry about. (See src/fs-link.js for the POSIX/Windows linking strategy.)
 */
export function prepareRuntime({ cwd }) {
  const runtimeRoot = runtimeRootFor(cwd)
  const vpDir = path.join(runtimeRoot, '.vitepress')
  const contentDir = path.join(runtimeRoot, 'content')
  const themeLink = path.join(vpDir, 'theme')
  const nmLink = path.join(runtimeRoot, 'node_modules')

  if (existsSync(runtimeRoot)) {
    rmSync(runtimeRoot, { recursive: true, force: true })
  }
  mkdirSync(vpDir, { recursive: true })
  mkdirSync(contentDir, { recursive: true })

  const depsRoot = findDepsRoot()
  if (!depsRoot) {
    throw new Error(
      'cannot locate vitepress in node_modules. Run the docs-viewer launcher, or run `npm install` inside docs-viewer/ for source development.',
    )
  }
  linkDir(depsRoot, nmLink) // symlink on POSIX, junction on Windows

  const themeDir = findThemeDir()
  if (existsSync(themeDir)) {
    linkDir(themeDir, themeLink)
  }

  return { runtimeRoot, vpDir, contentDir }
}

export function writeRuntimeConfig({ vpDir, config }) {
  writeFileSync(path.join(vpDir, 'config.mjs'), serializeConfig(config), 'utf8')
}
