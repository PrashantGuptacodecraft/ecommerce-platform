// Server-only authorization gate. Uses the cookie-bound Supabase server client
// (auth.getUser validates the JWT with Supabase Auth — not a decoded cookie)
// and the trusted admin_profiles table. Never import into a Client Component.
import 'server-only'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveAdminAccess } from '@/lib/security/auth-core'

/** Minimal, non-sensitive admin identity passed to callers. */
export type AdminContext = {
  userId: string
  email: string | null
}

export type AdminCheck = {
  isAdmin: boolean
  context: AdminContext | null
}

/**
 * Resolve the current request's admin status: validate the session server-side,
 * then require an active `admin_profiles` row. Never trusts client metadata.
 * Returns `{ isAdmin: false, context: null }` for guests, non-admins, and
 * inactive admins alike (indistinguishable to the caller).
 */
export async function getAdminContext(): Promise<AdminCheck> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { isAdmin: false, context: null }

  const { data: profile } = await supabase
    .from('admin_profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .maybeSingle()

  const { isAdmin } = resolveAdminAccess(profile)
  if (!isAdmin) return { isAdmin: false, context: null }

  return { isAdmin: true, context: { userId: user.id, email: user.email ?? null } }
}

/**
 * THE authorization gate. Call at the top of every protected admin
 * page/layout AND every privileged server action/route (middleware is only a
 * coarse first pass — never the sole gate; docs/SECURITY_MODEL.md §1).
 * Redirects non-admins to the login page and never returns for them.
 */
export async function requireAdmin(): Promise<AdminContext> {
  const { isAdmin, context } = await getAdminContext()
  if (!isAdmin || !context) {
    redirect('/admin/login')
  }
  return context
}
