import { describe, expect, it } from 'vitest'
import { buildContentSecurityPolicy, buildSecurityHeaders, toOrigin } from '@/lib/security/headers'

const SUPABASE = 'https://abcdefgh.supabase.co'

function directive(csp: string, name: string): string {
  return (
    csp
      .split(';')
      .map((d) => d.trim())
      .find((d) => d.startsWith(`${name} `)) ?? ''
  )
}

describe('toOrigin', () => {
  it('extracts the origin', () => {
    expect(toOrigin(SUPABASE)).toBe('https://abcdefgh.supabase.co')
  })
  it('returns null for invalid or missing', () => {
    expect(toOrigin('not a url')).toBeNull()
    expect(toOrigin(undefined)).toBeNull()
  })
})

describe('Content-Security-Policy (production, strict = /admin)', () => {
  const csp = buildContentSecurityPolicy({
    nonce: 'NONCE123',
    isProd: true,
    supabaseUrl: SUPABASE,
    strictScripts: true,
  })

  it('uses a per-request nonce for scripts', () => {
    expect(directive(csp, 'script-src')).toContain("'nonce-NONCE123'")
  })
  it('never allows unsafe-eval', () => {
    expect(csp).not.toContain('unsafe-eval')
  })
  it('does not allow unsafe-inline for scripts on the strict surface', () => {
    expect(directive(csp, 'script-src')).not.toContain('unsafe-inline')
  })
  it('blocks framing via frame-ancestors none', () => {
    expect(directive(csp, 'frame-ancestors')).toBe("frame-ancestors 'none'")
  })
  it('allow-lists the Supabase origin + websocket', () => {
    expect(directive(csp, 'connect-src')).toContain('https://abcdefgh.supabase.co')
    expect(directive(csp, 'connect-src')).toContain('wss://abcdefgh.supabase.co')
  })
  it('allow-lists Razorpay (script + frame + connect)', () => {
    expect(directive(csp, 'script-src')).toContain('https://checkout.razorpay.com')
    expect(directive(csp, 'frame-src')).toContain('https://api.razorpay.com')
    expect(directive(csp, 'connect-src')).toContain('https://api.razorpay.com')
  })
  it('upgrades insecure requests in production', () => {
    expect(csp).toContain('upgrade-insecure-requests')
  })
})

describe('Content-Security-Policy (production, non-strict = static storefront)', () => {
  const csp = buildContentSecurityPolicy({
    nonce: 'NONCE123',
    isProd: true,
    supabaseUrl: SUPABASE,
    strictScripts: false,
  })

  it('allows unsafe-inline for Next static bootstrap scripts', () => {
    expect(directive(csp, 'script-src')).toContain("'unsafe-inline'")
  })
  it('still never allows unsafe-eval', () => {
    expect(csp).not.toContain('unsafe-eval')
  })
  it('does not embed a nonce (static pages cannot use one)', () => {
    expect(directive(csp, 'script-src')).not.toContain('nonce-')
  })
})

describe('Content-Security-Policy (development)', () => {
  const csp = buildContentSecurityPolicy({ nonce: 'x', isProd: false, supabaseUrl: SUPABASE })

  it('permits unsafe-eval for HMR (dev only)', () => {
    expect(directive(csp, 'script-src')).toContain('unsafe-eval')
  })
  it('does not upgrade insecure requests', () => {
    expect(csp).not.toContain('upgrade-insecure-requests')
  })
})

describe('buildSecurityHeaders', () => {
  it('sends HSTS only in production', () => {
    const prod = buildSecurityHeaders({ nonce: 'x', isProd: true, supabaseUrl: SUPABASE })
    const dev = buildSecurityHeaders({ nonce: 'x', isProd: false, supabaseUrl: SUPABASE })
    expect(prod['Strict-Transport-Security']).toContain('max-age=63072000')
    expect(dev['Strict-Transport-Security']).toBeUndefined()
  })
  it('sets the standard hardening headers', () => {
    const h = buildSecurityHeaders({ nonce: 'x', isProd: true, supabaseUrl: SUPABASE })
    expect(h['X-Content-Type-Options']).toBe('nosniff')
    expect(h['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
    expect(h['Permissions-Policy']).toContain('camera=()')
    expect(h['X-Frame-Options']).toBe('DENY')
    expect(h['Content-Security-Policy']).toBeTruthy()
  })
})
