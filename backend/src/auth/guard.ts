import type { FastifyReply, FastifyRequest } from 'fastify'

import type { AppPrismaClient } from '../db.js'
import type { AppEnv } from '../env.js'
import { verifyAccessToken } from './tokens.js'

export type AuthUser = {
  id: string
  email: string
  name: string
}

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: AuthUser
  }
}

type AuthContext = {
  env: AppEnv
  prisma: AppPrismaClient
}

function readBearerToken(request: FastifyRequest) {
  const authorization = request.headers.authorization

  if (!authorization?.startsWith('Bearer ')) {
    return null
  }

  return authorization.slice('Bearer '.length).trim()
}

export function createAuthGuard(context: AuthContext) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const token = readBearerToken(request)

    if (!token) {
      return reply.code(401).send({ message: 'Can dang nhap de tiep tuc.' })
    }

    const payload = verifyAccessToken(token, context.env.jwtAccessSecret)

    if (!payload) {
      return reply.code(401).send({ message: 'Phien dang nhap da het han.' })
    }

    const user = await context.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
      },
    })

    if (!user) {
      return reply.code(401).send({ message: 'Tai khoan khong con ton tai.' })
    }

    request.authUser = user
  }
}
