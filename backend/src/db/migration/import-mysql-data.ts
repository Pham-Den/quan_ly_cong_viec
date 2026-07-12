import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { PrismaClient } from '@prisma/client'

import { importOrder, metadataByTable, modelMetadata, type TableName } from './model-metadata.js'

type ExportFile = {
  version: 1
  counts: Record<TableName, number>
  tables: Record<TableName, Array<Record<string, unknown>>>
}

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const repoRoot = resolve(backendRoot, '..')
const defaultInputPath = resolve(repoRoot, '.dev/mysql-migration/sqlite-dev-export.json')
const prisma = new PrismaClient()

function readOption(name: string) {
  const index = process.argv.indexOf(name)

  if (index === -1) {
    return undefined
  }

  return process.argv[index + 1]
}

function hasFlag(name: string) {
  return process.argv.includes(name)
}

function asDate(value: unknown) {
  if (value === null || value === undefined) {
    return null
  }

  if (typeof value === 'number' || typeof value === 'string') {
    return new Date(value)
  }

  return value
}

function asBoolean(value: unknown) {
  if (value === null || value === undefined) {
    return value
  }

  return value === true || value === 1 || value === '1'
}

function prepareRow(table: TableName, row: Record<string, unknown>) {
  const metadata = metadataByTable(table)
  const prepared = { ...row }

  for (const field of metadata.dateFields) {
    if (field in prepared) {
      prepared[field] = asDate(prepared[field])
    }
  }

  for (const field of metadata.booleanFields) {
    if (field in prepared) {
      prepared[field] = asBoolean(prepared[field])
    }
  }

  if (table === 'Project') {
    prepared.defaultRepoId = null
  }

  if (table === 'Branch') {
    prepared.sourceBranchId = null
  }

  return prepared
}

function delegateFor(table: TableName) {
  return (prisma as unknown as Record<string, { count: () => Promise<number>; createMany: (args: unknown) => Promise<unknown>; update: (args: unknown) => Promise<unknown> }>)[
    metadataByTable(table).delegate
  ]
}

async function countTargetRows() {
  const counts = new Map<TableName, number>()

  for (const metadata of modelMetadata) {
    counts.set(metadata.table, await delegateFor(metadata.table).count())
  }

  return counts
}

async function truncateTargetTables() {
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0')

  for (const metadata of [...modelMetadata].reverse()) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${metadata.table.replaceAll('`', '``')}\``)
  }

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1')
}

async function importTable(table: TableName, rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) {
    return
  }

  await delegateFor(table).createMany({
    data: rows.map((row) => prepareRow(table, row)),
  })
}

async function restoreDeferredRelations(exportFile: ExportFile) {
  for (const project of exportFile.tables.Project) {
    if (project.defaultRepoId) {
      await prisma.project.update({
        where: { id: String(project.id) },
        data: { defaultRepoId: String(project.defaultRepoId) },
      })
    }
  }

  for (const branch of exportFile.tables.Branch) {
    if (branch.sourceBranchId) {
      await prisma.branch.update({
        where: { id: String(branch.id) },
        data: { sourceBranchId: String(branch.sourceBranchId) },
      })
    }
  }
}

async function main() {
  const inputPath = resolve(readOption('--input') ?? defaultInputPath)

  if (!existsSync(inputPath)) {
    throw new Error(`SQLite export file not found: ${inputPath}`)
  }

  const exportFile = JSON.parse(readFileSync(inputPath, 'utf8')) as ExportFile
  const targetCounts = await countTargetRows()
  const targetHasData = [...targetCounts.values()].some((count) => count > 0)

  if (targetHasData) {
    if (!hasFlag('--truncate')) {
      throw new Error('Target MySQL database already has data. Re-run with --truncate if you want to replace it.')
    }

    await truncateTargetTables()
  }

  for (const table of importOrder) {
    await importTable(table, exportFile.tables[table] ?? [])
  }

  await restoreDeferredRelations(exportFile)

  const migratedCounts = await countTargetRows()
  const mismatches = modelMetadata.filter((metadata) => migratedCounts.get(metadata.table) !== exportFile.counts[metadata.table])

  if (mismatches.length > 0) {
    for (const mismatch of mismatches) {
      process.stderr.write(
        `${mismatch.table}: exported=${exportFile.counts[mismatch.table]} migrated=${migratedCounts.get(mismatch.table)}\n`,
      )
    }

    throw new Error('Migrated record counts do not match the SQLite export.')
  }

  process.stdout.write(`Imported SQLite export into MySQL from ${inputPath}\n`)
  process.stdout.write(
    `Rows imported: ${[...migratedCounts.values()].reduce((total, count) => total + count, 0)}\n`,
  )
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
