import { createPublicKey, verify } from 'node:crypto'

import { CentralIamTokenRejectedError, type CentralIamPort, type VerifiedIdentity } from '../application/index.js'

// Sprint: v1 | Feature: NFR-004/NFR-010 | Task Group: 02B Identity delivery
// Contract: ADR-006, API-017/018, SEQ-001 | Pack: v1.7.21-oidc-session-error-contracts
export type CentralIamHttpConfig = {
  issuer: string
  clientId: string
  redirectUri: string
  audience: string
  loginTimeoutMs: number
  loginRetryMax: number
  statusTimeoutMs: number
}

type DiscoveryDocument = {
  issuer: string
  authorization_endpoint: string
  token_endpoint: string
  jwks_uri: string
}

type JsonWebKey = Record<string, unknown> & { kid?: string; alg?: string }

export class HttpCentralIamAdapter implements CentralIamPort {
  private discovery: DiscoveryDocument | null = null
  private jwks: JsonWebKey[] | null = null
  constructor(
    private readonly config: CentralIamHttpConfig,
    private readonly fetcher: typeof fetch = fetch,
    private readonly sleep: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    private readonly now: () => number = Date.now,
  ) {}

  async authorizationUrl(input: { state: string; nonce: string; codeChallenge: string }): Promise<string> {
    const discovery = await this.discover()
    const url = new URL(discovery.authorization_endpoint)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('client_id', this.config.clientId)
    url.searchParams.set('redirect_uri', this.config.redirectUri)
    url.searchParams.set('scope', 'openid profile email')
    url.searchParams.set('state', input.state)
    url.searchParams.set('nonce', input.nonce)
    url.searchParams.set('code_challenge', input.codeChallenge)
    url.searchParams.set('code_challenge_method', 'S256')
    return url.toString()
  }

