import { expect, test, type Page } from '@playwright/test'

import { resetE2eDatabase } from './reset-e2e-db'

const email = 'api.lab.e2e@example.com'
const password = 'password123'
const apiBaseUrl = 'http://127.0.0.1:4100'

test.setTimeout(60_000)

test.beforeEach(() => {
  resetE2eDatabase()
})

async function setupFirstAccount(page: Page) {
  await page.goto('/')

  await expect(page).toHaveURL(/\/setup$/)
  await page.locator('input[autocomplete="name"]').fill('API Lab E2E')
  await page.locator('input[autocomplete="email"]').fill(email)
  await page.locator('input[autocomplete="new-password"]').fill(password)
  await page.getByRole('button', { name: 'Tạo tài khoản' }).click()
  await expect(page.getByRole('heading', { name: 'Tổng quan' })).toBeVisible()

  const accessToken = await page.evaluate(() => localStorage.getItem('qlcv.accessToken'))

  if (!accessToken) {
    throw new Error('Missing access token')
  }

  return accessToken
}

test('api lab creates environment, imports curl, saves and runs a request', async ({ page }) => {
  await setupFirstAccount(page)

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

test('api lab flow reorders steps and passes captured output into the next request', async ({ page }) => {
  const accessToken = await setupFirstAccount(page)
  const apiHeaders = { authorization: `Bearer ${accessToken}` }
  const projectsResponse = await page.request.get(`${apiBaseUrl}/api/projects`, { headers: apiHeaders })
  const projects = (await projectsResponse.json()) as Array<{ id: string; code: string }>
  const project = projects.find((item) => item.code === 'PERSONAL')

  if (!project) {
    throw new Error('Missing PERSONAL project')
  }

  await expect(
    page.request.post(`${apiBaseUrl}/api/api-lab/environments`, {
      headers: apiHeaders,
      data: {
        projectId: project.id,
        name: 'local',
        environmentType: 'LOCAL',
        baseUrl: apiBaseUrl,
        variables: [{ key: 'accessToken', secret: true, variants: [{ name: 'default', value: accessToken }] }],
      },
    }),
  ).resolves.toBeOK()

  const listProjectsResponse = await page.request.post(`${apiBaseUrl}/api/api-lab/requests`, {
    headers: apiHeaders,
    data: {
      projectId: project.id,
      collectionName: 'Flow E2E',
      name: 'Capture project',
      method: 'GET',
      url: '{{baseUrl}}/api/projects',
      headers: [{ key: 'authorization', value: 'Bearer {{accessToken}}' }],
    },
  })
  await expect(listProjectsResponse).toBeOK()
  const listProjectsRequest = (await listProjectsResponse.json()) as { id: string }
  const listGroupsResponse = await page.request.post(`${apiBaseUrl}/api/api-lab/requests`, {
    headers: apiHeaders,
    data: {
      projectId: project.id,
      collectionName: 'Flow E2E',
      name: 'Use captured project',
      method: 'GET',
      url: '{{baseUrl}}/api/projects/{{projectId}}/task-groups',
      headers: [{ key: 'authorization', value: 'Bearer {{accessToken}}' }],
    },
  })
  await expect(listGroupsResponse).toBeOK()
  const listGroupsRequest = (await listGroupsResponse.json()) as { id: string }
  const flowResponse = await page.request.post(`${apiBaseUrl}/api/api-lab/flows`, {
    headers: apiHeaders,
    data: {
      projectId: project.id,
      collectionName: 'Flow E2E',
      name: 'Project groups flow',
    },
  })
  await expect(flowResponse).toBeOK()
  const flow = (await flowResponse.json()) as { id: string }
  const useStepResponse = await page.request.post(`${apiBaseUrl}/api/api-lab/flows/${flow.id}/steps`, {
    headers: apiHeaders,
    data: {
      requestId: listGroupsRequest.id,
      name: 'Use captured project',
      sortOrder: 0,
    },
  })
  await expect(useStepResponse).toBeOK()
  const captureStepResponse = await page.request.post(`${apiBaseUrl}/api/api-lab/flows/${flow.id}/steps`, {
    headers: apiHeaders,
    data: {
      requestId: listProjectsRequest.id,
      name: 'Capture project',
      sortOrder: 1,
      captureRules: [{ source: 'JSON', path: '$[0].id', as: 'projectId', required: true }],
    },
  })
  await expect(captureStepResponse).toBeOK()

  await page.getByRole('menuitem', { name: 'API Lab' }).click()
  await expect(page).toHaveURL(/\/api-lab$/)
  await page.getByRole('tab', { name: 'Flows' }).click()
  await expect(page.locator('.api-lab-flow-step').first()).toContainText('Use captured project')

  const stepCards = page.locator('.api-lab-flow-step')
  await Promise.all([
    page.waitForResponse((response) => response.url().includes('/api/api-lab/flow-steps/') && response.ok()),
    stepCards.nth(1).dragTo(stepCards.nth(0), {
      sourcePosition: { x: 18, y: 18 },
      targetPosition: { x: 18, y: 18 },
    }),
  ])
  await expect(stepCards.first()).toContainText('Capture project')

  await Promise.all([
    page.waitForResponse((response) => response.url().includes(`/api/api-lab/flows/${flow.id}/run`) && response.ok()),
    page.getByRole('button', { name: 'Chạy flow' }).click(),
  ])
  await expect(page.locator('.api-lab-flow-results').getByText('PASSED').first()).toBeVisible()
  await expect(page.locator('.api-lab-flow-results')).toContainText('PERSONAL')
  await expect(page.locator('.api-lab-flow-results')).not.toContainText(accessToken)
})

test('api lab shows failed assertions and filters run history', async ({ page }) => {
  const accessToken = await setupFirstAccount(page)
  const apiHeaders = { authorization: `Bearer ${accessToken}` }
  const projectsResponse = await page.request.get(`${apiBaseUrl}/api/projects`, { headers: apiHeaders })
  const projects = (await projectsResponse.json()) as Array<{ id: string; code: string }>
  const project = projects.find((item) => item.code === 'PERSONAL')

  if (!project) {
    throw new Error('Missing PERSONAL project')
  }

  await expect(
    page.request.post(`${apiBaseUrl}/api/api-lab/environments`, {
      headers: apiHeaders,
      data: {
        projectId: project.id,
        name: 'local',
        environmentType: 'LOCAL',
        baseUrl: apiBaseUrl,
        variables: [],
      },
    }),
  ).resolves.toBeOK()

  const requestResponse = await page.request.post(`${apiBaseUrl}/api/api-lab/requests`, {
    headers: apiHeaders,
    data: {
      projectId: project.id,
      collectionName: 'Assertions E2E',
      name: 'Assertion fail check',
      method: 'GET',
      url: '{{baseUrl}}/health',
      assertionRules: [{ type: 'STATUS_EQUALS', expected: '201', label: 'status should be 201', required: true }],
    },
  })
  await expect(requestResponse).toBeOK()

  await page.getByRole('menuitem', { name: 'API Lab' }).click()
  await expect(page).toHaveURL(/\/api-lab$/)
  await page.locator('.api-lab-request-list').getByText('Assertion fail check').click()

  await Promise.all([
    page.waitForResponse((response) => response.url().includes('/api/api-lab/requests/') && response.url().includes('/run') && response.ok()),
    page.getByRole('button', { name: 'Chạy request' }).click(),
  ])

  const runPanel = page.locator('.api-lab-run-panel')
  await expect(runPanel).toContainText('FAILED')
  await expect(runPanel).toContainText('FAIL · status should be 201')
  await expect(runPanel).toContainText('quan-ly-cong-viec-api')

  const historyCard = page.locator('.settings-card').filter({ hasText: 'History' })
  await expect(historyCard).toContainText('Assertion fail check')
  await historyCard.locator('.ant-select').nth(3).click()
  await page.locator('.ant-select-dropdown:visible').getByRole('option', { name: 'Failed' }).click()
  await Promise.all([
    page.waitForResponse((response) => response.url().includes('/api/api-lab/history') && response.url().includes('status=FAILED') && response.ok()),
    historyCard.getByRole('button', { name: 'Lọc' }).click(),
  ])
  await expect(historyCard).toContainText('FAILED')
  await expect(historyCard).toContainText('Assertions 0/1')
})
