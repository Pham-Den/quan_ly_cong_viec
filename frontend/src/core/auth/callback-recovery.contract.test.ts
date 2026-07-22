// @ts-nocheck -- executed by Node/tsx; excluded from browser runtime behavior.
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { createPinia, setActivePinia } from 'pinia'
import { AxiosError } from 'axios'

import { createCallbackRecovery, runCallbackRecovery, tickCallbackRecovery } from './callback-recovery.ts'
import { createAuthLifecycleHandlers } from './auth-lifecycle.ts'
import { AUTH_MESSAGES } from './auth-messages.ts'
import { configureSessionScheduler, useSessionStore } from '../../stores/session.ts'
import { api } from '../../services/api.ts'

// Sprint: v1 | TC-065/TC-072 | Task Group: 02C Browser session cutover
// Contract: DS-COMP-012, API-017/018/024 | Pack: v1.7.21-oidc-session-error-contracts

const memory = new Map<string, string>()
const scheduled = new Map<number, () => void>()
let nextScheduleId = 1
configureSessionScheduler({
  setInterval: (handler) => {
    const id = nextScheduleId++
    scheduled.set(id, handler)
    return id as never
  },
  clearInterval: (handle) => { scheduled.delete(handle as number) },
})
function advanceCountdown() {
  for (const handler of [...scheduled.values()]) handler()
}
globalThis.localStorage = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => { memory.set(key, value) },
  removeItem: (key: string) => { memory.delete(key) },
  clear: () => { memory.clear() },
  key: (index: number) => [...memory.keys()][index] ?? null,
  get length() { return memory.size },
} as Storage

test('MSG-046/047/048 remain externalized with exact approved Vietnamese copy', () => {
  assert.equal(AUTH_MESSAGES.MSG_046, 'Dịch vụ xác thực tạm thời gián đoạn nên phiên đăng nhập chưa được tạo. Hãy bắt đầu đăng nhập lại.')
  assert.equal(AUTH_MESSAGES.MSG_047, 'Dịch vụ lưu phiên đăng nhập tạm thời gián đoạn. Bạn có thể thử hoàn tất đăng nhập thêm một lần.')
  assert.equal(AUTH_MESSAGES.MSG_048, 'Không thể xác minh cách khôi phục đăng nhập an toàn. Hãy bắt đầu đăng nhập lại.')
})

test('DS-COMP-012 state machine covers waiting, ready, exhausted and navigation-error branches', async () => {
  const preWaiting = createCallbackRecovery('PRE_CLAIM', 1, '/api/v1/auth/callback?code=c&state=s')
  assert.equal(preWaiting.phase, 'WAITING')
  const preReady = tickCallbackRecovery(preWaiting)
  assert.equal(preReady.phase, 'READY')
  let callbackAttempts = 0
  const exhausted = await runCallbackRecovery(preReady, async () => { callbackAttempts += 1; throw new Error('still unavailable') })
  assert.equal(exhausted.phase, 'EXHAUSTED')
  await runCallbackRecovery(exhausted, async () => { callbackAttempts += 1 })
  assert.equal(callbackAttempts, 1)

  const postReady = createCallbackRecovery('POST_CLAIM', 0)
  let loginAttempts = 0
  const failedNavigation = await runCallbackRecovery(postReady, async () => { loginAttempts += 1; throw new Error('navigation failed') })
  assert.equal(failedNavigation.phase, 'NAVIGATION_ERROR')
  const retriedNavigation = await runCallbackRecovery(failedNavigation, async () => { loginAttempts += 1 })
  assert.equal(retriedNavigation.attemptCount, 2)
  assert.equal(loginAttempts, 2)
  assert.equal(tickCallbackRecovery(preReady), preReady)
  assert.equal(createCallbackRecovery('PRE_CLAIM', -1).secondsRemaining, 0)
  assert.equal(createCallbackRecovery('POST_CLAIM', 0, '/must-not-survive').callbackUrl, null)
  const invalid = createCallbackRecovery('INVALID_CONTRACT', 30, '/must-not-survive')
  assert.equal(invalid.phase, 'CONTRACT_ERROR')
  assert.equal(invalid.callbackUrl, null)
  let safeRestarts = 0
  const restarted = await runCallbackRecovery(invalid, async () => { safeRestarts += 1 })
  assert.equal(safeRestarts, 1)
  assert.equal(restarted.attemptCount, 1)
  const failedSafeRestart = await runCallbackRecovery(invalid, async () => { throw new Error('navigation failed') })
  assert.equal(failedSafeRestart.phase, 'CONTRACT_ERROR')
})

