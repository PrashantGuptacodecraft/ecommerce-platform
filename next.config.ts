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
 * Milestone 4: Supabase Storage remote image patterns added for product images.
 */

function getSupabaseImagePatterns(): NextConfig['images'] {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return undefined
  try {
    const { hostname } = new URL(supabaseUrl)
    return {
      remotePatterns: [
        {
          protocol: 'https',
          hostname,
          pathname: '/storage/v1/object/public/**',
        },
      ],
    }
  } catch {
    return undefined
  }
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pin the workspace root to this project. Without it, Turbopack infers the
  // root from the nearest lockfile and can pick up an unrelated one higher in
  // the filesystem (e.g. a stray package-lock.json in the user's home dir).
  turbopack: {
    root: import.meta.dirname,
  },
  images: getSupabaseImagePatterns(),
}

import { withSentryConfig } from '@sentry/nextjs'

export default withSentryConfig(nextConfig, {
  org: 'studio-noir',
  project: 'studio-noir-ecommerce',
  silent: !process.env.CI,
  disableLogger: true,
  automaticVercelMonitors: true,
})
