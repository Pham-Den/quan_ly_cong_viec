import type { FastifyReply, FastifyRequest } from 'fastify'

import { readSessionCookie, sendIdentityError } from '../modules/identity/delivery/index.js'

// Sprint: v1 | Feature: NFR-004/NFR-010 | Task Group: 02B Identity delivery
// Contract: API-024 protected middleware, PR-001 | Pack: v1.7.21-oidc-session-error-contracts

export type AuthUser = {
  id: string
  email?: string
  name: string
}

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: AuthUser
  }
}

export function createAuthGuard(_legacyContext?: unknown) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authorized = await request.server.identityService.requireActor(readSessionCookie(request))
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
        await request.server.identityService.requireCsrf(
          authorized.session,
          typeof request.headers['x-csrf-token'] === 'string' ? request.headers['x-csrf-token'] : '',
        )
      }
      request.authActor = authorized.actor
      request.authSession = authorized.session
      request.authUser = {
        id: authorized.actor.id,
        email: authorized.actor.email,
        name: authorized.actor.displayName,
      }
    } catch (error) {
      return sendIdentityError(request, reply, error)
    }
  }
}

export function createCsrfGuard() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authorized = request.authSession
        ? { session: request.authSession }
        : await request.server.identityService.requireActor(readSessionCookie(request))
      await request.server.identityService.requireCsrf(
        authorized.session,
        typeof request.headers['x-csrf-token'] === 'string' ? request.headers['x-csrf-token'] : '',
      )
    } catch (error) {
      return sendIdentityError(request, reply, error)
    }
  }
}
