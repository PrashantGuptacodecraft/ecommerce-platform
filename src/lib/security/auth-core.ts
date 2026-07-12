/**
 * Pure authorization helpers - no I/O, no `server-only`, so they are unit
 * testable. The stateful/server pieces live in `auth.ts` (which imports these).
 */

/** The subset of an `admin_profiles` row needed to decide access. */
export type AdminProfileLike = {
  role: string
  is_active: boolean
} | null

/**
 * The single source of truth for "is this an active administrator?".
 * Requires a real `admin_profiles` row with `role = 'admin'` AND
 * `is_active = true`. Client-controlled auth metadata is NEVER consulted
 * (docs/SECURITY_MODEL.md section 1) - the caller passes a row read server-side.
 */
export function resolveAdminAccess(profile: AdminProfileLike): { isAdmin: boolean } {
  const isAdmin = profile !== null && profile.role === 'admin' && profile.is_active === true
  return { isAdmin }
}

/**
 * True if the string contains any ASCII control character (0x00-0x1F or 0x7F).
 * Used to reject header/redirect-splitting payloads (encoded newlines/tabs).
 * Implemented as a char-code scan to avoid a control-character regex literal.
 */
function hasControlChars(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i)
    if (code <= 0x1f || code === 0x7f) return true
  }
  return false
}

/**
 * Validate a post-login redirect target, preventing open redirects.
 *
 * Only same-origin absolute paths within the admin area are allowed. Anything
 * else - protocol-relative (`//host`), absolute URLs (`https://...`), backslash
 * tricks, control characters, non-`/admin` paths, or the login page itself -
 * falls back to `/admin`.
 */
export function safeNextPath(next: string | null | undefined, fallback = '/admin'): string {
  if (typeof next !== 'string' || next.length === 0) return fallback

  if (!next.startsWith('/')) return fallback
  if (next.startsWith('//')) return fallback
  if (next.includes('\\')) return fallback
  if (next.includes('://')) return fallback
  if (hasControlChars(next)) return fallback

  // Allow-list: only the admin area, and never bounce back to the login page.
  if (next !== '/admin' && !next.startsWith('/admin/')) return fallback
  if (next === '/admin/login' || next.startsWith('/admin/login')) return fallback

  return next
}
