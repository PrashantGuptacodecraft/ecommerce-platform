import type { ReactNode } from 'react'
import type { Metadata } from 'next'

// Admin is never indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

/**
 * Admin route-group shell.
 *
 * SECURITY — INTEGRATION POINT (Milestone 10): server-side session verification
 * (`requireAdmin()` from lib/security/auth.ts) is added HERE, so every
 * `/admin/*` request other than `/admin/login` is gated server-side before it
 * renders — redirecting unauthenticated users to the login page. Client-side
 * route guards are UX only and are never the actual gate
 * (docs/SECURITY_MODEL.md §1).
 *
 * In Milestone 2 this is a passive wrapper: no protected data or mutations
 * exist yet (dashboard/list pages are populated in Milestones 12+), so nothing
 * sensitive is exposed by the un-guarded shell.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh bg-paper text-ink">{children}</div>
}
