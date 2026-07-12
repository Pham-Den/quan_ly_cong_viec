export type StatusTagMeta = {
  label: string
  color: string
}

export type StatusTagConfig = Record<string, StatusTagMeta>

export const defaultStatusTagConfig: StatusTagConfig = {
  healthy: { label: 'Healthy', color: 'green' },
  warning: { label: 'Warning', color: 'gold' },
  down: { label: 'Down', color: 'red' },
  unknown: { label: 'Unknown', color: 'default' },
  maintenance: { label: 'Maintenance', color: 'blue' },
  disabled: { label: 'Disabled', color: 'default' },
}

function fallbackLabel(value: string) {
  return value
    .replace(/[-_]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function statusTagMeta(value?: string | null, config: StatusTagConfig = defaultStatusTagConfig) {
  const status = String(value ?? '').trim()

  if (!status) {
    return config.unknown ?? defaultStatusTagConfig.unknown
  }

  return config[status] ?? config[status.toLowerCase()] ?? config[status.toUpperCase()] ?? {
    label: fallbackLabel(status),
    color: 'default',
  }
}
