import { defineConfig, devices } from '@playwright/test'

const backendPort = 4100
const frontendPort = 5174
const frontendUrl = `http://127.0.0.1:${frontendPort}`
const backendUrl = `http://127.0.0.1:${backendPort}`
const testDatabaseUrl = 'file:./e2e.db'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: frontendUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: [
        'rm -f backend/prisma/e2e.db backend/prisma/e2e.db-journal',
        `RUST_LOG=info DATABASE_URL=${testDatabaseUrl} npm --workspace backend run db:push`,
        `SEED_SYSTEM_MANAGER_SAMPLE=true DATABASE_URL=${testDatabaseUrl} npm --workspace backend run db:seed`,
        [
          `BACKEND_PORT=${backendPort}`,
          `FRONTEND_ORIGIN=${frontendUrl}`,
          `DATABASE_URL=${testDatabaseUrl}`,
          'JWT_ACCESS_SECRET=e2e-access-secret',
          'JWT_REFRESH_SECRET=e2e-refresh-secret',
          'npm --workspace backend run dev',
        ].join(' '),
      ].join(' && '),
      url: `${backendUrl}/health`,
      timeout: 60_000,
      reuseExistingServer: false,
    },
    {
      command: [
        `VITE_API_BASE_URL=${backendUrl}`,
        'npm --workspace frontend run dev',
        '--',
        '--host',
        '127.0.0.1',
        '--port',
        String(frontendPort),
        '--strictPort',
      ].join(' '),
      url: frontendUrl,
      timeout: 60_000,
      reuseExistingServer: false,
    },
  ],
})
