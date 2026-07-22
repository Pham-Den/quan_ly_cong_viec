// Sprint: v1 | Feature: NFR-004 | Task Group: 02C Browser session cutover
// Contract: DS-COMP-012, API-017/018/024 | Pack: v1.7.21-oidc-session-error-contracts

export type CallbackRecoveryKind = 'PRE_CLAIM' | 'POST_CLAIM' | 'INVALID_CONTRACT'
export type CallbackRecoveryPhase = 'WAITING' | 'READY' | 'EXHAUSTED' | 'NAVIGATION_ERROR' | 'CONTRACT_ERROR'

export type CallbackRecoveryState = {
  kind: CallbackRecoveryKind
  phase: CallbackRecoveryPhase
  secondsRemaining: number
  callbackUrl: string | null
  attemptCount: number
}
