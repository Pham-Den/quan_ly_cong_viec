import { expect, test } from '@playwright/test'

import { resetE2eDatabase } from './reset-e2e-db'

const email = 'api.lab.e2e@example.com'
const password = 'password123'
const apiBaseUrl = 'http://127.0.0.1:4100'

test.setTimeout(60_000)

test.beforeEach(() => {
  resetE2eDatabase()
})

test('api lab creates environment, imports curl, saves and runs a request', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveURL(/\/setup$/)
  await page.locator('input[autocomplete="name"]').fill('API Lab E2E')
  await page.locator('input[autocomplete="email"]').fill(email)
  await page.locator('input[autocomplete="new-password"]').fill(password)
  await page.getByRole('button', { name: 'Tạo tài khoản' }).click()

  await page.getByRole('menuitem', { name: 'API Lab' }).click()
  await expect(page).toHaveURL(/\/api-lab$/)
  await expect(page.getByRole('heading', { name: 'API Lab' })).toBeVisible()

  await page.getByPlaceholder('http://localhost:4000').fill(apiBaseUrl)
  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('/api/api-lab/environments') &&
      response.request().method() === 'POST' &&
      response.ok(),
    ),
    page.getByRole('button', { name: 'Lưu environment' }).click(),
  ])
  await expect(page.getByText('local (local)')).toBeVisible()

  await page.getByRole('button', { name: 'Import cURL' }).click()
  const curlDrawer = page.locator('.ant-drawer-content:visible').filter({ hasText: 'Import cURL' })
  await expect(curlDrawer).toBeVisible()
  await curlDrawer.locator('textarea').fill(`curl '${apiBaseUrl}/health' -H 'Accept: application/json'`)
  await Promise.all([
    page.waitForResponse((response) => response.url().includes('/api/api-lab/import-curl') && response.ok()),
    curlDrawer.getByRole('button', { name: 'Import vào request' }).click(),
  ])
  await expect(curlDrawer).not.toBeVisible()

  await page.getByPlaceholder('Login, tạo đơn, kiểm tra trạng thái...').fill('Health check')
  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('/api/api-lab/requests') &&
      response.request().method() === 'POST' &&
      response.ok(),
    ),
    page.getByRole('button', { name: 'Lưu request' }).click(),
  ])
  await expect(page.locator('.api-lab-request-list').getByText('Health check')).toBeVisible()

  await Promise.all([
    page.waitForResponse((response) => response.url().includes('/api/api-lab/requests/') && response.url().includes('/run') && response.ok()),
    page.getByRole('button', { name: 'Chạy request' }).click(),
  ])
  await expect(page.getByText('PASSED')).toBeVisible()
  await expect(page.getByText('quan-ly-cong-viec-api')).toBeVisible()

  await Promise.all([
    page.waitForResponse((response) => response.url().includes('/api/api-lab/request-runs/') && response.ok()),
    page.getByRole('button', { name: 'Lưu kết quả' }).click(),
  ])
  await expect(page.getByText('Đã lưu body')).toBeVisible()
})
