import { readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { classify } from './file-types.js'

const IGNORED_NAMES = new Set([
  'node_modules',
  '.git',
  '.svn',
  '.hg',
  '.idea',
  '.vscode',
  '__pycache__',
  'dist',
  'build',
  'out',
  '.next',
  '.nuxt',
  '.cache',
  '.DS_Store',
])

function isIgnored(name) {
  if (name.startsWith('.')) return true
  if (name.startsWith('_')) return true
  if (IGNORED_NAMES.has(name)) return true
  return false
}

function titleFromName(name) {
  return name
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function alphanumCompare(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
}

/**
 * Walk a docs directory and produce a tree of renderable nodes.
 *
 * File node shape:
 *   { type: 'file', name, title, link, kind, viewer, srcAbs }
 *
 * Folder node shape:
 *   { type: 'folder', name, title, indexLink, children: [Node, ...] }
 *
 * `kind` is 'md' | 'view' | 'download'. For 'md' files, sidebar text uses
 * a humanized version of the basename. For non-MD files we keep the full
 * filename verbatim (so the user can tell what type of asset it is).
 *
 * `index.md` is surfaced as the parent folder's `indexLink` rather than as
 * a separate child — so the sidebar group title links to it and the root
 * index is not duplicated as its own sidebar entry.
 */
export function scanDocs(rootDir) {
  function walk(absDir, relDir) {
    const entries = readdirSync(absDir)
      .filter((n) => !isIgnored(n))
      .sort(alphanumCompare)

    const children = []
    let indexLink = null

    for (const name of entries) {
      const abs = path.join(absDir, name)
      const st = statSync(abs)
      if (st.isDirectory()) {
        const sub = walk(abs, path.posix.join(relDir, name))
        if (sub.children.length > 0 || sub.indexLink) {
          children.push({
            type: 'folder',
            name,
            title: titleFromName(name),
            indexLink: sub.indexLink,
            children: sub.children,
          })
        }
        continue
      }

      const cls = classify(name)
      if (!cls) continue

      if (cls.kind === 'md') {
        const base = name.slice(0, -cls.ext.length)
        const isIndex = base === 'index'
        const link = isIndex
          ? relDir === '/'
            ? '/'
            : relDir + '/'
          : (() => {
              const j = path.posix.join(relDir, base)
              return j.startsWith('/') ? j : '/' + j
            })()
        const node = {
          type: 'file',
          name, // keep full filename incl. .md so mirror creates a valid VitePress page
          title: titleFromName(isIndex ? path.basename(relDir) || 'Home' : base),
          link,
          kind: 'md',
          viewer: null,
          srcAbs: abs,
        }
        if (isIndex) {
          node.isIndex = true
          indexLink = link
        }
        children.push(node)
        continue
      }

      // Non-MD: viewer page or download page. The stub URL gets a `.view`
      // suffix so it doesn't collide with the raw asset URL.
      const assetUrl = path.posix.join(relDir, name)
      const link = (assetUrl.startsWith('/') ? assetUrl : '/' + assetUrl) + '.view'
      children.push({
        type: 'file',
        name,
        title: name,
        link,
        kind: cls.kind,
        viewer: cls.viewer,
        ext: cls.ext,
        srcAbs: abs,
      })
    }
    return { children, indexLink }
  }
  return walk(rootDir, '/')
}
