import { loadDotEnvFiles, resolveDatabaseConfig } from './config.js'

export function resolveTestDatabaseUrl() {
  loadDotEnvFiles()

  const databaseUrl = process.env.DATABASE_URL ?? resolveDatabaseConfig(process.env, { kind: 'test' }).databaseUrl

  process.env.DATABASE_URL ??= databaseUrl

  return databaseUrl
}
