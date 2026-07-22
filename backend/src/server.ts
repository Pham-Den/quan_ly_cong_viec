import type { AppEnv } from './env.js'
import { buildApplication } from './app.js'

// Sprint: v1 | Feature: NFR-004/NFR-006 | Task Group: 03B Runtime composition
// Contract: ARCH-COMP-001/007, PR-001/006 | Pack: v1.7.21-oidc-session-error-contracts

export function buildServer(env: AppEnv) {
  return buildApplication(env)
}
