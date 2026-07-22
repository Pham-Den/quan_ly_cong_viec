import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { expect, test } from '@playwright/test'

// Sprint: v1 | TC-072 | Task Group: 02C Browser session cutover
// Contract: SCREEN-009 four states + DS-COMP-012 seven-state visual/accessibility evidence | Pack: v1.7.21-oidc-session-error-contracts

const evidenceRoot = join(process.cwd(), 'docs/evidence/accessibility/TC-072')
const callbackBaseUrl = process.env.CALLBACK_E2E_BASE_URL ?? ''
const fixtures = [
  ['pre-wait', 'auth-callback-retry-required', 'Thử hoàn tất đăng nhập', true],
  ['pre-ready', 'auth-callback-retry-required', 'Thử hoàn tất đăng nhập', false],
  ['pre-exhausted', 'auth-callback-retry-exhausted', 'Quay lại đăng nhập', false],
  ['post-wait', 'auth-restart-required', 'Đăng nhập lại', true],
  ['post-ready', 'auth-restart-required', 'Đăng nhập lại', false],
  ['navigation-error', 'auth-restart-error', 'Thử lại đăng nhập', false],
  ['invalid-contract', 'auth-callback-recovery-invalid', 'Bắt đầu đăng nhập lại', false],
] as const

test('public SPA callback owns the pre-session shell, makes one explicit API-018 request and follows the validated return path', async ({ page }) => {
  let callbackRequestMethod = ''
  let callbackRequestBody: unknown = null
  let callbackRequestCount = 0
  let releaseCallback!: () => void
  const callbackRelease = new Promise<void>((resolve) => {
    releaseCallback = resolve
  })
  await page.route('http://localhost:4000/api/v1/auth/callback**', async (route) => {
    callbackRequestCount += 1
    callbackRequestMethod = route.request().method()
    callbackRequestBody = route.request().postDataJSON()
    await callbackRelease
    await route.fulfill({
      status: 200,
      headers: {
        'access-control-allow-origin': 'http://127.0.0.1:5174',
        'access-control-allow-credentials': 'true',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ returnTo: '/settings' }),
    })
  })
  await page.route('http://localhost:4000/api/v1/auth/session', async (route) => {
    await route.fulfill({
      status: 200,
      headers: {
        'access-control-allow-origin': 'http://127.0.0.1:5174',
        'access-control-allow-credentials': 'true',
        'content-type': 'application/json',
        etag: '"session-r1"',
      },
      body: JSON.stringify({
        actor: { id: 'actor-1', displayName: 'OIDC User' },
        expiresAt: '2026-07-20T18:00:00.000Z',
        lastActivityAt: '2026-07-20T12:00:00.000Z',
        idleExpiresAt: '2026-07-20T12:15:00.000Z',
        csrfToken: 'request-local-csrf',
      }),
    })
  })
  await page.route('http://localhost:4000/api/projects', async (route) => {
    await route.fulfill({
      status: 200,
      headers: {
        'access-control-allow-origin': 'http://127.0.0.1:5174',
        'access-control-allow-credentials': 'true',
        'content-type': 'application/json',
      },
      body: '[]',
    })
  })

  await page.goto(`${callbackBaseUrl}/auth/callback?code=browser-code&state=browser-state`)
  await expect(page.locator('#auth-callback-processing')).toBeVisible()
  await expect(page.locator('.app-shell')).toHaveCount(0)
  mkdirSync(evidenceRoot, { recursive: true })
  await page.screenshot({ path: join(evidenceRoot, 'screen-009-callback-processing-chromium-1280.png'), fullPage: true })
  await expect.poll(() => callbackRequestCount).toBe(1)
  releaseCallback()
  await expect(page).toHaveURL(`${callbackBaseUrl}/settings`)
  expect(callbackRequestCount).toBe(1)
  expect(callbackRequestMethod).toBe('POST')
  expect(callbackRequestBody).toEqual({ code: 'browser-code', state: 'browser-state' })
})

