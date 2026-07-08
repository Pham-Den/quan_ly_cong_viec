import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

export type AccessTokenPayload = {
  sub: string
  email: string
  name: string
  iat: number
  exp: number
}

type JwtHeader = {
  alg: 'HS256'
  typ: 'JWT'
}

function encodeJson(value: JwtHeader | AccessTokenPayload) {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

function signValue(value: string, secret: string) {
  return createHmac('sha256', secret).update(value).digest('base64url')
}

function isPayload(value: unknown): value is AccessTokenPayload {
  if (!value || typeof value !== 'object') {
    return false
  }

  const payload = value as Partial<AccessTokenPayload>

  return (
    typeof payload.sub === 'string' &&
    typeof payload.email === 'string' &&
    typeof payload.name === 'string' &&
    typeof payload.iat === 'number' &&
    typeof payload.exp === 'number'
  )
}

export function createAccessToken(
  user: { id: string; email: string; name: string },
  secret: string,
  expiresInMinutes: number,
) {
  const now = Math.floor(Date.now() / 1000)
  const payload: AccessTokenPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    iat: now,
    exp: now + expiresInMinutes * 60,
  }

  const header = encodeJson({ alg: 'HS256', typ: 'JWT' })
  const body = encodeJson(payload)
  const signature = signValue(`${header}.${body}`, secret)

  return `${header}.${body}.${signature}`
}

export function verifyAccessToken(token: string, secret: string) {
  const [header, body, signature] = token.split('.')

  if (!header || !body || !signature) {
    return null
  }

  const expectedSignature = signValue(`${header}.${body}`, secret)
  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as unknown

    if (!isPayload(payload)) {
      return null
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

export function createRefreshToken() {
  return randomBytes(48).toString('base64url')
}

export function hashRefreshToken(token: string, secret: string) {
  return createHmac('sha256', secret).update(token).digest('hex')
}
