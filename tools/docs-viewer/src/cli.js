import path from 'node:path'
import { startDev } from './dev.js'
import { runBuild } from './build.js'
import { ensureGitignore } from './gitignore.js'
import { findDocsDir, resolveDocsArg } from './resolve-docs.js'

const HELP = `docs-view — zero-config doc viewer

Usage:
  docs-view [path]            start dev server (default)
  docs-view dev [path]        start dev server
  docs-view build [path]      build static site to <project>/docs-dist

  [path]  a docs/ folder or a project root containing one. If omitted, docs-view
          walks up from the current directory to the nearest docs/ folder; if none
          is found, dev mode opens an in-browser folder picker.

Options:
  --port <n>             dev server port (default: 5173)
  --host <h>             dev server host (default: localhost)
  --open                 open browser on start
  --help, -h             show this help
`

function parseFlags(args) {
  const opts = { port: 5173, host: 'localhost', open: false }
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--port') {
      const v = Number(args[++i])
      if (!Number.isFinite(v) || v <= 0 || v > 65535) {
        throw new Error(`invalid --port value (got "${args[i]}")`)
      }
      opts.port = v
    } else if (a === '--host') {
      if (!args[i + 1] || args[i + 1].startsWith('--')) {
        throw new Error('--host requires a value')
      }
      opts.host = args[++i]
    } else if (a === '--open') opts.open = true
    else if (a === '--help' || a === '-h') opts.help = true
    else throw new Error(`unknown flag: ${a}`)
  }
  return opts
}

export async function run(argv) {
  let cmd = 'dev'
  let rest = argv
  // First token is a command only when it's exactly `dev`/`build`; any other non-flag token is the
  // optional [path] (dev is the default command) — matching --help (`docs-view [path]`).
  if (argv[0] === 'dev' || argv[0] === 'build') {
    cmd = argv[0]
    rest = argv.slice(1)
  }

  // An optional positional <path> is the first non-flag token of the remainder.
  let pathArg = null
  if (rest[0] && !rest[0].startsWith('-')) {
    pathArg = rest[0]
    rest = rest.slice(1)
  }
  const opts = parseFlags(rest)

  if (opts.help) {
    console.log(HELP)
    return
  }

  const cwd = process.cwd()
  let docsDir
  try {
    docsDir = pathArg ? resolveDocsArg(pathArg, cwd) : findDocsDir(cwd)
  } catch (err) {
    console.error(`[docs-view] ${err.message}`)
    process.exit(1)
  }

  // The runtime (.docs-view) lives in cwd; the static build output (docs-dist) sits next to docs/.
  ensureGitignore(cwd)
  if (docsDir) ensureGitignore(path.dirname(docsDir))

  if (cmd === 'build') {
    if (!docsDir) {
      console.error('[docs-view] no docs/ folder found (walked up from the current directory).')
      console.error('            pass one explicitly:  docs-view build <path-to-docs>')
      process.exit(1)
    }
    await runBuild({ cwd, docsDir })
  } else {
    // dev: docsDir may be null → startDev serves the in-browser folder picker.
    await startDev({ cwd, docsDir, ...opts })
  }
}
