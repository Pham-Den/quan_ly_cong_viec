import type { ConfigGroup, ConfigItem } from './mockTopology'

function secretFlag(value = '') {
  return ['1', 'true', 'yes', 'secret', 'sensitive'].includes(value.trim().toLowerCase())
}

export function parseNodeConfigText(value: string) {
  const groups = new Map<string, ConfigGroup>()

  for (const line of value.split('\n')) {
    const trimmed = line.trim()

    if (!trimmed) {
      continue
    }

    const [groupName, key, configValue = '', secret = ''] = trimmed.split('|')
    const name = groupName?.trim()
    const configKey = key?.trim()

    if (!name || !configKey) {
      continue
    }

    const group = groups.get(name) ?? { name, items: [] }

    group.items.push({
      key: configKey,
      value: configValue.trim(),
      secret: secretFlag(secret),
    })
    groups.set(name, group)
  }

  return Array.from(groups.values())
}

export function formatNodeConfigs(configs: ConfigGroup[]) {
  return configs
    .flatMap((group) =>
      group.items.map((item) => `${group.name}|${item.key}|${item.value}|${item.secret ? 'secret' : ''}`),
    )
    .join('\n')
}

export function parseDependencyConfigText(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      if (line.includes('|')) {
        const [key, configValue = '', secret = ''] = line.split('|')

        return {
          key: key?.trim() ?? '',
          value: configValue.trim(),
          secret: secretFlag(secret),
        }
      }

      const separatorIndex = line.indexOf('=')

      if (separatorIndex < 0) {
        return {
          key: line,
          value: '',
          secret: false,
        }
      }

      const key = line.slice(0, separatorIndex).trim()
      const rawValue = line.slice(separatorIndex + 1).trim()
      const secret = rawValue.startsWith('secret:')

      return {
        key,
        value: secret ? rawValue.slice('secret:'.length) : rawValue,
        secret,
      }
    })
    .filter((item) => Boolean(item.key))
}

export function formatDependencyConfigs(configs: ConfigItem[]) {
  return configs.map((item) => `${item.key}=${item.secret ? 'secret:' : ''}${item.value}`).join('\n')
}
