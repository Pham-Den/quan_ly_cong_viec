import { existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

/**
 * Locate the docs/ folder to serve, and discover candidates for the in-browser picker.
 *
 * Resolution order (CLI):
 *   1. an explicit path argument (`docs-view dev <path>`) — used verbatim,
 *   2. else walk UP from the start dir to the first ancestor that has a `docs/` folder,
 *   3. else null → dev mode shows the browser folder-picker.
 *
 * The "project root" of a resolved docs dir is its parent (`dirname(docsDir)`) — that is where
 * `prism-config.md` / `.prism/` live and where the `.docs-view/` runtime + `docs-dist/` go.
 */

function isDir(p) {
  try {
    return statSync(p).isDirectory()
  } catch {
    return false
  }
}

/** Resolve an explicit `<path>` arg: accept either a docs dir directly or a project root with docs/. */
export function resolveDocsArg(argPath, fromDir) {
  const abs = path.resolve(fromDir, argPath)
  if (!isDir(abs)) throw new Error(`path not found or not a directory: ${abs}`)
  // If they pointed at a project root that contains docs/, prefer the docs/ subfolder.
  if (path.basename(abs) !== 'docs' && isDir(path.join(abs, 'docs'))) return path.join(abs, 'docs')
  return abs
}

/** Walk up from `startDir` to the nearest ancestor containing a `docs/` folder; null if none. */
export function findDocsDir(startDir) {
  let dir = path.resolve(startDir)
  while (true) {
    const candidate = path.join(dir, 'docs')
    if (isDir(candidate)) return candidate
    const parent = path.dirname(dir)
    if (parent === dir) return null // filesystem root
    dir = parent
  }
}

/**
 * Discover `docs/` folders near `startDir` for the picker page, without scanning the whole disk:
 *   - every ancestor's `docs/` (walking up),
 *   - `docs/` one or two directory levels below `startDir` (e.g. sibling projects),
 * deduped, existing dirs only, capped. Hidden / heavy folders (node_modules, .git, dist…) skipped.
 */
export function discoverDocsCandidates(startDir, { maxBelowDepth = 2, limit = 40 } = {}) {
  const found = new Set()
  const start = path.resolve(startDir)

  // Up the tree.
  let dir = start
  while (true) {
    const c = path.join(dir, 'docs')
    if (isDir(c)) found.add(c)
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }

  // Down a couple of levels (siblings / nested projects).
  const SKIP = new Set(['node_modules', '.git', 'dist', 'build', 'out', '.cache', '.docs-view', '.next', '.nuxt'])
  function descend(base, depth) {
    if (depth > maxBelowDepth || found.size >= limit) return
    let entries
    try {
      entries = readdirSync(base)
    } catch {
      return
    }
    for (const name of entries) {
      if (name.startsWith('.') || SKIP.has(name)) continue
      const sub = path.join(base, name)
      if (!isDir(sub)) continue
      if (name === 'docs') found.add(sub)
      else descend(sub, depth + 1)
    }
  }
  descend(start, 1)

  return [...found].slice(0, limit)
}
