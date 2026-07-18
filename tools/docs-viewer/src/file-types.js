// Extension → classification.
//
// Compound extensions like .drawio.xml are matched first so they take
// precedence over the single-extension fallback.

const COMPOUND_VIEWERS = [
  { suffix: '.drawio.xml', viewer: 'drawio', ext: '.drawio.xml' },
]

const SIMPLE_VIEWERS = {
  '.drawio': 'drawio',
  '.mmd': 'mermaid',
  '.mermaid': 'mermaid',
  '.puml': 'plantuml',
  '.plantuml': 'plantuml',
  '.iuml': 'plantuml',
  '.pu': 'plantuml',
  '.csv': 'csv',
  '.pdf': 'pdf',
  '.png': 'image',
  '.jpg': 'image',
  '.jpeg': 'image',
  '.gif': 'image',
  '.svg': 'image',
  '.webp': 'image',
}

const DOWNLOAD_EXTS = new Set(['.docx', '.pptx', '.bpmn'])

const MD_EXTS = new Set(['.md', '.markdown'])

/**
 * Classify a filename by extension.
 * Returns null for files we don't handle (sidebar should skip these).
 *
 * Shape:
 *   { kind: 'md',       ext, viewer: null }
 *   { kind: 'view',     ext, viewer: 'drawio' | 'mermaid' | 'csv' | 'pdf' | 'image' }
 *   { kind: 'download', ext, viewer: null }
 */
export function classify(name) {
  const lower = name.toLowerCase()

  for (const { suffix, viewer, ext } of COMPOUND_VIEWERS) {
    if (lower.endsWith(suffix)) return { kind: 'view', ext, viewer }
  }

  const idx = lower.lastIndexOf('.')
  if (idx < 0) return null
  const ext = lower.slice(idx)

  if (MD_EXTS.has(ext)) return { kind: 'md', ext, viewer: null }
  if (SIMPLE_VIEWERS[ext]) return { kind: 'view', ext, viewer: SIMPLE_VIEWERS[ext] }
  if (DOWNLOAD_EXTS.has(ext)) return { kind: 'download', ext, viewer: null }
  return null
}

/**
 * Visual sidebar prefix for a classified file. Empty for plain MD so most
 * pages keep a clean look; non-MD pages get a small type marker.
 */
export function iconFor({ kind, viewer }) {
  if (kind === 'download') return '📎  '
  switch (viewer) {
    case 'drawio': return '📐  '
    case 'mermaid': return '〰️  '
    case 'plantuml': return '🌱  '
    case 'csv': return '📊  '
    case 'pdf': return '📕  '
    case 'image': return '🖼️  '
  }
  return ''
}
