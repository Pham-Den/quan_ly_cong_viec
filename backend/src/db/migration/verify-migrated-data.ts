import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { PrismaClient } from '@prisma/client'

import { modelMetadata, type TableName } from './model-metadata.js'

type ExportFile = {
  counts: Record<TableName, number>
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

function delegateFor(table: TableName) {
  return (prisma as unknown as Record<string, { count: () => Promise<number> }>)[
    modelMetadata.find((metadata) => metadata.table === table)?.delegate ?? ''
  ]
}

async function main() {
  const inputPath = resolve(readOption('--input') ?? defaultInputPath)

  if (!existsSync(inputPath)) {
    throw new Error(`SQLite export file not found: ${inputPath}`)
  }

  const exportFile = JSON.parse(readFileSync(inputPath, 'utf8')) as ExportFile
  const mismatches: string[] = []

  for (const metadata of modelMetadata) {
    const actual = await delegateFor(metadata.table).count()
    const expected = exportFile.counts[metadata.table]

    if (actual !== expected) {
      mismatches.push(`${metadata.table}: exported=${expected} mysql=${actual}`)
    }
  }

  if (mismatches.length > 0) {
    process.stderr.write(`${mismatches.join('\n')}\n`)
    throw new Error('MySQL counts do not match the SQLite export.')
  }

  process.stdout.write('MySQL counts match the SQLite export.\n')
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
