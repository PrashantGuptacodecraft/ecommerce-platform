import type { NextConfig } from 'next'

/**
 * Milestone 0: minimal, correct baseline only.
 *
 * NOTE: Central security headers (CSP allow-listing Razorpay + Supabase,
 * HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy,
 * Permissions-Policy) are wired here via `lib/security/headers.ts` in
 * Milestone 3 — see docs/SECURITY_MODEL.md §4. They are intentionally NOT
 * present yet so that this milestone stays scoped to project init.
 *
 * Remote image patterns for the Supabase Storage bucket are added in the
 * Supabase-foundation milestone, once the project URL exists.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pin the workspace root to this project. Without it, Turbopack infers the
  // root from the nearest lockfile and can pick up an unrelated one higher in
  // the filesystem (e.g. a stray package-lock.json in the user's home dir).
  turbopack: {
    root: import.meta.dirname,
  },
}

export default nextConfig
