import { expect, test } from '@playwright/test'

const email = 'system.manager.e2e@example.com'
const password = 'password123'

test('system manager seeded topology graph, search, edge detail, and flow', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveURL(/\/setup$/)
  await page.locator('input[autocomplete="name"]').fill('System Manager E2E')
  await page.locator('input[autocomplete="email"]').fill(email)
  await page.locator('input[autocomplete="new-password"]').fill(password)
  await page.getByRole('button', { name: 'Tạo tài khoản' }).click()

  await page.getByRole('menuitem', { name: 'System Manager' }).click()
  await expect(page).toHaveURL(/\/system-manager$/)
  await expect(page.getByRole('heading', { name: 'System Manager' })).toBeVisible()
  await expect(page.locator('.vue-flow__node')).not.toHaveCount(0)
  await expect(page.locator('.vue-flow__node').filter({ hasText: 'B2P' }).first()).toBeVisible()
  await expect(page.locator('.vue-flow__node').filter({ hasText: 'MariaDB' })).toBeVisible()

  await page.getByPlaceholder('Tìm name, IP, config key...').fill('DB_HOST')
  await page.getByRole('button', { name: /DB_HOST/ }).first().click()
  await expect(page.getByText('Config detail')).toBeVisible()
  await expect(page.getByText('DB_HOST=mariadb-local.company.local')).toBeVisible()

  await page.getByRole('button', { name: 'Bung component' }).click()
  await expect(page.locator('.vue-flow__node').filter({ hasText: 'B2P Web/API' })).toBeVisible()
  await expect(page.locator('.vue-flow__node').filter({ hasText: 'B2P Queue Worker' })).toBeVisible()

  await page.locator('.vue-flow__node').filter({ hasText: 'B2P Web/API' }).click()
  await page.getByRole('button', { name: 'Start flow' }).click()
  await expect(page.getByRole('tab', { name: 'Flow' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('.flow-step').filter({ hasText: 'Redis' })).toBeVisible()
  await expect(page.locator('.flow-step').filter({ hasText: /REDIS_HOST \+3/ })).toBeVisible()

  await page.getByRole('button', { name: 'Quản lý dữ liệu' }).click()
  const drawer = page.locator('.ant-drawer').filter({ hasText: 'Quản lý dữ liệu System Manager' })
  await expect(drawer).toBeVisible()
  await expect(drawer.getByRole('tab', { name: 'Nodes' })).toBeVisible()
  await expect(drawer.getByRole('button', { name: /B2P Web\/API/ })).toBeVisible()
  await drawer.getByRole('tab', { name: 'Dependencies' }).click()
  await expect(drawer.getByRole('button', { name: /DB_HOST/ }).first()).toBeVisible()
  await expect(drawer.getByText('Config dependency theo environment')).toBeVisible()
  await expect(drawer.getByText('Environment config')).toBeVisible()
})
