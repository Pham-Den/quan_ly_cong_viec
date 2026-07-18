import { execFile } from 'node:child_process'
import { existsSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'

/**
 * The "no docs/ found" fallback: an interactive in-browser folder chooser (the <FolderBrowser>
 * theme component) plus the dev endpoints it talks to. Two ways to pick, no path-pasting:
 *   - browse the server's filesystem in the page (list dirs → click in/out → Open), and
 *   - "Browse with your OS" — the dev server (running locally) opens the native folder dialog.
 * VitePress can't be re-pointed at an arbitrary folder live, so picking tears the server down and
 * re-serves the chosen folder on the same port (see dev.js); the page reloads when that is ready.
 */

export const PICK_ENDPOINT = '/__docs-pick' // POST {dir} → re-point the server
export const LIST_ENDPOINT = '/__docs-list' // GET ?dir= → list subdirectories (+ docs candidates)
export const NATIVE_ENDPOINT = '/__docs-native' // POST → open the OS folder dialog, return {dir}
export const READY_ENDPOINT = '/__docs-ready' // GET → { gen } readiness token; bumps each re-serve

const SKIP = new Set(['node_modules', '.git', 'dist', 'build', 'out', '.cache', '.docs-view', '.next', '.nuxt'])

function isDir(p) {
  try {
    return statSync(p).isDirectory()
  } catch {
    return false
  }
}

/** A POSTed dir → the docs dir to serve, or null if invalid. Accepts a docs dir or a project root. */
export function resolvePickedDir(dir) {
  if (!dir || typeof dir !== 'string') return null
  const abs = path.resolve(dir)
  if (!isDir(abs)) return null
  if (path.basename(abs) !== 'docs' && isDir(path.join(abs, 'docs'))) return path.join(abs, 'docs')
  return abs
}

/** List the immediate subdirectories of `dir` for the in-page browser. Pure + safe (dirs only). */
export function listDir(dir) {
  const abs = path.resolve(dir)
  const entries = []
  try {
    for (const name of readdirSync(abs)) {
      if (name.startsWith('.') || SKIP.has(name)) continue
      const child = path.join(abs, name)
      if (!isDir(child)) continue
      entries.push({
        name,
        path: child,
        isDocs: name === 'docs',
        hasDocs: isDir(path.join(child, 'docs')),
      })
    }
  } catch {
    /* unreadable dir → empty list */
  }
  entries.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))
  const parent = path.dirname(abs)
  return {
    dir: abs,
    parent: parent === abs ? null : parent,
    isDocs: path.basename(abs) === 'docs',
    hasDocs: isDir(path.join(abs, 'docs')),
    entries,
  }
}

let dialogInFlight = false

/** Run a command async; resolve its trimmed stdout, or null on any error/cancel. Never blocks. */
function run(cmd, args) {
  return new Promise((resolve) => {
    execFile(cmd, args, { encoding: 'utf8', timeout: 120_000, windowsHide: true }, (err, stdout) => {
      resolve(err ? null : (stdout || '').trim() || null)
    })
  })
}

/**
 * Open the OS-native folder dialog (the dev server runs locally) — ASYNC, so the server keeps
 * serving while the dialog is open. Resolves the chosen path, or null (cancel / no dialog tool).
 * Only one dialog at a time. `DOCS_VIEW_NATIVE_DIR` is a test/automation hook that skips the GUI.
 */
export function osFolderDialog() {
  if (process.env.DOCS_VIEW_NATIVE_DIR != null) {
    const dir = process.env.DOCS_VIEW_NATIVE_DIR || null
    const delay = Number(process.env.DOCS_VIEW_NATIVE_DELAY) || 0
    return new Promise((resolve) => setTimeout(() => resolve(dir), delay))
  }
  if (dialogInFlight) return Promise.resolve(null) // a dialog is already open
  dialogInFlight = true
  let p
  if (process.platform === 'darwin') {
    p = run('osascript', ['-e', 'POSIX path of (choose folder with prompt "Select a docs folder or project root")'])
  } else if (process.platform === 'win32') {
    const ps =
      'Add-Type -AssemblyName System.Windows.Forms;' +
      '$f=New-Object System.Windows.Forms.FolderBrowserDialog;' +
      "if($f.ShowDialog() -eq 'OK'){[Console]::Out.Write($f.SelectedPath)}"
    p = run('powershell', ['-NoProfile', '-STA', '-Command', ps])
  } else {
    p = run('zenity', ['--file-selection', '--directory', '--title=Select a docs folder or project root'])
  }
  return p.finally(() => {
    dialogInFlight = false
  })
}

/** Markdown (inline HTML) for the picker landing page — just embeds the interactive component. */
export function renderFolderPicker() {
  return ['# Pick a docs folder', '', 'No `docs/` folder was found automatically. Choose one:', '', '<FolderBrowser />', ''].join('\n')
}

/** Write the picker page as the runtime home (index.md). */
export function writeFolderPickerContent(contentDir) {
  writeFileSync(path.join(contentDir, 'index.md'), renderFolderPicker() + '\n', 'utf8')
}

function readJsonBody(req) {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (c) => {
      data += c
      if (data.length > 1_000_000) {
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

function sendJson(res, code, obj) {
  res.statusCode = code
  if (typeof res.setHeader === 'function') res.setHeader('content-type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(obj))
}

/**
 * Register the folder-picker dev endpoints (list / native dialog / pick). `cwd` seeds the browser's
 * start directory + the docs candidates. `onPick(docsDir)` re-points the server.
 */
export function registerPickEndpoints(server, { cwd, candidates = [], onPick, getGen }) {
  const mw = server && server.middlewares
  if (!mw) return false

  const handle = (req, res, next) => {
    const raw = req && req.url ? req.url : ''
    const url = raw.split('?')[0]

    if (url === READY_ENDPOINT) {
      // A monotonically increasing token; the picker polls this after Open and reloads only once it
      // increases (i.e. the NEW server is up on this port) — no fixed-delay races / "unreachable".
      return void sendJson(res, 200, { gen: typeof getGen === 'function' ? getGen() : 0 })
    }

    if (url === LIST_ENDPOINT) {
      let dir = cwd
      const q = raw.includes('?') ? new URLSearchParams(raw.slice(raw.indexOf('?') + 1)) : null
      if (q && q.get('dir')) dir = q.get('dir')
      const listing = listDir(dir)
      return void sendJson(res, 200, { ...listing, start: path.resolve(cwd), candidates })
    }

    if (url === NATIVE_ENDPOINT) {
      // ASYNC — the server keeps serving other requests while the OS dialog is open.
      osFolderDialog().then((dir) =>
        sendJson(res, dir ? 200 : 422, dir ? { dir } : { error: 'no folder chosen / dialog unavailable' }),
      )
      return undefined
    }

    if (url === PICK_ENDPOINT) {
      readJsonBody(req).then((body) => {
        const resolved = resolvePickedDir(body && body.dir)
        if (!resolved) return void sendJson(res, 400, { error: 'not a valid docs folder' })
        sendJson(res, 200, { dir: resolved })
        // Re-point AFTER replying (next tick), so tearing the server down doesn't drop this response.
        setTimeout(() => {
          try {
            onPick(resolved)
          } catch {
            /* surfaced by the next request failing */
          }
        }, 120)
      })
      return undefined
    }

    return typeof next === 'function' ? next() : undefined
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
