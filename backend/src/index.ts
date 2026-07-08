import { loadEnv } from './env.js'
import { buildServer } from './server.js'

const env = loadEnv()
const app = buildServer(env)

try {
  await app.listen({
    host: env.host,
    port: env.port,
  })
} catch (error) {
  app.log.error(error)
  process.exit(1)
}
