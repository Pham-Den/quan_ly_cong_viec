const environmentColorOverrides: Record<string, string> = {
  local: '#475467',
  dev: '#2563eb',
  development: '#2563eb',
  staging: '#d97706',
  stage: '#d97706',
  production: '#dc2626',
  prod: '#dc2626',
}

const environmentColorPalette = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#c026d3', '#0891b2']

function hashText(value: string) {
  return value.split('').reduce((hash, char) => hash + char.charCodeAt(0), 0)
}

export function fallbackEnvironmentColor(key: string) {
  const normalizedKey = key.trim().toLowerCase()

  return (
    environmentColorOverrides[normalizedKey] ??
    environmentColorPalette[hashText(normalizedKey) % environmentColorPalette.length] ??
    '#667085'
  )
}

export function normalizeEnvironmentColor(color: string | null | undefined, key: string) {
  const nextColor = String(color ?? '').trim()

  return /^#[0-9a-f]{6}$/i.test(nextColor) ? nextColor.toLowerCase() : fallbackEnvironmentColor(key)
}
