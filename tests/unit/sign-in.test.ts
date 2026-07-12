import { beforeEach, describe, expect, it, vi } from 'vitest'

// Hoisted mocks so the vi.mock factories can reference them safely.
const mocks = vi.hoisted(() => {
  const signInWithPassword = vi.fn()
  const signOut = vi.fn(async () => ({ error: null }))
  const maybeSingle = vi.fn()
  const eq = vi.fn(() => ({ maybeSingle }))
  const select = vi.fn(() => ({ eq }))
  const from = vi.fn(() => ({ select }))
  const limit = vi.fn()
  const redirect = vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`)
  })
  return { signInWithPassword, signOut, maybeSingle, eq, select, from, limit, redirect }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { signInWithPassword: mocks.signInWithPassword, signOut: mocks.signOut },
    from: mocks.from,
  })),
}))

vi.mock('@/lib/security/rate-limit', () => ({
  loginRateLimiter: { limit: mocks.limit },
}))

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Headers({ 'x-forwarded-for': '203.0.113.5' })),
}))

vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
}))

import { signInAdmin } from '@/features/auth/actions/sign-in'

const VALID = { email: 'admin@example.com', password: 'longenoughpassword' }
const GENERIC = 'Invalid email or password.'

beforeEach(() => {
  vi.clearAllMocks()
  mocks.limit.mockResolvedValue({ success: true, remaining: 4, resetAt: 0 })
  mocks.signInWithPassword.mockResolvedValue({
    data: { user: { id: 'u1', email: VALID.email } },
    error: null,
  })
  mocks.maybeSingle.mockResolvedValue({ data: { role: 'admin', is_active: true }, error: null })
})

describe('signInAdmin', () => {
  it('rejects invalid input generically, without hitting Supabase', async () => {
    const res = await signInAdmin({ email: 'nope', password: 'short' })
    expect(res).toEqual({ ok: false, error: GENERIC })
    expect(mocks.signInWithPassword).not.toHaveBeenCalled()
  })

  it('returns a generic error on authentication failure', async () => {
    mocks.signInWithPassword.mockResolvedValue({ data: { user: null }, error: { message: 'bad' } })
    const res = await signInAdmin(VALID)
    expect(res).toEqual({ ok: false, error: GENERIC })
  })

  it('rejects a non-admin generically and signs them out', async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null })
    const res = await signInAdmin(VALID)
    expect(mocks.signOut).toHaveBeenCalledTimes(1)
    expect(res).toEqual({ ok: false, error: GENERIC })
  })

  it('rejects an inactive admin generically and signs them out', async () => {
    mocks.maybeSingle.mockResolvedValue({ data: { role: 'admin', is_active: false }, error: null })
    const res = await signInAdmin(VALID)
    expect(mocks.signOut).toHaveBeenCalledTimes(1)
    expect(res).toEqual({ ok: false, error: GENERIC })
  })

  it('signs in an active admin and redirects to /admin', async () => {
    await expect(signInAdmin(VALID)).rejects.toThrow('REDIRECT:/admin')
    expect(mocks.signOut).not.toHaveBeenCalled()
  })

  it('honours a safe next path', async () => {
    await expect(signInAdmin({ ...VALID, next: '/admin/orders' })).rejects.toThrow(
      'REDIRECT:/admin/orders',
    )
  })

  it('ignores an unsafe next path (open-redirect guard)', async () => {
    await expect(signInAdmin({ ...VALID, next: 'https://evil.com' })).rejects.toThrow(
      'REDIRECT:/admin',
    )
  })

  it('blocks when rate limited, before authenticating', async () => {
    mocks.limit.mockResolvedValue({ success: false, remaining: 0, resetAt: 0 })
    const res = await signInAdmin(VALID)
    expect(res.error).toContain('Too many attempts')
    expect(mocks.signInWithPassword).not.toHaveBeenCalled()
  })
})
