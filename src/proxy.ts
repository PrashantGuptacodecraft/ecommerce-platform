import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { buildSecurityHeaders } from '@/lib/security/headers'

/**
 * Global middleware:
 *  1. Generates a per-request CSP nonce and applies the central security
 *     headers to EVERY response (docs/SECURITY_MODEL.md §4).
 *  2. For /admin routes: refreshes the Supabase session and performs a COARSE
 *     redirect of unauthenticated users to the login page. This is
 *     defense-in-depth only — the authoritative gate is `requireAdmin()` in the
 *     admin layout and every admin action (never middleware alone).
 *
 * `x-nonce` and `x-pathname` are forwarded on the request so Server Components
 * (the admin layout guard) and Next's script tagging can read them.
 */
function generateNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const isProd = process.env.NODE_ENV === 'production'
  const nonce = generateNonce()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  const { pathname } = request.nextUrl
  const isAdminRoute = pathname.startsWith('/admin')

  // Strict nonce CSP only on the dynamic /admin surface; public storefront
  // pages are statically prerendered and need the unsafe-inline fallback (a
  // per-request nonce can't be baked into static HTML). See headers.ts.
  const securityHeaders = buildSecurityHeaders({
    nonce,
    isProd,
    supabaseUrl,
    strictScripts: isAdminRoute,
  })

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('x-pathname', pathname)
  // Next.js reads the nonce from the request CSP header to tag its own scripts.
  requestHeaders.set('content-security-policy', securityHeaders['Content-Security-Policy'] ?? '')

  let response: NextResponse

  if (isAdminRoute) {
    const { response: sessionResponse, user } = await updateSession(request, requestHeaders)
    response = sessionResponse

    if (pathname !== '/admin/login' && !user) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/admin/login'
      loginUrl.search = ''
      loginUrl.searchParams.set('next', pathname)

      const redirectResponse = NextResponse.redirect(loginUrl)
      // Preserve any refreshed auth cookies on the redirect.
      for (const cookie of response.cookies.getAll()) {
        redirectResponse.cookies.set(cookie)
      }
      applyHeaders(redirectResponse, securityHeaders)
      return redirectResponse
    }
  } else {
    response = NextResponse.next({ request: { headers: requestHeaders } })
  }

  applyHeaders(response, securityHeaders)
  return response
}

function applyHeaders(response: NextResponse, headers: Record<string, string>): void {
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value)
  }
}

export const config = {
  // Run on everything except Next internals and static assets (so security
  // headers cover all HTML/data responses).
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
