/**
 * Rate-limiting abstraction for sensitive actions (admin login, later:
 * password reset, uploads, checkout).
 *
 * ⚠️ PRODUCTION REQUIREMENT: the built-in `createInMemoryRateLimiter` keeps
 * state in a per-process `Map`. It is correct for local development and a
 * single-instance deployment ONLY. It is NOT sufficient for a horizontally
 * scaled production deployment (each instance has its own counters, so the
 * effective limit multiplies by the instance count, and counters reset on
 * cold start). For production, implement `RateLimiter` against a shared store
 * (e.g. Upstash Redis via `RATE_LIMIT_KV_URL` / `RATE_LIMIT_KV_TOKEN`, already
 * reserved in `.env.example`) and swap it in behind this same interface — no
 * call sites change. See docs/SECURITY_MODEL.md §4.
 */

export type RateLimitResult = {
  success: boolean
  /** Attempts remaining in the current window (0 when blocked). */
  remaining: number
  /** Epoch ms when the window frees up. */
  resetAt: number
}

export interface RateLimiter {
  limit(key: string): Promise<RateLimitResult>
}

export type InMemoryRateLimiterOptions = {
  /** Max attempts allowed within `windowMs`. */
  limit: number
  /** Sliding window length in milliseconds. */
  windowMs: number
  /** Injectable clock for tests. Defaults to `Date.now`. */
  now?: () => number
}

/**
 * Sliding-window in-memory limiter. Dev/single-instance only (see file header).
 */
export function createInMemoryRateLimiter(options: InMemoryRateLimiterOptions): RateLimiter {
  const { limit, windowMs, now = () => Date.now() } = options
  const hits = new Map<string, number[]>()

  return {
    async limit(key: string): Promise<RateLimitResult> {
      const currentTime = now()
      const windowStart = currentTime - windowMs
      const timestamps = (hits.get(key) ?? []).filter((t) => t > windowStart)

      if (timestamps.length >= limit) {
        const oldest = timestamps[0] ?? currentTime
        hits.set(key, timestamps)
        return { success: false, remaining: 0, resetAt: oldest + windowMs }
      }

      timestamps.push(currentTime)
      hits.set(key, timestamps)
      return {
        success: true,
        remaining: Math.max(0, limit - timestamps.length),
        resetAt: currentTime + windowMs,
      }
    },
  }
}

/**
 * Shared limiter for the admin login action: 5 attempts per 15 minutes, keyed
 * by IP (and email) in the caller. Module-level singleton so counts persist
 * across requests within a single server instance.
 */
export const loginRateLimiter: RateLimiter = createInMemoryRateLimiter({
  limit: 5,
  windowMs: 15 * 60 * 1000,
})
