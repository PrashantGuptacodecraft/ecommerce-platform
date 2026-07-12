import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { requireAdmin } from '@/lib/security/auth'

// Admin is never indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

/**
 * Admin route-group guard. Runs `requireAdmin()` (the authoritative server-side
 * gate) for every `/admin/*` route EXCEPT the login page, redirecting
 * non-admins to /admin/login. `x-pathname` is set by middleware; if it is
 * somehow absent we skip here (fail-open) because middleware already coarse-
 * protects and each protected page also calls `requireAdmin()` — so the route
 * is never actually unguarded (docs/SECURITY_MODEL.md §1).
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = (await headers()).get('x-pathname')

  if (pathname && pathname !== '/admin/login') {
    await requireAdmin()
  }

  return <div className="min-h-dvh bg-paper text-ink">{children}</div>
}
