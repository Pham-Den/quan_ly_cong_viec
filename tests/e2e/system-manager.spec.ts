import { expect, test } from '@playwright/test'

const email = 'system.manager.e2e@example.com'
const password = 'password123'
const localStateKey = 'qlcv.systemManager.localState.v1'

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
  await expect(page.getByRole('heading', { name: 'DB_HOST (1)' })).toBeVisible()
  await expect(page.getByText('DB_HOST=mariadb-local.company.local')).toBeVisible()
  const detailPanel = page.locator('.detail-panel')
  await expect(page.getByRole('button', { name: 'Copy config line' }).first()).toBeVisible()
  await expect(detailPanel).toHaveCSS('overflow', 'hidden')
  await expect
    .poll(() => detailPanel.evaluate((element) => element.scrollWidth <= element.clientWidth + 1))
    .toBe(true)
  await page.getByRole('button', { name: 'Ẩn sidebar' }).click()
  await expect(detailPanel).not.toBeVisible()
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const state = JSON.parse(localStorage.getItem(key) ?? '{}')

        return state.detailPanelCollapsed === true
      }, localStateKey),
    )
    .toBe(true)
  await page.getByRole('button', { name: /^DB_HOST \(1\)$/ }).first().click()
  await expect(detailPanel).toBeVisible()
  await expect(page.getByText('Config detail')).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const state = JSON.parse(localStorage.getItem(key) ?? '{}')

        return state.detailPanelCollapsed === false
      }, localStateKey),
    )
    .toBe(true)
  await expect(page.getByRole('button', { name: 'Bỏ chọn dependency' })).toBeVisible()
  await page.getByRole('button', { name: 'Bỏ chọn dependency' }).click()
  await expect(page.getByText('Config detail')).not.toBeVisible()
  await page
    .locator('.edge-config-label')
    .filter({ has: page.getByRole('button', { name: /^DB_HOST \(1\)$/ }) })
    .getByRole('button', { name: 'Xem config nhanh' })
    .dispatchEvent('click')
  await expect(page.getByText('Config nhanh')).toBeVisible()
  await expect(page.locator('.edge-config-popover').getByText('DB_HOST (1)')).toBeVisible()
  await expect(page.locator('.edge-config-popover')).toHaveCSS('z-index', '1200')
  await expect(page.getByRole('button', { name: 'Copy config nhanh' }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Copy all config nhanh' })).toBeVisible()
  await page.getByRole('button', { name: 'Đóng config nhanh' }).click()
  await expect(page.getByText('Config nhanh')).not.toBeVisible()

  const b2pNode = page.locator('.vue-flow__node').filter({ hasText: 'B2P' }).first()
  const b2pBox = await b2pNode.boundingBox()

  if (!b2pBox) {
    throw new Error('B2P node is not visible enough to drag')
  }

  await page.mouse.move(b2pBox.x + b2pBox.width / 2, b2pBox.y + b2pBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(b2pBox.x + b2pBox.width / 2 + 90, b2pBox.y + b2pBox.height / 2 + 40, { steps: 8 })
  await page.mouse.up()
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const state = JSON.parse(localStorage.getItem(key) ?? '{}')
        const position = state.nodePositions?.['b2p-app']

        return Boolean(position && Number.isFinite(position.x) && Number.isFinite(position.y))
      }, localStateKey),
    )
    .toBe(true)

  await page.getByRole('button', { name: 'Bung component' }).click()
  await expect(page.locator('.vue-flow__node').filter({ hasText: 'B2P Web/API' })).toBeVisible()
  await expect(page.locator('.vue-flow__node').filter({ hasText: 'B2P Queue Worker' })).toBeVisible()

  await page.locator('.vue-flow__node').filter({ hasText: 'B2P Web/API' }).click()
  await page.getByRole('button', { name: 'Start flow' }).click()
  await expect(page.getByRole('tab', { name: 'Flow' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('.flow-step').filter({ hasText: 'Redis' })).toBeVisible()
  await expect(page.locator('.flow-step').filter({ hasText: /REDIS_HOST \(4\)/ })).toBeVisible()

  await page.locator('.ant-segmented-item').filter({ hasText: 'Dev' }).click()
  await expect(page.locator('.vue-flow__node').filter({ hasText: 'B2P' }).first()).toBeVisible()

  await page.getByRole('button', { name: /^(Quản lý dữ liệu|Data\s*Set)$/ }).click()
  const drawer = page.locator('.ant-drawer').filter({ hasText: 'Quản lý dữ liệu System Manager' })
  const activeDrawerPanel = drawer.locator('.ant-tabs-tabpane-active')
  const activeFormContent = activeDrawerPanel.locator('.manager-form-content')
  await expect(drawer).toBeVisible()
  await expect(drawer.getByRole('tab', { name: 'Nodes' })).toBeVisible()
  await expect(activeDrawerPanel.getByText('Node global; runtime/config bên dưới áp dụng cho environment: Dev')).toBeVisible()
  await expect(drawer.getByRole('button', { name: /B2P Web\/API/ })).toBeVisible()
  await expect(activeDrawerPanel.getByText('Tạo node mới')).toBeVisible()
  await expect(activeDrawerPanel.getByRole('button', { name: 'Lưu mới node' })).toBeVisible()
  await expect(activeDrawerPanel.getByText('Global node')).toBeVisible()
  await expect(activeDrawerPanel.getByText('Runtime/config binding')).toBeVisible()
  await expect(activeDrawerPanel.locator('.manager-scope-badge-env').filter({ hasText: 'Dev' })).toBeVisible()
  await activeDrawerPanel.getByRole('button', { name: /B2P Web\/API/ }).click()
  await activeFormContent.evaluate((element) => {
    element.scrollTop = 0
  })
  await expect(activeDrawerPanel.getByText('Đang sửa node')).toBeVisible()
  await expect(activeDrawerPanel.locator('.status-tag').filter({ hasText: 'Healthy' }).first()).toBeVisible()
  await expect(activeDrawerPanel.getByRole('button', { name: 'Cập nhật node' })).toBeVisible()
  await activeFormContent.evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })
  await expect(activeDrawerPanel.getByText('Config groups')).toBeVisible()
  await drawer.getByRole('tab', { name: 'Dependencies' }).click()
  await activeFormContent.evaluate((element) => {
    element.scrollTop = 0
  })
  await expect(drawer.getByRole('button', { name: /DB_HOST/ }).first()).toBeVisible()
  await expect(activeDrawerPanel.getByText('Tạo dependency mới')).toBeVisible()
  await expect(activeDrawerPanel.getByRole('button', { name: 'Lưu mới dependency' })).toBeVisible()
  await expect(activeDrawerPanel.getByText('Global dependency')).toBeVisible()
  await activeFormContent.evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })
  await expect(activeDrawerPanel.getByText('Edge config binding')).toBeVisible()
  await expect(activeDrawerPanel.getByText('Environment config')).toBeVisible()
  await expect(activeDrawerPanel.locator('.manager-scope-badge-env').filter({ hasText: 'Dev' })).toBeVisible()
  await activeDrawerPanel.getByRole('button', { name: /DB_HOST/ }).first().click()
  await activeFormContent.evaluate((element) => {
    element.scrollTop = 0
  })
  await expect(activeDrawerPanel.getByText('Đang sửa dependency')).toBeVisible()
  await expect(activeDrawerPanel.getByRole('button', { name: 'Cập nhật dependency' })).toBeVisible()
})
