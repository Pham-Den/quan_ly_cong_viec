import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import fc from 'fast-check'

import {
  generateErrorCatalogFiles,
  commitGeneratedOutputs,
  parseErrorCatalog,
  renderGeneratedOpenApi,
  renderGeneratedTypeScript,
  resolveEndpointCodes,
  type ErrorCatalog,
} from './generator.js'

// Sprint: v1 | TC-061/064/070/073 | Task Group: 03 Error catalog
// Pack: v1.7.21-oidc-session-error-contracts
const canonicalPath = new URL('../../../errors.yml', import.meta.url)

test('canonical generation is byte-deterministic and check mode rejects stale output', async () => {
  await withWorkspace(async ({ catalogPath, typescriptPath, openApiPath }) => {
    const canonicalBefore = await readFile(canonicalPath, 'utf8')
    await writeFile(catalogPath, canonicalBefore)
    await generateErrorCatalogFiles({ catalogPath, typescriptPath, openApiPath, check: false })
    const firstTypescript = await readFile(typescriptPath, 'utf8')
    const firstOpenApi = await readFile(openApiPath, 'utf8')
    await generateErrorCatalogFiles({ catalogPath, typescriptPath, openApiPath, check: false })
    assert.equal(await readFile(typescriptPath, 'utf8'), firstTypescript)
    assert.equal(await readFile(openApiPath, 'utf8'), firstOpenApi)
    await generateErrorCatalogFiles({ catalogPath, typescriptPath, openApiPath, check: true })
    await writeFile(typescriptPath, `${firstTypescript}// stale\n`)
    await assert.rejects(
      generateErrorCatalogFiles({ catalogPath, typescriptPath, openApiPath, check: true }),
      /stale/,
    )
    assert.equal(await readFile(canonicalPath, 'utf8'), canonicalBefore)
  })
})

