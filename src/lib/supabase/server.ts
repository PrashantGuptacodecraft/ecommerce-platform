import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { getPublicSupabaseConfig } from '@/lib/supabase/config'
import type { Database } from '@/types/database'

/**
 * Cookie-bound Supabase client for Server Components, Server Actions, and
 * Route Handlers (anon key + the user's session cookie). Still RLS-gated —
 * this is how an authenticated admin's session is read server-side. For
 * privileged, RLS-bypassing work use `createAdminClient()` from `admin.ts`.
 */
export async function createClient() {
  const cookieStore = await cookies()
  const { url, anonKey } = getPublicSupabaseConfig()

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // `setAll` was called from a Server Component, where the cookie store
          // is read-only. Session refresh is handled by middleware instead, so
          // this is safe to ignore.
        }
      },
    },
  })
}
