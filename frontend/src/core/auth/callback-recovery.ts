import type { CallbackRecoveryKind, CallbackRecoveryState } from './callback-recovery.types'

// Sprint: v1 | Feature: NFR-004 | Task Group: 02C Browser session cutover
// Contract: DS-COMP-012, API-017/018/024 | Pack: v1.7.21-oidc-session-error-contracts
export function createCallbackRecovery(kind: CallbackRecoveryKind, seconds: number, callbackUrl: string | null = null): CallbackRecoveryState {
  return {
    kind,
    phase: kind === 'INVALID_CONTRACT' ? 'CONTRACT_ERROR' : seconds > 0 ? 'WAITING' : 'READY',
    secondsRemaining: Math.max(0, seconds),
    callbackUrl: kind === 'PRE_CLAIM' ? callbackUrl : null,
    attemptCount: 0,
  }
}

export type { CallbackRecoveryKind, CallbackRecoveryPhase, CallbackRecoveryState } from './callback-recovery.types'

export function tickCallbackRecovery(state: CallbackRecoveryState): CallbackRecoveryState {
  if (state.phase !== 'WAITING') return state
  const secondsRemaining = Math.max(0, state.secondsRemaining - 1)
  return { ...state, secondsRemaining, phase: secondsRemaining === 0 ? 'READY' : 'WAITING' }
}

export async function runCallbackRecovery(
  state: CallbackRecoveryState,
  action: (target: string | null) => void | Promise<void>,
): Promise<CallbackRecoveryState> {
  const canRun = state.phase === 'READY' || state.phase === 'CONTRACT_ERROR' || (state.kind === 'POST_CLAIM' && state.phase === 'NAVIGATION_ERROR')
  if (!canRun || (state.kind === 'PRE_CLAIM' && state.attemptCount > 0)) return state
  const attempted = { ...state, attemptCount: state.attemptCount + 1 }
  try {
    await action(attempted.callbackUrl)
    return attempted
  } catch {
    return {
      ...attempted,
      phase: attempted.kind === 'PRE_CLAIM'
        ? 'EXHAUSTED'
        : attempted.kind === 'INVALID_CONTRACT'
          ? 'CONTRACT_ERROR'
          : 'NAVIGATION_ERROR',
    }
  }
}