test('generated output transaction restores every prior file when a later commit fails', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'api-lab-errors-transaction-'))
  try {
    const outputs = [join(directory, 'generated.ts'), join(directory, 'openapi.json')]
    const staged = [join(directory, 'generated.tmp'), join(directory, 'openapi.tmp')]
    await Promise.all([
      writeFile(outputs[0]!, 'old-typescript'),
      writeFile(outputs[1]!, 'old-openapi'),
      writeFile(staged[0]!, 'new-typescript'),
      writeFile(staged[1]!, 'new-openapi'),
    ])
    let stagedMoves = 0
    const failSecondCommit = async (source: string, target: string) => {
      if (source.endsWith('.tmp')) {
        stagedMoves += 1
        if (stagedMoves === 2) throw new Error('synthetic second-output failure')
      }
      await import('node:fs/promises').then(({ rename }) => rename(source, target))
    }
    await assert.rejects(commitGeneratedOutputs(outputs, staged, failSecondCommit), /second-output failure/)
    assert.equal(await readFile(outputs[0]!, 'utf8'), 'old-typescript')
    assert.equal(await readFile(outputs[1]!, 'utf8'), 'old-openapi')
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('API-024 merges protected middleware outcomes and keeps the three 503 meanings distinct', async () => {
  const catalog = parseErrorCatalog(await readFile(canonicalPath, 'utf8'))
  const api019 = resolveEndpointCodes(endpoint(catalog, 'API-019'), catalog)
  const api020 = resolveEndpointCodes(endpoint(catalog, 'API-020'), catalog)
  assert.deepEqual(api019['503'], ['SERVICE_UNAVAILABLE', 'SESSION_STORE_UNAVAILABLE'])
  assert.deepEqual(api020['503'], [
    'KEY_PROVIDER_UNAVAILABLE',
    'SERVICE_UNAVAILABLE',
    'SESSION_STORE_UNAVAILABLE',
  ])
  for (const code of api020['503']!) {
    const metadata = catalog.errors.find((candidate) => candidate.code === code)!
    assert.equal(metadata.http, 503)
    assert.equal(metadata.retryable, true)
    assert.ok(metadata.retry_after_seconds! >= 1 && metadata.retry_after_seconds! <= 86_400)
  }
  const generated = `${renderGeneratedTypeScript(catalog)}${renderGeneratedOpenApi(catalog)}`
  assert.equal(generated.includes('IAM_UNAVAILABLE'), false)
  assert.equal(generated.includes('IAM_OR_SESSION_STORE_UNAVAILABLE'), false)
  for (const code of ['SERVICE_UNAVAILABLE', 'KEY_PROVIDER_UNAVAILABLE', 'SESSION_STORE_UNAVAILABLE']) {
    assert.deepEqual(catalog.errors.find((candidate) => candidate.code === code)?.recovery_actions, ['RESTART_LOGIN'])
  }
  const openApi = JSON.parse(renderGeneratedOpenApi(catalog))
  assert.deepEqual(
    openApi.components.schemas.SERVICE_UNAVAILABLE.properties.error.properties.details.properties.recovery_action.enum,
    ['RESTART_LOGIN'],
  )
})

test('invalid metadata, endpoint drift, deprecated aliases and synthetic secret markers commit no output', async () => {
  const canonical = parseErrorCatalog(await readFile(canonicalPath, 'utf8'))
  const mutations: Array<[string, (catalog: any) => void]> = [
    ['missing message_key', (catalog) => { delete catalog.errors[0].message_key }],
    ['duplicate code', (catalog) => { catalog.errors.push({ ...catalog.errors[0] }) }],
    ['wrong endpoint status', (catalog) => { catalog.endpoints[0].responses['400'] = ['AUTH_REQUIRED'] }],
    ['deprecated alias', (catalog) => { catalog.endpoints[16].responses['503'] = ['IAM_UNAVAILABLE'] }],
    ['missing retry metadata', (catalog) => { catalog.errors.find((item: any) => item.code === 'SERVICE_UNAVAILABLE').retry_after_seconds = null }],
    ['synthetic secret marker', (catalog) => { catalog.errors[0].condition = 'synthetic client_secret marker' }],
  ]
  for (const [name, mutate] of mutations) {
    await withWorkspace(async ({ catalogPath, typescriptPath, openApiPath }) => {
      const candidate = structuredClone(canonical)
      mutate(candidate)
      await writeFile(catalogPath, JSON.stringify(candidate, null, 2))
      await assert.rejects(
        generateErrorCatalogFiles({ catalogPath, typescriptPath, openApiPath, check: false }),
        /.+/,
        name,
      )
      await assert.rejects(readFile(typescriptPath), /ENOENT/, `${name}: TypeScript output absent`)
      await assert.rejects(readFile(openApiPath), /ENOENT/, `${name}: OpenAPI output absent`)
    })
  }
})

test('[PBT] duplicate active codes are rejected for every catalog position', async () => {
  const canonical = parseErrorCatalog(await readFile(canonicalPath, 'utf8'))
  fc.assert(
    fc.property(fc.integer({ min: 0, max: canonical.errors.length - 1 }), (index) => {
      const candidate = structuredClone(canonical)
      candidate.errors.push({ ...candidate.errors[index]! })
      assert.throws(() => parseErrorCatalog(JSON.stringify(candidate)), /Duplicate error code/)
    }),
    { seed: 20260719, numRuns: 100 },
  )
})

test('catalog validator rejects every incomplete schema and inheritance decision row', async () => {
  const canonical = parseErrorCatalog(await readFile(canonicalPath, 'utf8'))
  const cases: Array<[string, (catalog: any) => unknown]> = [
    ['version', (catalog) => { catalog.version = 2; return catalog }],
    ['deprecated aliases', (catalog) => { catalog.deprecated_aliases = null; return catalog }],
    ['inheritance object', (catalog) => { catalog.protected_route_inheritance = null; return catalog }],
    ['inheritance fields', (catalog) => { catalog.protected_route_inheritance.codes = null; return catalog }],
    ['arrays', (catalog) => { catalog.endpoints = null; return catalog }],
    ['entry shape', (catalog) => { catalog.errors[0].http = '400'; return catalog }],
    ['code syntax', (catalog) => { catalog.errors[0].code = 'bad-code'; return catalog }],
    ['message syntax', (catalog) => { catalog.errors[0].message_key = 'bad'; return catalog }],
    ['message mismatch', (catalog) => { catalog.errors[0].message_key = 'errors.api_lab.other'; return catalog }],
    ['active alias', (catalog) => { catalog.errors[0].code = 'IAM_UNAVAILABLE'; catalog.errors[0].message_key = 'errors.api_lab.iam_unavailable'; return catalog }],
    ['retryable mismatch 429', (catalog) => { catalog.errors.find((item: any) => item.http === 429).retryable = false; return catalog }],
    ['retryable mismatch 400', (catalog) => { catalog.errors.find((item: any) => item.http === 400).retryable = true; return catalog }],
    ['retry range', (catalog) => { catalog.errors.find((item: any) => item.http === 503).retry_after_seconds = 86_401; return catalog }],
    ['unexpected retry', (catalog) => { catalog.errors.find((item: any) => item.http === 400).retry_after_seconds = 1; return catalog }],
    ['invalid recovery action', (catalog) => { catalog.errors.find((item: any) => item.code === 'SERVICE_UNAVAILABLE').recovery_actions = ['RETRY_CALLBACK']; return catalog }],
    ['recovery action on non-503', (catalog) => { catalog.errors.find((item: any) => item.http === 400).recovery_actions = ['RESTART_LOGIN']; return catalog }],
    ['category', (catalog) => { catalog.errors[0].category = 'system'; return catalog }],
    ['missing inherited code', (catalog) => { catalog.protected_route_inheritance.codes.push('UNKNOWN_INHERITED'); return catalog }],
    ['endpoint shape', (catalog) => { catalog.endpoints[0].auth = 'unknown'; return catalog }],
    ['duplicate endpoint', (catalog) => { catalog.endpoints.push(structuredClone(catalog.endpoints[0])); return catalog }],
    ['unknown endpoint code', (catalog) => { catalog.endpoints[0].responses['400'] = ['UNKNOWN_CODE']; return catalog }],
    ['endpoint responses', (catalog) => { catalog.endpoints[0].responses['400'] = 'INVALID_REQUEST'; return catalog }],
  ]
  for (const [name, mutate] of cases) {
    const candidate = mutate(structuredClone(canonical))
    assert.throws(() => parseErrorCatalog(JSON.stringify(candidate)), /./, name)
  }
  assert.throws(() => parseErrorCatalog('{not json'), /JSON-compatible YAML/)
  assert.throws(() => parseErrorCatalog('null'), /version/)
})

test('check mode reports either missing generated output', async () => {
  await withWorkspace(async ({ catalogPath, typescriptPath, openApiPath }) => {
    await writeFile(catalogPath, await readFile(canonicalPath, 'utf8'))
    await assert.rejects(
      generateErrorCatalogFiles({ catalogPath, typescriptPath, openApiPath, check: true }),
      /missing/,
    )
    await generateErrorCatalogFiles({ catalogPath, typescriptPath, openApiPath, check: false })
    await rm(openApiPath)
    await assert.rejects(
      generateErrorCatalogFiles({ catalogPath, typescriptPath, openApiPath, check: true }),
      /missing/,
    )
  })
})

function endpoint(catalog: ErrorCatalog, id: string) {
  const result = catalog.endpoints.find((candidate) => candidate.id === id)
  assert.ok(result, `missing ${id}`)
  return result
}

async function withWorkspace(
  handler: (paths: { catalogPath: string; typescriptPath: string; openApiPath: string }) => Promise<void>,
): Promise<void> {
  const directory = await mkdtemp(join(tmpdir(), 'api-lab-errors-'))
  try {
    await handler({
      catalogPath: join(directory, 'errors.yml'),
      typescriptPath: join(directory, 'generated.ts'),
      openApiPath: join(directory, 'openapi.generated.json'),
    })
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}
