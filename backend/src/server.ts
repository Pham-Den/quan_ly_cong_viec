import cors from '@fastify/cors'
import Fastify from 'fastify'

import { registerAuthRoutes } from './auth/routes.js'
import { registerBranchRoutes } from './branches/routes.js'
import { createPrismaClient } from './db.js'
import type { AppEnv } from './env.js'
import { registerPlanningRoutes } from './planning/routes.js'
import { registerTimelineRoutes } from './timeline/routes.js'
import { registerWorkspaceRoutes } from './workspace/routes.js'

export function buildServer(env: AppEnv) {
  const app = Fastify({
    logger: true,
  })
  const prisma = createPrismaClient(env.databaseUrl)

  app.register(cors, {
    origin: env.frontendOrigin,
    allowedHeaders: ['Authorization', 'Content-Type'],
  })

  app.addHook('onClose', async () => {
    await prisma.$disconnect()
  })

  app.get('/health', async () => ({
    ok: true,
    service: 'quan-ly-cong-viec-api',
  }))

  app.get('/api/meta', async () => ({
    app: 'quan_ly_cong_viec',
    apiVersion: '0.1.0',
  }))

  registerAuthRoutes(app, { env, prisma })
  registerWorkspaceRoutes(app, { env, prisma })
  registerPlanningRoutes(app, { env, prisma })
  registerBranchRoutes(app, { env, prisma })
  registerTimelineRoutes(app, { env, prisma })

  return app
}