test('session store permits exactly one pre-claim callback retry and fresh-login retry after navigation failure', async () => {
  setActivePinia(createPinia())
  const session = useSessionStore()
  session.startCallbackRetryCountdown(0, '/api/v1/auth/callback?code=c&state=s')
  let callbacks = 0
  await session.retryCallback(async () => { callbacks += 1; throw new Error('callback unavailable') })
  await session.retryCallback(async () => { callbacks += 1 })
  assert.equal(callbacks, 1)
  assert.equal(session.callbackRecovery?.phase, 'EXHAUSTED')

  session.startRestartCountdown(0)
  let logins = 0
  await session.restartLogin('/', async () => { logins += 1; throw new Error('navigation unavailable') })
  assert.equal(session.callbackRecovery?.phase, 'NAVIGATION_ERROR')
  await session.restartLogin('/', async () => { logins += 1 })
  assert.equal(logins, 2)
  session.startInvalidCallbackRecovery()
  await session.restartLogin('/', async () => { logins += 1; throw new Error('navigation unavailable') })
  assert.equal(logins, 3)
  assert.equal(session.callbackRecovery?.phase, 'CONTRACT_ERROR')
  assert.equal(session.lastError, 'Không thể xác minh cách khôi phục đăng nhập an toàn. Hãy bắt đầu đăng nhập lại.')
  await session.restartLogin('/', async () => { logins += 1 })
  assert.equal(logins, 4)
  session.clearCallbackRecovery()
})

test('session store owns project/session state and advances both countdowns to ready', async () => {
  setActivePinia(createPinia())
  const session = useSessionStore()
  session.setSession({
    actor: { id: 'actor-1', displayName: 'Actor One', email: 'actor@example.test' },
    expiresAt: '2026-07-20T12:00:00.000Z',
    lastActivityAt: '2026-07-20T11:00:00.000Z',
    idleExpiresAt: '2026-07-20T11:15:00.000Z',
    csrfToken: 'csrf-memory',
  }, [{ id: 'project-1', code: 'P1', name: 'Project One', defaultRepoId: null }])
  assert.equal(session.isAuthenticated, true)
  assert.equal(session.selectedProject?.id, 'project-1')
  session.selectProject(null)
  assert.equal(memory.has('qlcv.selectedProjectId'), false)

  session.startCallbackRetryCountdown(2, '/api/v1/auth/callback?code=c&state=s')
  advanceCountdown()
  assert.equal(session.callbackRecovery?.phase, 'WAITING')
  advanceCountdown()
  assert.equal(session.callbackRecovery?.phase, 'READY')
  session.startRestartCountdown(2)
  advanceCountdown()
  assert.equal(session.callbackRecovery?.phase, 'WAITING')
  advanceCountdown()
  assert.equal(session.callbackRecovery?.phase, 'READY')
  assert.equal(session.restartAfterSeconds, 0)
  session.clearCallbackRecovery()
})

test('session store restores, refreshes, expires and logs out through the cookie API', async () => {
  setActivePinia(createPinia())
  const session = useSessionStore()
  const originalGet = api.get
  const originalPost = api.post
  const apiSession = {
    actor: { id: 'actor-2', displayName: 'Actor Two' },
    expiresAt: '2026-07-20T12:00:00.000Z', lastActivityAt: '2026-07-20T11:00:00.000Z',
    idleExpiresAt: '2026-07-20T11:15:00.000Z', csrfToken: 'csrf-memory',
  }
  const projects = [{ id: 'project-2', code: 'P2', name: 'Project Two', defaultRepoId: null }]
  try {
    api.get = (async (url: string) => url === '/api/v1/auth/session'
      ? { status: 200, data: apiSession, headers: { etag: 'W/"2"' } }
      : { status: 200, data: projects, headers: {} }) as never
    await session.restoreSession(true)
    assert.equal(session.user?.id, 'actor-2')
    assert.equal(session.loading, false)
    await session.fetchMe()
    session.setSession(apiSession)
    assert.equal(session.user?.email, '')

    api.get = (async (url: string) => url === '/api/v1/auth/session'
      ? { status: 304, data: '', headers: { etag: 'W/"2"' } }
      : { status: 200, data: projects, headers: {} }) as never
    await session.restoreSession(true)
    assert.deepEqual(session.projects, projects)

    api.get = (async () => { throw new AxiosError('unauthorized', 'ERR_BAD_RESPONSE', undefined, undefined, { status: 401 } as never) }) as never
    await session.restoreSession(true)
    assert.equal(session.user, null)

    api.get = (async () => { throw new Error('offline') }) as never
    await session.restoreSession(true)
    assert.equal(session.lastError, 'Không thể khôi phục phiên đăng nhập.')

    api.get = (async () => {
      throw new AxiosError('unavailable', 'ERR_BAD_RESPONSE', undefined, undefined, {
        status: 503,
        data: { error: { message: 'Dịch vụ thử nghiệm không khả dụng.' } },
      } as never)
    }) as never
    await session.restoreSession(true)
    assert.equal(session.lastError, 'Dịch vụ thử nghiệm không khả dụng.')

    session.startRestartCountdown(0)
    await session.restartLogin('/', async () => {})
    assert.equal(session.callbackRecovery?.phase, 'READY')
    assert.equal(session.lastError, null)

    let posts = 0
    api.post = (async () => { posts += 1; throw new Error('logout response lost') }) as never
    await assert.rejects(session.logout())
    assert.equal(posts, 1)
    assert.equal(session.selectedProjectId, null)
  } finally {
    api.get = originalGet
    api.post = originalPost
  }
})

