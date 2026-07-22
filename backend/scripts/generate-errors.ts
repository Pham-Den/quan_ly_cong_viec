import { resolve } from 'node:path'

import { generateErrorCatalogFiles } from '../src/shared/errors/generator.js'

// Sprint: v1 | Feature: NFR-006/NFR-008/NFR-010 | Task Group: 03 Error catalog
// Contract: API-024, PR-008 | Pack: v1.7.21-oidc-session-error-contracts

function option(name: string, fallback: string): string {
  const index = process.argv.indexOf(name)
  return resolve(index === -1 ? fallback : process.argv[index + 1] ?? fallback)
}

await generateErrorCatalogFiles({
  catalogPath: option('--catalog', 'backend/errors.yml'),
  typescriptPath: option('--typescript-out', 'backend/src/shared/errors/generated.ts'),
  openApiPath: option('--openapi-out', 'backend/src/shared/errors/openapi.generated.json'),
  check: process.argv.includes('--check'),
})
