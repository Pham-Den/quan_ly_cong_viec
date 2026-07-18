import { readFileSync } from 'node:fs'

/**
 * YAML-safe quoting for a string used as a frontmatter scalar.
 * Single-quote style — escape internal single quotes by doubling them.
 */
function yamlQuote(s) {
  return `'${String(s).replace(/'/g, "''")}'`
}

/**
 * Build the markdown content of a stub page that wraps a non-MD asset
 * in the appropriate viewer component.
 *
 * `assetUrl` is the runtime URL (starting with `/`) of the raw asset —
 * Vite serves it from the symlink we placed in .docs-view/content/.
 *
 * `srcAbs` is the absolute path on disk; we only read it for kinds that
 * inline content directly into markdown (currently: mermaid).
 */
export function makeStub({ kind, viewer, assetUrl, title, srcAbs }) {
  const fm = `---\ntitle: ${yamlQuote(title)}\naside: false\n---\n\n# ${title}\n\n`

  if (kind === 'download') {
    return fm + `<FileDownload href=${yamlQuote(assetUrl)} name=${yamlQuote(title)} />\n`
  }

  switch (viewer) {
    case 'drawio':
      return fm + `<DrawioViewer src=${yamlQuote(assetUrl)} />\n`
    case 'plantuml':
      return fm + `<PlantUmlViewer src=${yamlQuote(assetUrl)} />\n`
    case 'csv':
      return fm + `<CsvViewer src=${yamlQuote(assetUrl)} />\n`
    case 'pdf':
      return fm + `<PdfViewer src=${yamlQuote(assetUrl)} />\n`
    case 'image':
      return fm + `<ImageView src=${yamlQuote(assetUrl)} />\n`
    case 'mermaid': {
      // Inline the .mmd content as a fenced ```mermaid block so the
      // vitepress-plugin-mermaid integration renders it the same way as
      // mermaid blocks inside regular .md files.
      const body = readFileSync(srcAbs, 'utf8').trimEnd()
      return fm + '```mermaid\n' + body + '\n```\n'
    }
  }
  return fm
}
