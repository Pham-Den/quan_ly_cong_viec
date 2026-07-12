import { defineConfig, devices } from '@playwright/test'

const backendPort = 4100
const frontendPort = 5174
const frontendUrl = `http://127.0.0.1:${frontendPort}`
const backendUrl = `http://127.0.0.1:${backendPort}`
const e2eDatabaseUrl = '$(npx tsx src/db/print-database-url.ts --kind e2e)'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
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
        'npm --workspace backend run db:ensure',
        `(cd backend && RUST_LOG=info DATABASE_URL="${e2eDatabaseUrl}" npx prisma db push --force-reset --skip-generate)`,
        `(cd backend && SEED_SYSTEM_MANAGER_SAMPLE=true DATABASE_URL="${e2eDatabaseUrl}" npx tsx prisma/seed.ts)`,
        [
          '(cd backend &&',
          `BACKEND_PORT=${backendPort}`,
          `FRONTEND_ORIGIN=${frontendUrl}`,
          `DATABASE_URL="${e2eDatabaseUrl}"`,
          'JWT_ACCESS_SECRET=e2e-access-secret',
          'JWT_REFRESH_SECRET=e2e-refresh-secret',
          'npm run dev)',
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
