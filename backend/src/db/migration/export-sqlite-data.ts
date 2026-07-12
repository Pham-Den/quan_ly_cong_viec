import { spawnSync } from 'node:child_process'
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { loadDotEnvFiles } from '../config.js'
import { tableNames, type TableName } from './model-metadata.js'

type ExportFile = {
  version: 1
  exportedAt: string
  source: {
    databaseUrl: string
    sqlitePath: string
    backupPath: string
  }
  counts: Record<TableName, number>
  tables: Record<TableName, Array<Record<string, unknown>>>
}

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const repoRoot = resolve(backendRoot, '..')
const defaultOutputPath = resolve(repoRoot, '.dev/mysql-migration/sqlite-dev-export.json')

function readOption(name: string) {
  const index = process.argv.indexOf(name)

  if (index === -1) {
    return undefined
  }

  return process.argv[index + 1]
}

function sqlitePathFromUrl(databaseUrl: string) {
  if (!databaseUrl.startsWith('file:')) {
    throw new Error(`SQLite export only supports file: URLs. Received "${databaseUrl}".`)
  }

  const value = databaseUrl.slice('file:'.length)

  if (isAbsolute(value)) {
    return value
  }

  return resolve(backendRoot, 'prisma', value)
}

function quoteIdentifier(value: string) {
  return `"${value.replaceAll('"', '""')}"`
}

function readTable(sqlitePath: string, table: TableName) {
  const result = spawnSync('sqlite3', ['-json', sqlitePath, `SELECT * FROM ${quoteIdentifier(table)}`], {
    encoding: 'utf8',
  })

  if (result.status !== 0) {
    process.stderr.write(result.stderr)
    process.exit(result.status ?? 1)
  }

  return JSON.parse(result.stdout || '[]') as Array<Record<string, unknown>>
}

loadDotEnvFiles()

const databaseUrl = readOption('--sqlite-url') ?? process.env.SQLITE_DATABASE_URL ?? 'file:./dev.db'
const outputPath = resolve(readOption('--output') ?? defaultOutputPath)
const sqlitePath = sqlitePathFromUrl(databaseUrl)
const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
const backupPath = resolve(dirname(outputPath), `dev.db.backup-${timestamp}`)
const tables = {} as Record<TableName, Array<Record<string, unknown>>>
const counts = {} as Record<TableName, number>

mkdirSync(dirname(outputPath), { recursive: true })
copyFileSync(sqlitePath, backupPath)

for (const table of tableNames) {
  const rows = readTable(sqlitePath, table)
  tables[table] = rows
  counts[table] = rows.length
}

const exportFile: ExportFile = {
  version: 1,
  exportedAt: new Date().toISOString(),
  source: {
    databaseUrl,
    sqlitePath,
    backupPath,
  },
  counts,
  tables,
}

writeFileSync(outputPath, `${JSON.stringify(exportFile, null, 2)}\n`)

process.stdout.write(`Exported SQLite data to ${outputPath}\n`)
process.stdout.write(`SQLite backup kept at ${backupPath}\n`)
process.stdout.write(
  `Rows exported: ${Object.values(counts).reduce((total, count) => total + count, 0)}\n`,
)
