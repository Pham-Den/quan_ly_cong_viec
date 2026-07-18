#!/usr/bin/env node
import { run } from '../src/cli.js'

run(process.argv.slice(2)).catch((err) => {
  console.error('[docs-view] error:', err?.message || err)
  if (process.env.DOCS_VIEW_DEBUG) console.error(err?.stack)
  process.exit(1)
})
