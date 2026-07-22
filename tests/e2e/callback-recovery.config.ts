import { defineConfig, devices } from '@playwright/test'

// Sprint: v1 | TC-072 | Task Group: 02C Browser session cutover
// Contract: DS-COMP-012 frontend-only evidence | Pack: v1.7.21-oidc-session-error-contracts
export default defineConfig({
  testDir: '.',
  testMatch: 'callback-recovery.spec.ts',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.CALLBACK_E2E_BASE_URL ?? 'http://127.0.0.1:5174',
    viewport: { width: 1280, height: 720 },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
