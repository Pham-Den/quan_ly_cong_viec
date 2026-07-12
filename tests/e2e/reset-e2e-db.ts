import { execFileSync } from 'node:child_process'

export function resetE2eDatabase() {
  execFileSync(
    'sh',
    [
      '-c',
      [
        'cd backend',
        'E2E_DATABASE_URL="$(npx tsx src/db/print-database-url.ts --kind e2e)"',
        'RUST_LOG=info DATABASE_URL="$E2E_DATABASE_URL" npx prisma db push --force-reset --skip-generate',
        'SEED_SYSTEM_MANAGER_SAMPLE=true DATABASE_URL="$E2E_DATABASE_URL" npx tsx prisma/seed.ts',
      ].join(' && '),
    ],
    {
      cwd: process.cwd(),
      stdio: 'pipe',
    },
  )
}
