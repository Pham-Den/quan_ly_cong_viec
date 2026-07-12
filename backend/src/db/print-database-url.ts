import { loadDotEnvFiles, resolveDatabaseConfig } from './config.js'

function readOption(name: string) {
  const index = process.argv.indexOf(name)

  if (index === -1) {
    return undefined
  }

  return process.argv[index + 1]
}

function readKind() {
  const kind = readOption('--kind')

  if (kind === undefined) {
    return undefined
  }

  if (kind === 'default' || kind === 'test' || kind === 'e2e') {
    return kind
  }

  throw new Error(`Unsupported database kind "${kind}".`)
}

loadDotEnvFiles()

const config = resolveDatabaseConfig(process.env, {
  database: readOption('--database'),
  kind: readKind(),
})

process.stdout.write(config.databaseUrl)
