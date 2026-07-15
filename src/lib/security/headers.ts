/**
 * Central security-header configuration (docs/SECURITY_MODEL.md §4).
 *
 * Pure/serializable — safe to run in the Edge middleware. No secrets are read
 * here (only the PUBLIC Supabase URL, to allow-list its origin). Applied to
 * every response by `src/middleware.ts`.
 *
 * CSP design:
 *  - Production: nonce-based `script-src` (the nonce is generated per request in
 *    middleware and picked up by Next.js for its own scripts). NO `unsafe-eval`,
 *    NO `unsafe-inline` for scripts.
 *  - Development: `script-src` allows `unsafe-eval` + `unsafe-inline` because
 *    Next.js/Turbopack HMR requires them. This relaxation is DEV-ONLY and never
 *    ships to production (gated on `isProd`).
 *  - `style-src 'unsafe-inline'` is a documented, deliberate exception: motion/
 *    react and React set inline `style` attributes dynamically, which cannot be
 *    covered by a nonce/hash. Styles are far lower risk than scripts.
 *
 * Documented external origins:
 *  - Supabase project origin (`connect-src`, `img-src`): REST/Auth/Storage +
 *    realtime websocket (wss).
 *  - Razorpay (`script-src` checkout.js, `frame-src` checkout/api iframe,
 *    `connect-src` api + lumberjack telemetry) — reserved for Milestone 7; the
 *    origins are allow-listed now so the CSP does not need to change then.
 */

export type SecurityHeaderOptions = {
  nonce: string
  isProd: boolean
  /** The public Supabase URL (NEXT_PUBLIC_SUPABASE_URL). */
  supabaseUrl?: string
  /**
   * When true (dynamic, sensitive routes like /admin/*), use a strict
   * nonce-based `script-src` with NO `unsafe-inline`. When false (public,
   * STATICALLY-prerendered storefront pages), fall back to `'unsafe-inline'`
   * because a per-request nonce cannot be baked into static HTML — Next.js
   * emits nonce-less inline bootstrap scripts for those pages, which a nonce
   * CSP would block (breaking hydration). Never `unsafe-eval` in production
   * either way. Documented, deliberate split — see docs/SECURITY_MODEL.md §4.
   * Defaults to strict.
   */
  strictScripts?: boolean
}

const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com'
const RAZORPAY_FRAME = 'https://api.razorpay.com https://checkout.razorpay.com'
const RAZORPAY_CONNECT = 'https://api.razorpay.com https://lumberjack.razorpay.com'

/** Extract the `https://host` origin from a URL string, or null if invalid. */
export function toOrigin(url: string | undefined): string | null {
  if (!url) return null
  try {
    return new URL(url).origin
  } catch {
    return null
  }
}

export function buildContentSecurityPolicy(options: SecurityHeaderOptions): string {
  const { nonce, isProd, supabaseUrl, strictScripts = true } = options
  const supabaseOrigin = toOrigin(supabaseUrl)
  const supabaseWs = supabaseOrigin ? supabaseOrigin.replace(/^https:/, 'wss:') : null

  const scriptSrc = !isProd
    ? // DEV ONLY — Turbopack/React-Refresh HMR needs eval + inline. Never prod.
      `'self' 'unsafe-eval' 'unsafe-inline' ${RAZORPAY_SCRIPT}`
    : strictScripts
      ? // Strict: nonce, no unsafe-inline, no unsafe-eval (dynamic /admin routes).
        `'self' 'nonce-${nonce}' ${RAZORPAY_SCRIPT}`
      : // Static public pages: unsafe-inline required for Next's nonce-less
        // static bootstrap scripts. Still NO unsafe-eval. See §4.
        `'self' 'unsafe-inline' ${RAZORPAY_SCRIPT}`

  const connectSrc = [
    "'self'",
    supabaseOrigin,
    supabaseWs,
    RAZORPAY_CONNECT,
    // Dev HMR websocket
    isProd ? null : 'ws:',
  ]
    .filter(Boolean)
    .join(' ')

  const imgSrc = ["'self'", 'data:', 'blob:', supabaseOrigin].filter(Boolean).join(' ')

  const directives = [
    `default-src 'self'`,
    `base-uri 'self'`,
    `object-src 'none'`,
    // Frame protection: nobody may frame us (replaces/reinforces X-Frame-Options).
    `frame-ancestors 'none'`,
    `form-action 'self'`,
    `script-src ${scriptSrc}`,
    // Deliberate, documented exception — see file header.
    `style-src 'self' 'unsafe-inline'`,
    `img-src ${imgSrc}`,
    `font-src 'self' data:`,
    `connect-src ${connectSrc}`,
    `frame-src ${RAZORPAY_FRAME}`,
    `worker-src 'self' blob:`,
    `manifest-src 'self'`,
  ]

  if (isProd) directives.push('upgrade-insecure-requests')

  return directives.join('; ')
}

/**
 * The full set of security response headers. `Strict-Transport-Security` is
 * production-only (never send HSTS from localhost/http).
 */
export function buildSecurityHeaders(options: SecurityHeaderOptions): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Security-Policy': buildContentSecurityPolicy(options),
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
    // Belt-and-braces alongside CSP frame-ancestors for older browsers.
    'X-Frame-Options': 'DENY',
  }

  if (options.isProd) {
    headers['Strict-Transport-Security'] = 'max-age=63072000; includeSubDomains; preload'
  }

  return headers
}
