import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { buildMysqlDatabaseUrl, resolveDatabaseConfig } from './db/config.js'

describe('backend database config', () => {
  test('keeps explicit DATABASE_URL as override', () => {
    const config = resolveDatabaseConfig({
      DATABASE_URL: 'file:./test.db',
      DB_CONNECTION: 'mysql',
      DB_HOST: '172.30.0.1',
      DB_PORT: '3306',
      DB_DATABASE: 'my-job',
      DB_USERNAME: 'root',
      DB_PASSWORD: 'root',
    })

    assert.equal(config.connection, 'sqlite')
    assert.equal(config.databaseUrl, 'file:./test.db')
    assert.equal(config.source, 'database_url')
  })

  test('builds mysql target url from DB variables', () => {
    const databaseUrl = buildMysqlDatabaseUrl({
      DB_HOST: '172.30.0.1',
      DB_PORT: '3306',
      DB_DATABASE: 'my-job',
      DB_USERNAME: 'root',
      DB_PASSWORD: 'root',
    })

    assert.equal(databaseUrl, 'mysql://root:root@172.30.0.1:3306/my-job')
  })

  test('uses mysql url from DB variables', () => {
    const config = resolveDatabaseConfig({
      DB_CONNECTION: 'mysql',
      DB_HOST: '172.30.0.1',
      DB_PORT: '3306',
      DB_DATABASE: 'my-job',
      DB_USERNAME: 'root',
      DB_PASSWORD: 'root',
    })

    assert.equal(config.connection, 'mysql')
    assert.equal(config.databaseUrl, 'mysql://root:root@172.30.0.1:3306/my-job')
    assert.equal(config.source, 'db_variables')
  })

  test('uses configured test database name', () => {
    const config = resolveDatabaseConfig({
      DB_CONNECTION: 'mysql',
      DB_HOST: '172.30.0.1',
      DB_PORT: '3306',
      DB_DATABASE: 'my-job',
      DB_USERNAME: 'root',
      DB_PASSWORD: 'root',
    }, { kind: 'test' })

    assert.equal(config.connection, 'mysql')
    assert.equal(config.databaseUrl, 'mysql://root:root@172.30.0.1:3306/my-job_test')
    assert.equal(config.source, 'db_variables')
  })
})
