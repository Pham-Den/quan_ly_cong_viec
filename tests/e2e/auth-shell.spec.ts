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

  await page.getByRole('menuitem', { name: 'Tổng quan' }).click()
  await page.getByPlaceholder('Ghi nhanh yêu cầu mới...').fill('Tạo API export báo cáo')
  await page.locator('form').getByRole('button', { name: 'Thêm note' }).click()

  await page.getByRole('menuitem', { name: 'Inbox' }).click()
  await expect(page.getByRole('heading', { name: 'Inbox' })).toBeVisible()
  const inboxPanel = page.locator('.planning-grid .settings-card').nth(1)
  await expect(inboxPanel.getByText('Tạo API export báo cáo')).toBeVisible()
  await expect(inboxPanel.getByText('Tất cả')).toBeVisible()
  await inboxPanel.getByRole('button', { name: 'Lưu trữ' }).click()
  await expect(inboxPanel.getByText('Đã lưu trữ')).toBeVisible()
  await inboxPanel.locator('.ant-select').first().click()
  await page.locator('.ant-select-dropdown:visible').getByText('Đang chờ', { exact: true }).click()
  await expect(inboxPanel.getByText('Tạo API export báo cáo')).toBeHidden()
  await inboxPanel.locator('.ant-select').first().click()
  await page.locator('.ant-select-dropdown:visible').getByText('Đã lưu trữ', { exact: true }).click()
  await expect(inboxPanel.getByText('Tạo API export báo cáo')).toBeVisible()
  await inboxPanel.getByRole('button', { name: 'Chuyển task' }).click()
  await expect(page.getByText('Chuyển note thành task')).toBeVisible()
  await page.locator('.ant-drawer').getByRole('button', { name: 'Tạo task' }).click()

  await expect(inboxPanel.getByText('Tạo API export báo cáo')).toBeHidden()
  await expect(page.locator('.settings-card').last().getByText('Tạo API export báo cáo')).toBeVisible()
  await page.getByRole('button', { name: 'Sẵn sàng main' }).first().click()
  await expect(page.getByText('READY_PROD')).toBeVisible()

  await page.getByRole('menuitem', { name: 'All Tasks' }).click()
  await expect(page.getByRole('heading', { name: 'All Tasks' })).toBeVisible()
  await expect(page.getByText('Tạo API export báo cáo')).toBeVisible()

  await page.getByRole('menuitem', { name: 'Branches' }).click()
  await expect(page.getByRole('heading', { name: 'Branches' })).toBeVisible()
  await page.getByRole('button', { name: 'Tạo branch' }).click()
  const branchDrawer = page.locator('.ant-drawer')
  await branchDrawer.locator('.ant-select').nth(3).click()
  await page.locator('.ant-select-dropdown:visible .ant-select-item-option-content').getByText(/OPS-001/).click()
  await branchDrawer.getByPlaceholder('feature/OPS-BE-001-export-report').fill('feature/OPS-001-export-report')
  await branchDrawer.getByRole('button', { name: 'Tạo branch' }).click()

  await expect(page.getByText('feature/OPS-001-export-report')).toBeVisible()
  await page.getByRole('button', { name: 'Merge release' }).first().click()
  await expect(page.getByText('MERGED_RELEASE')).toBeVisible()

  await page.getByRole('button', { name: 'Tạo branch' }).click()
  await branchDrawer.locator('.ant-select').nth(4).click()
  await page
    .locator('.ant-select-dropdown:visible .ant-select-item-option-content')
    .getByText('feature/OPS-001-export-report', { exact: true })
    .click()
  await branchDrawer.getByPlaceholder('feature/OPS-BE-001-export-report').fill('feature/OPS-001-export-report-fix')
  await branchDrawer.getByRole('button', { name: 'Tạo branch' }).click()

  await expect(page.getByText('feature/OPS-001-export-report-fix')).toBeVisible()
  await page.getByRole('button', { name: 'Merge main' }).first().click()
  await expect(page.getByText('MERGED_MAIN')).toBeVisible()

  await page.getByRole('menuitem', { name: 'All Tasks' }).click()
  await expect(page.getByText('DONE')).toBeVisible()

  await page.getByRole('menuitem', { name: 'Timeline' }).click()
  await expect(page.getByRole('heading', { name: 'Timeline' })).toBeVisible()
  await expect(page.getByText(/merged vao main/)).toBeVisible()
  await page.getByPlaceholder('Ví dụ: Cần kiểm tra lại case export').fill('Review Phase 7')
  await page.getByLabel('Nội dung').fill('Timeline đã ghi được note, task, branch và comment.')
  await page.getByRole('button', { name: 'Thêm ghi chú' }).click()
  await expect(page.getByText('Review Phase 7')).toBeVisible()
})
