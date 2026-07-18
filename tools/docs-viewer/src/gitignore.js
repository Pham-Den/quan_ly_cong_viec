import { existsSync, readFileSync, appendFileSync } from 'node:fs'
import path from 'node:path'

const ENTRIES = ['.docs-view/', 'docs-dist/']

/**
 * Append our runtime + build dirs to the project's .gitignore if (a) the
 * file already exists and (b) the entries are missing. We don't create a
 * .gitignore in projects that don't have one — that would be too intrusive
 * for non-git contexts.
 */
export function ensureGitignore(cwd) {
  const file = path.join(cwd, '.gitignore')
  if (!existsSync(file)) return
  const content = readFileSync(file, 'utf8')
  const lines = content.split('\n').map((l) => l.trim())
  const missing = ENTRIES.filter(
    (e) => !lines.includes(e) && !lines.includes(e.replace(/\/$/, '')),
  )
  if (missing.length === 0) return
  const sep = content.length === 0 || content.endsWith('\n') ? '' : '\n'
  appendFileSync(
    file,
    sep + '\n# docs-view (auto-added)\n' + missing.join('\n') + '\n',
  )
  console.log(`[docs-view] added to .gitignore: ${missing.join(', ')}`)
}
