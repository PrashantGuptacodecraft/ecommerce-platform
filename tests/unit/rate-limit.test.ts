import { describe, expect, it } from 'vitest'
import { createInMemoryRateLimiter } from '@/lib/security/rate-limit'

describe('createInMemoryRateLimiter', () => {
  it('allows up to the limit, then blocks', async () => {
    const rl = createInMemoryRateLimiter({ limit: 3, windowMs: 1000, now: () => 1000 })
    expect((await rl.limit('k')).success).toBe(true)
    expect((await rl.limit('k')).success).toBe(true)
    expect((await rl.limit('k')).success).toBe(true)
    const blocked = await rl.limit('k')
    expect(blocked.success).toBe(false)
    expect(blocked.remaining).toBe(0)
  })

  it('frees up after the window slides', async () => {
    let now = 1000
    const rl = createInMemoryRateLimiter({ limit: 1, windowMs: 1000, now: () => now })
    expect((await rl.limit('k')).success).toBe(true)
    expect((await rl.limit('k')).success).toBe(false)
    now = 2001
    expect((await rl.limit('k')).success).toBe(true)
  })

  it('tracks keys independently', async () => {
    const rl = createInMemoryRateLimiter({ limit: 1, windowMs: 1000, now: () => 5 })
    expect((await rl.limit('a')).success).toBe(true)
    expect((await rl.limit('b')).success).toBe(true)
    expect((await rl.limit('a')).success).toBe(false)
  })
})
