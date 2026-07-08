import { expect, test } from '@playwright/test'

const email = 'khanh.e2e@example.com'
const password = 'password123'
const apiBaseUrl = 'http://127.0.0.1:4100'

function releaseName(date = new Date()) {
  return `release/${String(date.getDate()).padStart(2, '0')}${String(date.getMonth() + 1).padStart(2, '0')}${date.getFullYear()}`
}

test.setTimeout(90_000)

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

  await page.getByRole('tab', { name: 'Workflow' }).click()
  const doneStatusRow = workspacePanel.getByRole('row').filter({ hasText: 'DONE' })
  await doneStatusRow.locator('input').first().fill('Hoàn tất')
  await Promise.all([
    page.waitForResponse((response) => response.url().includes('/api/workflow-statuses/') && response.request().method() === 'PATCH' && response.ok()),
    doneStatusRow.getByRole('button', { name: 'Lưu' }).click(),
  ])
  await expect(doneStatusRow.locator('input').first()).toHaveValue('Hoàn tất')

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
  await expect(page.getByText('Sẵn sàng main')).toBeVisible()

  await page.getByRole('menuitem', { name: 'Tất cả task' }).click()
  await expect(page.getByRole('heading', { name: 'Tất cả task' })).toBeVisible()
  await expect(page.locator('.settings-card').last().getByText('Tạo API export báo cáo')).toBeVisible()

  await page.getByRole('menuitem', { name: 'Nhánh' }).click()
  await expect(page.getByRole('heading', { name: 'Nhánh' })).toBeVisible()
  await page.getByRole('button', { name: 'Tạo branch' }).click()
  const branchDrawer = page.locator('.ant-drawer')
  await branchDrawer.locator('.ant-select').nth(3).click()
  await page.locator('.ant-select-dropdown:visible .ant-select-item-option-content').getByText(/OPS-001/).click()
  await expect(branchDrawer.locator('.ant-form-item').filter({ hasText: 'Tên branch' }).locator('input')).toHaveValue('feature/OPS-001')
  await branchDrawer.getByRole('button', { name: 'Tạo branch' }).click()

  await expect(page.getByText('feature/OPS-001')).toBeVisible()
  await expect(page.getByRole('cell', { name: new RegExp(releaseName()) })).toBeVisible()

  const accessToken = await page.evaluate(() => localStorage.getItem('qlcv.accessToken'))

  if (!accessToken) {
    throw new Error('Missing access token')
  }

  const apiHeaders = { authorization: `Bearer ${accessToken}` }
  const projectsResponse = await page.request.get(`${apiBaseUrl}/api/projects`, { headers: apiHeaders })
  const projects = (await projectsResponse.json()) as Array<{ id: string; code: string }>
  const project = projects.find((item) => item.code === 'OPS')

  if (!project) {
    throw new Error('Missing OPS project')
  }

  const taskGroupsResponse = await page.request.get(`${apiBaseUrl}/api/projects/${project.id}/task-groups`, { headers: apiHeaders })
  const taskGroups = (await taskGroupsResponse.json()) as Array<{ id: string; code: string }>
  const taskGroup = taskGroups.find((item) => item.code === 'BE')
  const repositoriesResponse = await page.request.get(`${apiBaseUrl}/api/projects/${project.id}/repositories`, { headers: apiHeaders })
  const repositories = (await repositoriesResponse.json()) as Array<{ id: string; name: string }>
  const repository = repositories.find((item) => item.name === 'backend-api')

  if (!taskGroup || !repository) {
    throw new Error('Missing BE task group or backend-api repository')
  }

  const extraTaskResponse = await page.request.post(`${apiBaseUrl}/api/tasks`, {
    headers: apiHeaders,
    data: {
      projectId: project.id,
      taskGroupId: taskGroup.id,
      title: 'Sửa validate export',
      priority: 'MEDIUM',
      type: 'FEATURE',
    },
  })

  await expect(extraTaskResponse).toBeOK()
  const extraTask = (await extraTaskResponse.json()) as { id: string; code: string }
  const extraBranchResponse = await page.request.post(`${apiBaseUrl}/api/branches`, {
    headers: apiHeaders,
    data: {
      repositoryId: repository.id,
      name: `feature/${extraTask.code}`,
      checkoutSourceBranch: 'main',
      taskIds: [extraTask.id],
    },
  })

  await expect(extraBranchResponse).toBeOK()

  const deleteTaskResponse = await page.request.post(`${apiBaseUrl}/api/tasks`, {
    headers: apiHeaders,
    data: {
      projectId: project.id,
      taskGroupId: taskGroup.id,
      title: 'Xóa branch nháp',
      priority: 'MEDIUM',
      type: 'FEATURE',
    },
  })

  await expect(deleteTaskResponse).toBeOK()
  const deleteTask = (await deleteTaskResponse.json()) as { id: string; code: string }
  const deleteBranchResponse = await page.request.post(`${apiBaseUrl}/api/branches`, {
    headers: apiHeaders,
    data: {
      repositoryId: repository.id,
      name: `feature/${deleteTask.code}`,
      checkoutSourceBranch: 'main',
      taskIds: [deleteTask.id],
    },
  })

  await expect(deleteBranchResponse).toBeOK()
  await page.getByRole('button', { name: 'Làm mới' }).click()
  await expect(page.getByRole('row').filter({ hasText: `feature/${extraTask.code}` })).toBeVisible()
  const deleteBranchRow = page.getByRole('row').filter({ hasText: `feature/${deleteTask.code}` })
  await expect(deleteBranchRow).toBeVisible()
  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain(`feature/${deleteTask.code}`)
    await dialog.accept()
  })
  await deleteBranchRow.getByRole('button', { name: 'Xóa' }).click()
  await expect(deleteBranchRow).toHaveCount(0)

  await page.getByText('Kanban', { exact: true }).click()
  await page
    .getByTestId(`branch-card-feature/${extraTask.code}`)
    .dragTo(page.getByTestId('branch-card-feature/OPS-001'))
  await expect(page.getByText('Đã cập nhật thứ tự branch.')).toBeVisible()
  const codingBranchTitles = page.getByTestId('kanban-column-CODING').locator('.app-kanban-card-title strong')
  await expect(codingBranchTitles.nth(0)).toHaveText(`feature/${extraTask.code}`)
  await expect(codingBranchTitles.nth(1)).toHaveText('feature/OPS-001')

  await page
    .getByTestId('branch-card-feature/OPS-001')
    .dragTo(page.getByTestId('kanban-column-MERGED_DEVELOP'))
  await expect(
    page.getByTestId('kanban-column-MERGED_DEVELOP').getByText('feature/OPS-001'),
  ).toBeVisible()
  await page.evaluate(() => {
    const source = document.querySelector('[data-testid="branch-card-feature/OPS-001"]')
    const target = document.querySelector('[data-testid="kanban-column-MERGED_MAIN"]')
    const dataTransfer = new DataTransfer()

    source?.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer }))
    target?.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer }))
    target?.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer }))
    source?.dispatchEvent(new DragEvent('dragend', { bubbles: true, cancelable: true, dataTransfer }))
  })
  await expect(page.getByText(/Dùng nút Merge main/)).toBeVisible()
  await expect(
    page.getByTestId('kanban-column-MERGED_DEVELOP').getByText('feature/OPS-001'),
  ).toBeVisible()
  await page.getByTestId('branch-card-feature/OPS-001-actions').click()
  await page.locator('.app-kanban-card-action-panel').last().locator('.ant-select').click()
  await page.locator('.ant-select-dropdown:visible').getByText('Đang code', { exact: true }).click()
  await expect(
    page.getByTestId('kanban-column-CODING').getByText('feature/OPS-001'),
  ).toBeVisible()
  await page.getByText('Bảng', { exact: true }).click()
  await page.getByRole('row').filter({ hasText: 'feature/OPS-001' }).getByRole('button', { name: 'Gắn release' }).click()
  await expect(page.getByText('Gắn release branch')).toBeVisible()
  await page.locator('.ant-modal:visible').getByRole('button', { name: 'Gắn release' }).click()
  await expect(page.getByText('Vào release', { exact: true }).first()).toBeVisible()
  await page
    .getByRole('row')
    .filter({ hasText: `feature/${extraTask.code}` })
    .getByRole('button', { name: 'Gắn release' })
    .click()
  await expect(page.getByText('Gắn release branch')).toBeVisible()
  await page.locator('.ant-modal:visible').getByRole('button', { name: 'Gắn release' }).click()
  await expect(page.getByText('Vào release', { exact: true }).first()).toBeVisible()

  await page.getByText('Kanban', { exact: true }).click()
  const releaseCard = page.getByTestId(`branch-card-${releaseName()}`)
  await expect(releaseCard).toHaveClass(/app-kanban-card-branch-release/)
  await expect(page.getByTestId('branch-card-feature/OPS-001')).toHaveCount(0)
  await expect(releaseCard.getByTestId('release-child-feature/OPS-001')).toBeVisible()
  await releaseCard
    .getByTestId(`release-child-feature/${extraTask.code}`)
    .dragTo(releaseCard.getByTestId('release-child-feature/OPS-001'))
  await expect(page.getByText('Đã cập nhật thứ tự nhánh con.')).toBeVisible()
  const releaseChildTitles = releaseCard.locator('.branch-release-child strong')
  await expect(releaseChildTitles.nth(0)).toHaveText(`feature/${extraTask.code}`)
  await expect(releaseChildTitles.nth(1)).toHaveText('feature/OPS-001')
  await page.evaluate((name) => {
    const source = document.querySelector(`[data-testid="branch-card-${name}"]`)
    const target = document.querySelector('[data-testid="kanban-column-MERGED_MAIN"]')
    const dataTransfer = new DataTransfer()

    source?.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer }))
    target?.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer }))
    target?.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer }))
    source?.dispatchEvent(new DragEvent('dragend', { bubbles: true, cancelable: true, dataTransfer }))
  }, releaseName())
  const mainReleaseCard = page.getByTestId('kanban-column-MERGED_MAIN').getByTestId(`branch-card-${releaseName()}`)
  await expect(mainReleaseCard).toBeVisible()
  await expect(mainReleaseCard.getByTestId('release-child-feature/OPS-001')).toBeVisible()
  await expect(mainReleaseCard.getByText('Đã theo main').first()).toBeVisible()
  await page.evaluate((name) => {
    const source = document.querySelector(`[data-testid="kanban-column-MERGED_MAIN"] [data-testid="branch-card-${name}"]`)
    const target = document.querySelector('[data-testid="kanban-column-MERGED_RELEASE"]')
    const dataTransfer = new DataTransfer()

    source?.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer }))
    target?.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer }))
    target?.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer }))
    source?.dispatchEvent(new DragEvent('dragend', { bubbles: true, cancelable: true, dataTransfer }))
  }, releaseName())
  const rollbackReleaseCard = page.getByTestId('kanban-column-MERGED_RELEASE').getByTestId(`branch-card-${releaseName()}`)
  await expect(rollbackReleaseCard).toBeVisible()
  await expect(rollbackReleaseCard.getByTestId('release-child-feature/OPS-001')).toBeVisible()
  await expect(rollbackReleaseCard.getByText('Đã vào release').first()).toBeVisible()
  await page.evaluate((name) => {
    const source = document.querySelector(`[data-testid="kanban-column-MERGED_RELEASE"] [data-testid="branch-card-${name}"]`)
    const target = document.querySelector('[data-testid="kanban-column-MERGED_MAIN"]')
    const dataTransfer = new DataTransfer()

    source?.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer }))
    target?.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer }))
    target?.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer }))
    source?.dispatchEvent(new DragEvent('dragend', { bubbles: true, cancelable: true, dataTransfer }))
  }, releaseName())
  const mainReleaseCardAfterRollback = page.getByTestId('kanban-column-MERGED_MAIN').getByTestId(`branch-card-${releaseName()}`)
  await expect(mainReleaseCardAfterRollback).toBeVisible()
  await expect(mainReleaseCardAfterRollback.getByText('Đã theo main').first()).toBeVisible()

  await page.getByRole('menuitem', { name: 'Tất cả task' }).click()
  await expect(page.getByText('Hoàn tất')).toBeVisible()

  await page.getByRole('menuitem', { name: 'Dòng thời gian' }).click()
  await expect(page.getByRole('heading', { name: 'Dòng thời gian' })).toBeVisible()
  await expect(page.getByText(/merged vao main/).first()).toBeVisible()
  await page.getByPlaceholder('Ví dụ: Cần kiểm tra lại case export').fill('Review Phase 7')
  await page.getByLabel('Nội dung').fill('Timeline đã ghi được note, task, branch và comment.')
  await page.getByRole('button', { name: 'Thêm ghi chú' }).click()
  await expect(page.getByText('Review Phase 7')).toBeVisible()

  await page.getByRole('menuitem', { name: 'Tổng quan' }).click()
  await expect(page.getByText('Timeline gần đây', { exact: true })).toBeVisible()
  await expect(page.getByText('Branch cần chú ý', { exact: true })).toBeVisible()
  await expect(page.getByText('Hoàn tất', { exact: true })).toBeVisible()

  await page.locator('.global-search').click()
  await page.keyboard.type('feature/OPS-001')
  await page
    .locator('.ant-select-dropdown:visible .ant-select-item-option-content')
    .getByText(/^feature\/OPS-001 -/)
    .click()
  await expect(page.getByRole('heading', { name: 'Nhánh' })).toBeVisible()
  await expect(page.getByText('Chi tiết branch')).toBeVisible()

  await page.addInitScript(() => {
    localStorage.setItem('qlcv.accessToken', 'expired-access-token')
    localStorage.setItem('qlcv.refreshToken', 'expired-refresh-token')
  })
  await page.reload()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible()
})
