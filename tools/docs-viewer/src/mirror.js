import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { makeStub } from './stubs.js'
import { linkFile } from './fs-link.js'

/**
 * Mirror the user's ./docs into <runtime>/content/, one entry at a time.
 *
 *  - For directories, we create a real (empty) directory and recurse.
 *  - For .md files, we symlink the user's file into content/<relpath>.
 *  - For viewable / downloadable assets, we
 *      (a) symlink the raw asset into content/<relpath>, so Vite can
 *          serve it as a static resource fetchable from <relpath>;
 *      (b) generate a real stub markdown file at content/<relpath>.view.md,
 *          which VitePress renders as the viewer page.
 *
 * Doing per-file symlinks (instead of one big directory symlink) lets us
 * add stub markdown files alongside the user's content without touching
 * the user's own ./docs folder.
 */
export function mirror({ tree, docsDir, contentDir }) {
  mkdirSync(contentDir, { recursive: true })

  function walk(nodes, dstDir) {
    for (const node of nodes) {
      if (node.type === 'folder') {
        const sub = path.join(dstDir, node.name)
        mkdirSync(sub, { recursive: true })
        walk(node.children, sub)
        continue
      }
      const dst = path.join(dstDir, node.name)
      linkFile(node.srcAbs, dst) // symlink on POSIX, copy on Windows

      if (node.kind === 'md') continue

      // Generate stub viewer page next to the raw symlink.
      const relFromContent = path.relative(contentDir, dst).split(path.sep).join('/')
      const assetUrl = path.posix.join('/', relFromContent)
      const stub = makeStub({
        kind: node.kind,
        viewer: node.viewer,
        assetUrl,
        title: node.name,
        srcAbs: node.srcAbs,
      })
      writeFileSync(dst + '.view.md', stub, 'utf8')
    }
  }

  walk(tree.children, contentDir)
}
