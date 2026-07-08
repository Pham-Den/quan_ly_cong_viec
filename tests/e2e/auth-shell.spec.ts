import { expect, test } from '@playwright/test'

const email = 'khanh.e2e@example.com'
const password = 'password123'

test('first-run setup, logout, login, and session restore', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveURL(/\/setup$/)
  await expect(page.getByRole('heading', { name: 'Tạo tài khoản đầu tiên' })).toBeVisible()

  await page.locator('input[autocomplete="name"]').fill('Khanh E2E')
  await page.locator('input[autocomplete="email"]').fill(email)
  await page.locator('input[autocomplete="new-password"]').fill(password)
  await page.getByRole('button', { name: 'Tạo tài khoản' }).click()

  await expect(page.getByRole('heading', { name: 'Tổng quan' })).toBeVisible()
  await expect(page.getByText('PERSONAL - Cong viec ca nhan')).toBeVisible()
  await expect(page.getByText('Task, branch, release và main')).toBeVisible()

  await page.getByRole('button', { name: 'Khanh E2E' }).click()
  await page.getByText('Đăng xuất').click()

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible()

  await page.locator('input[autocomplete="email"]').fill(email)
  await page.locator('input[autocomplete="current-password"]').fill(password)
  await page.getByRole('button', { name: 'Đăng nhập' }).click()

  await expect(page.getByRole('heading', { name: 'Tổng quan' })).toBeVisible()

  await page.reload()

  await expect(page.getByRole('heading', { name: 'Tổng quan' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Khanh E2E' })).toBeVisible()

  await page.getByRole('menuitem', { name: 'Cài đặt' }).click()
  await expect(page).toHaveURL(/\/settings$/)
  await expect(page.getByRole('heading', { name: 'Cài đặt' })).toBeVisible()

  const projectPanel = page.locator('.settings-card').first()
  await projectPanel.getByLabel('Mã dự án').fill('OPS')
  await projectPanel.getByLabel('Tên dự án').fill('Dự án vận hành')
  await projectPanel.getByRole('button', { name: 'Thêm dự án' }).click()
  await expect(projectPanel.getByRole('cell', { name: 'OPS' })).toBeVisible()
  await expect(projectPanel.getByRole('cell', { name: /Dự án vận hành/ })).toBeVisible()
  await expect(projectPanel.getByText('Đang chọn')).toBeVisible()

  const workspacePanel = page.locator('.settings-card').nth(1)
  await workspacePanel.locator('input').nth(0).fill('BE')
  await workspacePanel.locator('input').nth(1).fill('Backend')
  await workspacePanel.getByRole('button', { name: 'Thêm nhóm' }).click()
  await expect(workspacePanel.getByText('OPS-BE-001')).toBeVisible()

  await page.getByRole('tab', { name: 'Repository' }).click()
  const repositoryInputs = workspacePanel.locator('input:visible:not([readonly])')
  await repositoryInputs.nth(0).fill('backend-api')
  await repositoryInputs.nth(1).fill('https://gitlab.local')
  await repositoryInputs.nth(2).fill('team/backend-api')
  await repositoryInputs.nth(4).fill('glpat-token')
  await workspacePanel.getByRole('button', { name: 'Thêm repository' }).click()
  await expect(workspacePanel.getByRole('cell', { name: 'backend-api', exact: true })).toBeVisible()
  await expect(workspacePanel.getByText('team/backend-api')).toBeVisible()
  await expect(workspacePanel.getByText('Có token')).toBeVisible()
})