  async exchangeCode(input: { code: string; pkceVerifier: string }): Promise<VerifiedIdentity> {
    const deadline = this.now() + this.config.loginTimeoutMs
    const discovery = await this.discover(deadline)
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: input.code,
      code_verifier: input.pkceVerifier,
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
    })
    const payload = await this.fetchJson(discovery.token_endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    }, this.remaining(deadline))
    let claims: Record<string, unknown>
    try { claims = await this.verifyIdToken(text(payload.id_token), discovery, deadline) }
    catch (error) { throw new CentralIamTokenRejectedError('Central IAM ID token was rejected.', { cause: error }) }
    const amr = Array.isArray(claims.amr) ? claims.amr.filter((value): value is string => typeof value === 'string') : []
    return {
      actor: {
        id: requiredText(claims.sub, 'sub'),
        displayName: text(claims.name) || requiredText(claims.sub, 'sub'),
        ...(text(claims.email) ? { email: text(claims.email) } : {}),
      },
      mfaAssurance: { amr, acr: requiredText(claims.acr, 'acr') },
      nonce: requiredText(claims.nonce, 'nonce'),
      absoluteExpiresAt: new Date(requiredNumber(claims.exp, 'exp') * 1_000),
    }
  }

  async subjectStatus(subjectId: string): Promise<'ACTIVE' | 'INACTIVE' | 'UNCERTAIN'> {
    const payload = await this.fetchJson(
      new URL(`/status/${encodeURIComponent(subjectId)}`, this.config.issuer).toString(),
      {},
      this.config.statusTimeoutMs,
    )
    const status = payload.status === 'ACTIVE' || payload.status === 'INACTIVE' ? payload.status : 'UNCERTAIN'
    return status
  }

  private async discover(deadline = this.now() + this.config.loginTimeoutMs): Promise<DiscoveryDocument> {
    if (this.discovery) return this.discovery
    const payload = await this.fetchJsonRetrySafe(new URL('/.well-known/openid-configuration', this.config.issuer).toString(), deadline)
    const discovery = {
      issuer: requiredText(payload.issuer, 'issuer'),
      authorization_endpoint: requiredUrl(payload.authorization_endpoint, 'authorization_endpoint'),
      token_endpoint: requiredUrl(payload.token_endpoint, 'token_endpoint'),
      jwks_uri: requiredUrl(payload.jwks_uri, 'jwks_uri'),
    }
    if (discovery.issuer !== this.config.issuer.replace(/\/$/, '')) throw new Error('OIDC issuer mismatch.')
    this.discovery = discovery
    return discovery
  }

  private async verifyIdToken(token: string, discovery: DiscoveryDocument, deadline: number): Promise<Record<string, unknown>> {
    const [encodedHeader, encodedPayload, encodedSignature, extra] = token.split('.')
    if (!encodedHeader || !encodedPayload || !encodedSignature || extra) throw new Error('Malformed ID token.')
    const header = parseSegment(encodedHeader)
    if (header.alg !== 'RS256' || typeof header.kid !== 'string') throw new Error('Unsupported ID token signature.')
    if (!this.jwks) {
      const document = await this.fetchJsonRetrySafe(discovery.jwks_uri, deadline)
      if (!Array.isArray(document.keys)) throw new Error('Invalid JWKS document.')
      this.jwks = document.keys.filter((key): key is JsonWebKey => Boolean(key && typeof key === 'object'))
    }
    const key = this.jwks.find((candidate) => candidate.kid === header.kid && (!candidate.alg || candidate.alg === 'RS256'))
    if (!key) throw new Error('ID token signing key was not found.')
    const valid = verify(
      'RSA-SHA256',
      Buffer.from(`${encodedHeader}.${encodedPayload}`),
      createPublicKey({ key: key as JsonWebKey, format: 'jwk' }),
      Buffer.from(encodedSignature, 'base64url'),
    )
    if (!valid) throw new Error('ID token signature is invalid.')
    const claims = parseSegment(encodedPayload)
    const audience = claims.aud
    if (claims.iss !== discovery.issuer) throw new Error('ID token issuer mismatch.')
    if (!(audience === this.config.audience || (Array.isArray(audience) && audience.includes(this.config.audience)))) {
      throw new Error('ID token audience mismatch.')
    }
    if (requiredNumber(claims.exp, 'exp') * 1_000 <= this.now()) throw new Error('ID token expired.')
    return claims
  }

  private async fetchJsonRetrySafe(url: string, deadline: number): Promise<Record<string, unknown>> {
    let lastError: unknown
    for (let attempt = 0; attempt <= this.config.loginRetryMax; attempt += 1) {
      const remaining = deadline - this.now()
      if (remaining <= 0) break
      try { return await this.fetchJson(url, {}, remaining) }
      catch (error) {
        lastError = error
        if (attempt === this.config.loginRetryMax) break
        const delay = Math.min(20 * 2 ** attempt + attempt, Math.max(0, deadline - this.now()))
        if (delay <= 0) break
        await this.sleep(delay)
      }
    }
    throw lastError ?? new Error('Central IAM login metadata budget exhausted.')
  }

  private async fetchJson(url: string, init: RequestInit = {}, timeoutMs = this.config.loginTimeoutMs): Promise<Record<string, unknown>> {
    const response = await this.fetcher(url, { ...init, signal: AbortSignal.timeout(timeoutMs) })
    if (!response.ok) throw new Error(`Central IAM returned HTTP ${response.status}.`)
    const value: unknown = await response.json()
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Central IAM returned invalid JSON.')
    return value as Record<string, unknown>
  }

  private remaining(deadline: number): number {
    const value = deadline - this.now()
    if (value <= 0) throw new Error('Central IAM callback deadline exhausted.')
    return value
  }
}

function parseSegment(value: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid JWT segment.')
  return parsed as Record<string, unknown>
}
function text(value: unknown): string { return typeof value === 'string' ? value : '' }
function requiredText(value: unknown, name: string): string {
  const result = text(value)
  if (!result) throw new Error(`Missing OIDC ${name}.`)
  return result
}
function requiredNumber(value: unknown, name: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`Missing OIDC ${name}.`)
  return value
}
function requiredUrl(value: unknown, name: string): string { return new URL(requiredText(value, name)).toString() }
