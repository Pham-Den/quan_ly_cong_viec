import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export type DatabaseConnection = 'sqlite' | 'mysql'

export type DatabaseConfig = {
  connection: DatabaseConnection
  databaseUrl: string
  source: 'database_url' | 'db_variables' | 'sqlite_fallback'
}

const sqliteFallbackUrl = 'file:./dev.db'
const supportedConnections = new Set<DatabaseConnection>(['sqlite', 'mysql'])
const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const repoRoot = resolve(backendRoot, '..')

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeConnection(value: unknown): DatabaseConnection {
  const connection = text(value).toLowerCase()

  if (!connection) {
    return 'mysql'
  }

  if (supportedConnections.has(connection as DatabaseConnection)) {
    return connection as DatabaseConnection
  }

  throw new Error(`Unsupported DB_CONNECTION "${connection}".`)
}

function inferConnectionFromUrl(databaseUrl: string): DatabaseConnection {
  return databaseUrl.startsWith('mysql://') ? 'mysql' : 'sqlite'
}

function parseEnvValue(value: string) {
  const trimmed = value.trim()

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }

  return trimmed
}

export function loadDotEnvFiles(
  env: NodeJS.ProcessEnv = process.env,
  paths = [resolve(repoRoot, '.env'), resolve(backendRoot, '.env')],
) {
  for (const path of paths) {
    if (!existsSync(path)) {
      continue
    }

    const lines = readFileSync(path, 'utf8').split(/\r?\n/)

    for (const line of lines) {
      const trimmed = line.trim()

      if (!trimmed || trimmed.startsWith('#')) {
        continue
      }

      const separatorIndex = trimmed.indexOf('=')

      if (separatorIndex < 1) {
        continue
      }

      const key = trimmed.slice(0, separatorIndex).trim()

      if (env[key] !== undefined) {
        continue
      }

      env[key] = parseEnvValue(trimmed.slice(separatorIndex + 1))
    }
  }
}

export function getConfiguredDatabaseName(
  env: NodeJS.ProcessEnv,
  kind: 'default' | 'test' | 'e2e' = 'default',
) {
  const database = text(env.DB_DATABASE)

  if (!database) {
    throw new Error('DB_DATABASE is required when DB_CONNECTION=mysql.')
  }

  if (kind === 'test') {
    return text(env.DB_TEST_DATABASE) || `${database}_test`
  }

  if (kind === 'e2e') {
    return text(env.DB_E2E_DATABASE) || `${database}_e2e`
  }

  return database
}

export function buildMysqlDatabaseUrl(
  env: NodeJS.ProcessEnv,
  options: { database?: string; kind?: 'default' | 'test' | 'e2e' } = {},
) {
  const host = text(env.DB_HOST) || '127.0.0.1'
  const port = text(env.DB_PORT) || '3306'
  const database = text(options.database) || getConfiguredDatabaseName(env, options.kind)
  const username = text(env.DB_USERNAME)
  const password = text(env.DB_PASSWORD)

  if (!username) {
    throw new Error('DB_USERNAME is required when DB_CONNECTION=mysql.')
  }

  const url = new URL(`mysql://${host}:${port}/${encodeURIComponent(database)}`)

  url.username = username
  url.password = password

  return url.toString()
}

export function resolveDatabaseConfig(
  env: NodeJS.ProcessEnv = process.env,
  options: { database?: string; kind?: 'default' | 'test' | 'e2e' } = {},
): DatabaseConfig {
  const explicitDatabaseUrl = text(env.DATABASE_URL)

  if (explicitDatabaseUrl) {
    return {
      connection: inferConnectionFromUrl(explicitDatabaseUrl),
      databaseUrl: explicitDatabaseUrl,
      source: 'database_url',
    }
  }

  const connection = normalizeConnection(env.DB_CONNECTION)

  if (connection === 'mysql') {
    const databaseUrl = buildMysqlDatabaseUrl(env, options)

    return {
      connection,
      databaseUrl,
      source: 'db_variables',
    }
  }

  return {
    connection,
    databaseUrl: text(env.SQLITE_DATABASE_URL) || sqliteFallbackUrl,
    source: 'sqlite_fallback',
  }
}
