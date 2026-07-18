import path from 'node:path'
import { copyFileSync, mkdirSync } from 'node:fs'
import { scanDocs } from './scan.js'
import { mirror } from './mirror.js'
import { buildVitePressConfig } from './config-builder.js'
import { prepareRuntime, writeRuntimeConfig } from './runtime.js'
import { injectPrismStructure } from './prism-preview.js'

/**
 * VitePress only emits assets it sees through markdown-it
 * (e.g. `![](path.png)` inline references). Symlinked standalone files in
 * srcDir — drawio, pdf, csv, docx, plus any image not referenced from MD —
 * are dropped. The viewer stubs `fetch()` these by URL at runtime, so they
 * must exist in the final dist. We copy them ourselves once VitePress is done.
 *
 * Asset dst is derived from the source's ORIGINAL ./docs-relative path (`srcAbs` vs `docsDir`),
 * NOT the tree nesting — the PRISM transform regroups nodes under virtual folders (Living Truth,
 * Draft sprints…) while the stub URLs + runtime symlinks stay at the original paths.
 */
function copyRawAssets({ tree, outDir, docsDir }) {
  function walk(nodes) {
    for (const node of nodes) {
      if (node.children) walk(node.children)
      if (node.type !== 'file' || node.kind === 'md') continue
      const rel = path.relative(docsDir, node.srcAbs)
      // generated (non-docs) assets — none today, but guard against escaping outDir
      if (rel.startsWith('..') || path.isAbsolute(rel)) continue
      const dst = path.join(outDir, rel)
      mkdirSync(path.dirname(dst), { recursive: true })
      copyFileSync(node.srcAbs, dst)
    }
  }
  walk(tree.children)
}

export async function runBuild({ cwd, docsDir }) {
  const projectRoot = path.dirname(docsDir)
  const { runtimeRoot, vpDir, contentDir } = prepareRuntime({ cwd })
  const tree = scanDocs(docsDir)
  mirror({ tree, docsDir, contentDir })

  // Optional PRISM structured view: 2-layer + engine → composed (static snapshot, picker inert);
  // 2-layer no engine → raw Living Truth layout; otherwise the plain browser tree. Mutates tree.
  injectPrismStructure({ cwd: projectRoot, docsDir, contentDir, tree })

  const title = path.basename(projectRoot) || 'Docs'
  const outDir = path.join(projectRoot, 'docs-dist')
  const config = buildVitePressConfig({ srcDir: contentDir, tree, title })
  config.outDir = outDir
  writeRuntimeConfig({ vpDir, config })

  const { build } = await import('vitepress')
  await build(runtimeRoot)

  copyRawAssets({ tree, outDir, docsDir })

  console.log(`[docs-view] build complete → ${outDir}`)
}
