'use server'

import { adminLoginSchema } from '@/lib/validation/auth'

export type SignInResult = { ok: true } | { ok: false; error: string }

/**
 * Admin sign-in — MILESTONE 2 SHELL ONLY.
 *
 * This action validates the submitted credentials server-side (the trust
 * boundary) but does NOT establish a session yet. Full authentication is
 * Milestone 10 (docs/phases/PHASE_1_IMPLEMENTATION_CHECKLIST.md §10).
 *
 * INTEGRATION POINT (Milestone 10) — implement here:
 *   1. Rate-limit by IP + email (lib/security/rate-limit.ts) before any work.
 *   2. `const supabase = await createClient()` (cookie-bound server client) and
 *      `await supabase.auth.signInWithPassword({ email, password })`.
 *   3. On success, `requireAdmin()` (lib/security/auth.ts) → verify auth.uid()
 *      resolves to an active admin_profiles row; sign out + reject otherwise.
 *   4. Write an admin_audit_logs row (login).
 *   5. Redirect only to a same-origin, allow-listed `next` path (no open
 *      redirect).
 *   6. Return a GENERIC 'Invalid email or password.' on any failure — never
 *      reveal whether the email exists.
 */
export async function signInAdmin(raw: unknown): Promise<SignInResult> {
  const parsed = adminLoginSchema.safeParse(raw)
  if (!parsed.success) {
    // Generic message — do not leak which field/why (no enumeration).
    return { ok: false, error: 'Invalid email or password.' }
  }

  return {
    ok: false,
    error:
      'Admin sign-in is enabled in Milestone 10. The secure form and server-side validation are in place.',
  }
}
