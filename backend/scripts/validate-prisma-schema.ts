import { spawn } from 'node:child_process'
import { copyFile, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Sprint: v1 | Feature: NFR-004 | Task Group: 02 Identity persistence
// Contract: ENT-022/023, ORIGIN-1 safe validation | Pack: v1.7.21-oidc-session-error-contracts
const directory = await mkdtemp(join(tmpdir(), 'api-lab-prisma-validate-'))
try {
  const schema = join(directory, 'schema.prisma')
  await copyFile(new URL('../prisma/schema.prisma', import.meta.url), schema)
  const executable = new URL('../node_modules/.bin/prisma', import.meta.url).pathname
  const exitCode = await run(executable, ['validate', '--schema', schema], directory)
  if (exitCode !== 0) process.exitCode = exitCode
} finally {
  await rm(directory, { recursive: true, force: true })
}

function run(executable: string, args: string[], cwd: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      cwd,
      env: {
        PATH: process.env.PATH,
        DATABASE_URL: 'mysql://validation:validation@127.0.0.1:3306/validation',
      },
      stdio: 'inherit',
    })
    child.once('error', reject)
    child.once('exit', (code) => resolve(code ?? 1))
  })
}
