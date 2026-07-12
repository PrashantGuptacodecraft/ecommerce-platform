'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { adminLoginSchema } from '@/lib/validation/auth'
import { resolveAdminAccess, safeNextPath } from '@/lib/security/auth-core'
import { loginRateLimiter } from '@/lib/security/rate-limit'

export type SignInInput = {
  email: string
  password: string
  next?: string
}

// Only the failure shape is ever returned; success ends in a redirect().
export type SignInResult = { ok: false; error: string }

// Deliberately identical for every failure mode below (bad input, wrong
// password, non-admin, inactive admin) — never reveal whether the email exists
// or whether credentials were valid (docs/SECURITY_MODEL.md §1).
const GENERIC_ERROR = 'Invalid email or password.'
const RATE_LIMITED = 'Too many attempts. Please wait a few minutes and try again.'

/**
 * Functional admin sign-in.
 *
 * 1. Rate-limit by client IP (coarse brute-force protection).
 * 2. Validate input server-side (the trust boundary).
 * 3. Authenticate via Supabase Auth (sets the session cookies).
 * 4. Require an ACTIVE `admin_profiles` row (server-verified role, never client
 *    metadata); otherwise sign out and reject generically.
 * 5. Redirect to a validated same-origin admin path (open-redirect safe).
 *
 * Never logs passwords, tokens, cookies, or the auth response.
 */
export async function signInAdmin(input: SignInInput): Promise<SignInResult> {
  const requestHeaders = await headers()
  const forwardedFor = requestHeaders.get('x-forwarded-for') ?? ''
  const ip = forwardedFor.split(',')[0]?.trim() || 'unknown'

  const rate = await loginRateLimiter.limit(`admin-login:${ip}`)
  if (!rate.success) {
    return { ok: false, error: RATE_LIMITED }
  }

  const parsed = adminLoginSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: GENERIC_ERROR }
  }
  const { email, password } = parsed.data

  const supabase = await createClient()
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (signInError || !signInData.user) {
    return { ok: false, error: GENERIC_ERROR }
  }

  const { data: profile } = await supabase
    .from('admin_profiles')
    .select('role, is_active')
    .eq('id', signInData.user.id)
    .maybeSingle()

  const { isAdmin } = resolveAdminAccess(profile)
  if (!isAdmin) {
    await supabase.auth.signOut()
    return { ok: false, error: GENERIC_ERROR }
  }

  // Success. redirect() throws NEXT_REDIRECT and must stay outside any try/catch.
  redirect(safeNextPath(input.next))
}
