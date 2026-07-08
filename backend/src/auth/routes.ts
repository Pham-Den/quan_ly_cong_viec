import type { User } from '@prisma/client'
import type { FastifyInstance } from 'fastify'

import type { AppPrismaClient } from '../db.js'
import type { AppEnv } from '../env.js'
import { createAuthGuard } from './guard.js'
import { hashPassword, verifyPassword } from './password.js'
import { createAccessToken, createRefreshToken, hashRefreshToken } from './tokens.js'

type AuthRoutesContext = {
  env: AppEnv
  prisma: AppPrismaClient
}

type AuthBody = {
  email?: unknown
  name?: unknown
  password?: unknown
  refreshToken?: unknown
}

function publicUser(user: Pick<User, 'id' | 'email' | 'name'>) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
  }
}

function readText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeEmail(value: unknown) {
  return readText(value).toLowerCase()
}

function readAuthBody(body: unknown): AuthBody {
  return body && typeof body === 'object' ? (body as AuthBody) : {}
}

async function listShellProjects(prisma: AppPrismaClient, userId: string) {
  return prisma.project.findMany({
    where: {
      OR: [{ ownerId: userId }, { ownerId: null }],
    },
    orderBy: [{ createdAt: 'asc' }],
    select: {
      id: true,
      code: true,
      name: true,
      defaultRepoId: true,
    },
  })
}

async function createSession(user: Pick<User, 'id' | 'email' | 'name'>, context: AuthRoutesContext) {
  const refreshToken = createRefreshToken()
  const refreshTokenHash = hashRefreshToken(refreshToken, context.env.jwtRefreshSecret)
  const expiresAt = new Date(Date.now() + context.env.refreshTokenDays * 24 * 60 * 60 * 1000)

  await context.prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt,
    },
  })

  return {
    user: publicUser(user),
    projects: await listShellProjects(context.prisma, user.id),
    accessToken: createAccessToken(user, context.env.jwtAccessSecret, context.env.accessTokenMinutes),
    refreshToken,
  }
}

export function registerAuthRoutes(app: FastifyInstance, context: AuthRoutesContext) {
  const requireAuth = createAuthGuard(context)

  app.get('/api/auth/bootstrap', async () => {
    const userCount = await context.prisma.user.count()

    return {
      setupRequired: userCount === 0,
    }
  })

  app.post('/api/auth/setup', async (request, reply) => {
    const userCount = await context.prisma.user.count()

    if (userCount > 0) {
      return reply.code(409).send({ message: 'Tai khoan dau tien da duoc tao.' })
    }

    const body = readAuthBody(request.body)
    const name = readText(body.name)
    const email = normalizeEmail(body.email)
    const password = readText(body.password)

    if (!name || !email || password.length < 8) {
      return reply.code(400).send({
        message: 'Can nhap ten, email va mat khau toi thieu 8 ky tu.',
      })
    }

    const user = await context.prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await hashPassword(password),
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    })

    await context.prisma.project.updateMany({
      where: { ownerId: null },
      data: { ownerId: user.id },
    })

    return createSession(user, context)
  })

  app.post('/api/auth/login', async (request, reply) => {
    const body = readAuthBody(request.body)
    const email = normalizeEmail(body.email)
    const password = readText(body.password)

    if (!email || !password) {
      return reply.code(400).send({ message: 'Can nhap email va mat khau.' })
    }

    const user = await context.prisma.user.findUnique({
      where: { email },
    })

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return reply.code(401).send({ message: 'Email hoac mat khau khong dung.' })
    }

    return createSession(user, context)
  })

  app.post('/api/auth/refresh', async (request, reply) => {
    const body = readAuthBody(request.body)
    const refreshToken = readText(body.refreshToken)

    if (!refreshToken) {
      return reply.code(400).send({ message: 'Thieu refresh token.' })
    }

    const tokenHash = hashRefreshToken(refreshToken, context.env.jwtRefreshSecret)
    const storedToken = await context.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt <= new Date()) {
      return reply.code(401).send({ message: 'Phien dang nhap da het han.' })
    }

    await context.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    })

    return createSession(storedToken.user, context)
  })

  app.post('/api/auth/logout', async (request) => {
    const body = readAuthBody(request.body)
    const refreshToken = readText(body.refreshToken)

    if (refreshToken) {
      await context.prisma.refreshToken.updateMany({
        where: {
          tokenHash: hashRefreshToken(refreshToken, context.env.jwtRefreshSecret),
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      })
    }

    return { ok: true }
  })

  app.get('/api/auth/me', { preHandler: requireAuth }, async (request) => ({
    user: request.authUser,
    projects: request.authUser ? await listShellProjects(context.prisma, request.authUser.id) : [],
  }))
}
