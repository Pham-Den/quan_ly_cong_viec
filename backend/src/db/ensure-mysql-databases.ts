import mysql from 'mysql2/promise'

import { getConfiguredDatabaseName, loadDotEnvFiles } from './config.js'

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function readConnectionConfig() {
  const username = text(process.env.DB_USERNAME)

  if (!username) {
    throw new Error('DB_USERNAME is required when DB_CONNECTION=mysql.')
  }

  return {
    host: text(process.env.DB_HOST) || '127.0.0.1',
    port: Number(text(process.env.DB_PORT) || 3306),
    user: username,
    password: text(process.env.DB_PASSWORD),
  }
}

function quoteIdentifier(value: string) {
  return `\`${value.replaceAll('`', '``')}\``
}

loadDotEnvFiles()

if ((process.env.DB_CONNECTION ?? 'mysql').trim().toLowerCase() !== 'mysql') {
  process.stdout.write('DB_CONNECTION is not mysql, skip database ensure.\n')
  process.exit(0)
}

const databaseNames = [
  getConfiguredDatabaseName(process.env),
  getConfiguredDatabaseName(process.env, 'test'),
  getConfiguredDatabaseName(process.env, 'e2e'),
]
const uniqueNames = [...new Set(databaseNames)]
const connection = await mysql.createConnection(readConnectionConfig())

try {
  for (const name of uniqueNames) {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${quoteIdentifier(name)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    )
  }

  process.stdout.write(`Ensured MySQL databases: ${uniqueNames.join(', ')}\n`)
} finally {
  await connection.end()
}
