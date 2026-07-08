import cors from '@fastify/cors'
import Fastify from 'fastify'

import type { AppEnv } from './env.js'

export function buildServer(env: AppEnv) {
  const app = Fastify({
    logger: true,
  })

  app.register(cors, {
    origin: env.frontendOrigin,
  })

  app.get('/health', async () => ({
    ok: true,
    service: 'quan-ly-cong-viec-api',
  }))

  app.get('/api/meta', async () => ({
    app: 'quan_ly_cong_viec',
    apiVersion: '0.1.0',
  }))

  return app
}