test('session action guards reject wrong recovery kinds and invalid callback targets without side effects', async () => {
  memory.set('qlcv.selectedProjectId', 'project-keep')
  setActivePinia(createPinia())
  const session = useSessionStore()
  const projects = [
    { id: 'project-keep', code: 'KEEP', name: 'Keep', defaultRepoId: null },
    { id: 'project-next', code: 'NEXT', name: 'Next', defaultRepoId: null },
  ]
  session.setSession({
    actor: { id: 'actor-3', displayName: 'Actor Three' },
    expiresAt: '', lastActivityAt: '', idleExpiresAt: '', csrfToken: 'csrf',
  }, projects)
  assert.equal(session.selectedProjectId, 'project-keep')
  let calls = 0
  await session.retryCallback(async () => { calls += 1 })
  session.startRestartCountdown(0)
  await session.retryCallback(async () => { calls += 1 })
  session.callbackRecovery = createCallbackRecovery('PRE_CLAIM', 0, null)
  await session.retryCallback(async () => { calls += 1 })
  session.callbackRecovery = createCallbackRecovery('PRE_CLAIM', 0, '/api/v1/auth/callback')
  await session.restartLogin('/', async () => { calls += 1 })
  assert.equal(calls, 0)
  session.clearCallbackRecovery()
})

test('session restore coalesces requests and covers invalid selection and malformed server errors', async () => {
  memory.set('qlcv.selectedProjectId', 'missing-project')
  setActivePinia(createPinia())
  const session = useSessionStore()
  const originalGet = api.get
  let release!: () => void
  const gate = new Promise<void>((resolve) => { release = resolve })
  let gets = 0
  try {
    api.get = (async (url: string) => {
      gets += 1
      await gate
      return url === '/api/v1/auth/session'
        ? { status: 304, data: '', headers: {} }
        : { status: 200, data: [], headers: {} }
    }) as never
    const first = session.restoreSession(true)
    const coalesced = session.restoreSession()
    release()
    await Promise.all([first, coalesced])
    assert.equal(gets, 2)
    assert.equal(session.selectedProject, null)

    for (const data of [{}, { error: null }, { error: {} }, { error: { message: 42 } }]) {
      api.get = (async () => {
        throw new AxiosError('unavailable', 'ERR_BAD_RESPONSE', undefined, undefined, { status: 503, data } as never)
      }) as never
      await session.restoreSession(true)
      assert.equal(session.lastError, 'Không thể khôi phục phiên đăng nhập.')
    }
  } finally {
    api.get = originalGet
  }
})

test('auth lifecycle routes both recovery boundaries to LoginView with only the permitted state', async () => {
  setActivePinia(createPinia())
  const session = useSessionStore()
  const replacements: unknown[] = []
  const route = { value: { name: 'dashboard', fullPath: '/systems/host-1/api-lab' } }
  const handlers = createAuthLifecycleHandlers(session, {
    currentRoute: route,
    replace: async (target) => { replacements.push(target); route.value = { name: target.name, fullPath: '/login' } },
  }, () => { replacements.push('notified') })
  await handlers.onCallbackRetryRequired(5, '/api/v1/auth/callback?code=c&state=s')
  assert.equal(session.callbackRecovery?.kind, 'PRE_CLAIM')
  assert.deepEqual(replacements[0], { name: 'login' })
  route.value = { name: 'dashboard', fullPath: '/systems/host-1/api-lab' }
  await handlers.onCallbackRecoveryInvalid()
  assert.equal(session.callbackRecovery?.kind, 'INVALID_CONTRACT')
  assert.deepEqual(replacements[1], { name: 'login' })
  route.value = { name: 'dashboard', fullPath: '/systems/host-1/api-lab' }
  await handlers.onRestartRequired(7)
  assert.equal(session.callbackRecovery?.kind, 'POST_CLAIM')
  assert.deepEqual(replacements[2], { name: 'login' })
  handlers.onSessionRefreshed({ actor: { id: 'actor-4', displayName: 'Actor Four' }, expiresAt: '', lastActivityAt: '', idleExpiresAt: '', csrfToken: 'csrf' })
  assert.equal(session.user?.id, 'actor-4')
  route.value = { name: 'dashboard', fullPath: '/' }
  await handlers.onSessionExpired()
  assert.equal(replacements.includes('notified'), true)
  assert.deepEqual(replacements.at(-1), { name: 'login' })
  await handlers.onSessionExpired()
  session.clearCallbackRecovery()
})

test('session-expiry lifecycle coalesces concurrent redirects', async () => {
  setActivePinia(createPinia())
  const session = useSessionStore()
  let release!: () => void
  const pending = new Promise<void>((resolve) => { release = resolve })
  let redirects = 0
  const handlers = createAuthLifecycleHandlers(session, {
    currentRoute: { value: { name: 'dashboard', fullPath: '/' } },
    replace: async () => { redirects += 1; await pending },
  }, () => {})
  const first = handlers.onSessionExpired()
  await handlers.onSessionExpired()
  release()
  await first
  assert.equal(redirects, 1)
})
