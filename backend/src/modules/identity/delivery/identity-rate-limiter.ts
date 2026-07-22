// Sprint: v1 | Feature: NFR-004 | Task Group: 02B Identity delivery
// Contract: API-017–020 rate limits | Pack: v1.7.21-oidc-session-error-contracts
export type RateLimitDecision = { allowed: true } | { allowed: false; retryAfterSeconds: number }

type Bucket = { tokens: number; updatedAtMs: number }

export class IdentityRateLimiter {
  private readonly buckets = new Map<string, Bucket>()

  constructor(
    private readonly requestsPerMinute: number,
    private readonly burst: number,
    private readonly now: () => number = Date.now,
  ) {}

  consume(key: string): RateLimitDecision {
    const now = this.now()
    const refillPerMs = this.requestsPerMinute / 60_000
    const current = this.buckets.get(key) ?? { tokens: this.burst, updatedAtMs: now }
    current.tokens = Math.min(this.burst, current.tokens + Math.max(0, now - current.updatedAtMs) * refillPerMs)
    current.updatedAtMs = now
    if (current.tokens >= 1) {
      current.tokens -= 1
      this.buckets.set(key, current)
      return { allowed: true }
    }
    this.buckets.set(key, current)
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((1 - current.tokens) / refillPerMs / 1_000)) }
  }
}
