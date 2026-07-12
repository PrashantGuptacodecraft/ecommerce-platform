import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getPublicSupabaseConfig } from '@/lib/supabase/config'

/**
 * Supabase SSR session refresh for middleware (current @supabase/ssr pattern).
 *
 * Rebuilds the response when Supabase rotates auth cookies so the refreshed
 * tokens are written back to the browser. `getUser()` (not `getSession()`)
 * validates the token with Supabase Auth. The caller passes the mutated
 * `requestHeaders` (carrying the CSP nonce / x-pathname) so they propagate.
 *
 * NOTE: this only refreshes/reads the session. It is NOT the authorization
 * gate — `requireAdmin()` (server-only) is. Nothing here is logged.
 */
export async function updateSession(
  request: NextRequest,
  requestHeaders: Headers,
): Promise<{ response: NextResponse; user: { id: string } | null }> {
  let response = NextResponse.next({ request: { headers: requestHeaders } })

  const { url, anonKey } = getPublicSupabaseConfig()

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value)
        }
        response = NextResponse.next({ request: { headers: requestHeaders } })
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { response, user: user ? { id: user.id } : null }
}
