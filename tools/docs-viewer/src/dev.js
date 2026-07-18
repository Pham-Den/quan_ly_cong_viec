import path from 'node:path'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { scanDocs } from './scan.js'
import { mirror } from './mirror.js'
import { buildVitePressConfig } from './config-builder.js'
import { prepareRuntime, writeRuntimeConfig } from './runtime.js'
import {
  injectPrismStructure,
  recomposeLivingTruth,
  watchPrismPreview,
  registerPrismEndpoints,
} from './prism-preview.js'
import { discoverDocsCandidates } from './resolve-docs.js'
import { writeFolderPickerContent, registerPickEndpoints } from './folder-picker.js'
import { copyMode } from './fs-link.js'

/**
 * Dev server. The runtime (.docs-view) is prepared ONCE in `cwd`; switching the docs folder (via
 * the in-browser picker) only rebuilds `content/` + the config and re-serves on the same port —
 * the server is torn down and recreated so the custom endpoints are re-registered cleanly (Vite's
 * own config-watch restart would not re-run our endpoint wiring).
 *
 * `docsDir` may be null → the folder picker is served until the user chooses one.
 */
export async function startDev({ cwd, docsDir, port, host, open }) {
  const { runtimeRoot, vpDir, contentDir } = prepareRuntime({ cwd })
  console.log(`[docs-view] runtime (outside your project): ${runtimeRoot}`)
  if (copyMode()) {
    // On Windows we copy (not symlink) source files, so raw pages are snapshots. PRISM Living Truth
    // still live-updates (the watcher recomposes real files); editing other raw docs needs a restart.
    console.log('[docs-view] copy mode (Windows): raw docs are snapshots — restart to pick up edits to non-PRISM files')
  }
  const state = { upTo: null, stage: 'base' }

  let server = null
  let watcher = null
  let mode = 'none'
  let active = docsDir || null
  let opened = false
  let generation = 0 // bumped after each (re-)serve; the picker polls /__docs-ready for the increase

  function resetContent() {
    rmSync(contentDir, { recursive: true, force: true })
    mkdirSync(contentDir, { recursive: true })
  }

  // (Re)populate content/ + config for `dir` (null → folder picker). Returns the view mode.
  function buildContent(dir) {
    resetContent()
    if (!dir) {
      writeFolderPickerContent(contentDir)
      writeRuntimeConfig({
        vpDir,
        config: buildVitePressConfig({ srcDir: contentDir, tree: { children: [], indexLink: '/' }, title: 'Pick a docs folder' }),
      })
      return 'pick'
    }
    const projectRoot = path.dirname(dir)
    const tree = scanDocs(dir)
    mirror({ tree, docsDir: dir, contentDir })
    const { mode: m } = injectPrismStructure({ cwd: projectRoot, docsDir: dir, contentDir, tree, interactive: true, state })
    if (m === 'none') addBrowserViewNotice(contentDir, tree)
    ensureHome(contentDir, m, projectRoot)
    writeRuntimeConfig({
      vpDir,
      config: buildVitePressConfig({ srcDir: contentDir, tree, title: path.basename(projectRoot) || 'Docs' }),
    })
    return m
  }

  async function serve(dir) {
    // Build the new content/config BEFORE tearing down the old server, so a failure here leaves the
    // current server intact rather than killing the page.
    mode = buildContent(dir)
    active = dir || null

    if (watcher) {
      watcher.close()
      watcher = null
    }
    if (server) {
      const old = server
      server = null
      // Free the port NOW: stop the listening socket + force-close keep-alive connections. We do NOT
      // await Vite's graceful close() — it can hang on in-flight work (dep optimization etc.) and that
      // would block the re-serve. Let its cleanup run detached.
      try {
        old.httpServer?.closeAllConnections?.()
        old.httpServer?.close?.()
      } catch {
        /* ignore */
      }
      Promise.resolve()
        .then(() => old.close?.())
        .catch(() => {})
    }

    const { createServer } = await import('vitepress')
    // Re-bind on the same port; retry briefly in case the socket hasn't been released yet.
    for (let attempt = 0; ; attempt++) {
      let s
      try {
        s = await createServer(runtimeRoot, { port, host, open: open && !opened })
        await s.listen()
        server = s
        break
      } catch (err) {
        try {
          s?.close?.()
        } catch {
          /* ignore */
        }
        if (attempt >= 15) throw err
        await new Promise((r) => setTimeout(r, 150))
      }
    }
    opened = true
    generation++ // the new server is now listening — readiness token advances

    // The folder picker is always wired so the user can re-point at any time.
    registerPickEndpoints(server, {
      cwd,
      candidates: discoverDocsCandidates(cwd),
      getGen: () => generation,
      onPick: (chosen) =>
        serve(chosen).catch((e) => console.error(`[docs-view] re-point failed: ${e && e.stack ? e.stack : e}`)),
    })

    if (mode === 'composed') {
      const projectRoot = path.dirname(active)
      registerPrismEndpoints(server, { cwd: projectRoot, contentDir, state })
      watcher = watchPrismPreview({ cwd: projectRoot, contentDir, state })
      if (!watcher) recomposeLivingTruth({ cwd: projectRoot, contentDir, state, manualRefresh: true })
    }

    server.printUrls()
    if (mode === 'pick') console.log('[docs-view] no docs/ found — open the URL above to pick a folder')
  }

  await serve(docsDir)
}

/**
 * Guarantee the site has a home at `/`: many docs folders have no root `index.md`, which would make
 * `/` a 404 (especially right after re-pointing the picker). If none was mirrored in, generate a
 * minimal landing page so `/` always loads and the sidebar is usable.
 */
function ensureHome(contentDir, mode, projectRoot) {
  const home = path.join(contentDir, 'index.md')
  if (existsSync(home)) return // the project already has a docs/index.md (mirrored in)
  const name = path.basename(projectRoot) || 'Docs'
  const lt = mode === 'composed' ? '\n\nStart at **[Living Truth](/prism-living-truth)**, or browse the sidebar.' : ''
  writeFileSync(home, `# ${name}\n\n_Browse the docs using the sidebar._${lt}\n`, 'utf8')
}

/**
 * For a docs folder WITHOUT the 2-layer phase structure, surface a small "browser view" note as the
 * first sidebar entry so the user sees why the Living Truth view is absent (the user asked for this).
 */
function addBrowserViewNotice(contentDir, tree) {
  const md =
    '# Browser view\n\n' +
    '> No 2-layer phase structure (e.g. `docs/product/…`, `docs/architecture/…`) was found, so these ' +
    'docs are shown as a plain file browser — markdown / mermaid / draw.io / html / pdf / images all render normally.\n'
  writeFileSync(path.join(contentDir, 'view-mode.md'), md, 'utf8')
  tree.children.unshift({
    type: 'file',
    name: 'view-mode.md',
    title: 'ℹ Browser view',
    link: '/view-mode',
    kind: 'md',
    viewer: null,
    srcAbs: path.join(contentDir, 'view-mode.md'),
  })
}