test('SCREEN-009 exposes login-entry and invalid-callback states without protected content', async ({ page, browserName }) => {
  await page.goto(`${callbackBaseUrl}/login`)
  await expect(page.locator('#auth-login-entry')).toBeVisible()
  await expect(page.locator('.app-shell')).toHaveCount(0)
  mkdirSync(evidenceRoot, { recursive: true })
  await page.screenshot({ path: join(evidenceRoot, `screen-009-login-entry-${browserName}-1280.png`), fullPage: true })

  await page.goto(`${callbackBaseUrl}/auth/callback`)
  const invalid = page.locator('#auth-callback-invalid')
  await expect(invalid).toBeVisible()
  await expect(invalid.locator('h1')).toBeFocused()
  await expect(page.locator('.app-shell')).toHaveCount(0)
  await page.screenshot({ path: join(evidenceRoot, `screen-009-callback-invalid-${browserName}-1280.png`), fullPage: true })
})

for (const [fixture, hook, action, disabled] of fixtures) {
  test(`DS-COMP-012 renders ${fixture} with stable focus and action state`, async ({ page, browserName }) => {
    await page.goto(`${callbackBaseUrl}/login?recoveryFixture=${fixture}`)
    const region = page.locator(`#${hook}`)
    await expect(region).toBeVisible()
    await expect(region.locator('h2')).toBeFocused()
    const button = region.getByRole('button', { name: action })
    if (disabled) await expect(button).toBeDisabled()
    else await expect(button).toBeEnabled()
    mkdirSync(evidenceRoot, { recursive: true })
    await page.screenshot({ path: join(evidenceRoot, `${fixture}-${browserName}-1280.png`), fullPage: true })
    writeFileSync(
      join(evidenceRoot, `${fixture}-${browserName}-1280.focus.log`),
      JSON.stringify({ fixture, hook, focusedTag: await page.evaluate(() => document.activeElement?.tagName), focusedText: await page.evaluate(() => document.activeElement?.textContent?.trim()) }, null, 2),
    )
  })
}

for (const fixture of ['post-ready', 'invalid-contract'] as const) {
  test(`${fixture} fresh-login CTA always uses the fixed safe landing path`, async ({ page }) => {
    let loginRequest: { method: string; body: unknown } | null = null
    await page.route('http://localhost:4000/api/v1/auth/login**', async (route) => {
      loginRequest = { method: route.request().method(), body: route.request().postDataJSON() }
      await route.abort()
    })
    await page.goto(`${callbackBaseUrl}/login?recoveryFixture=${fixture}&returnTo=/auth/callback?code=stale&state=stale`)
    await page.locator('#auth-restart-login').click()
    await expect.poll(() => loginRequest).not.toBeNull()
    expect(loginRequest).toEqual({ method: 'POST', body: { returnTo: '/' } })
  })
}

test('pre-claim exhausted CTA clears recovery without a request and the next login uses only safe root returnTo', async ({ page }) => {
  const loginRequests: Array<{ method: string; body: unknown }> = []
  await page.route('http://localhost:4000/api/v1/auth/login**', async (route) => {
    loginRequests.push({ method: route.request().method(), body: route.request().postDataJSON() })
    await route.abort()
  })
  await page.goto(`${callbackBaseUrl}/login?recoveryFixture=pre-exhausted&returnTo=/auth/callback?code=stale&state=stale`)
  await page.getByRole('button', { name: 'Quay lại đăng nhập' }).click()
  await expect(page.locator('#auth-callback-retry-exhausted')).toHaveCount(0)
  const ordinaryLogin = page.getByRole('button', { name: 'Đăng nhập với Central IAM' })
  await expect(ordinaryLogin).toBeVisible()
  expect(loginRequests).toHaveLength(0)

  await ordinaryLogin.click()
  await expect.poll(() => loginRequests.length).toBe(1)
  expect(loginRequests[0]).toEqual({ method: 'POST', body: { returnTo: '/' } })
})
