import type { ReactNode } from 'react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { LogoutButton } from '@/components/admin/LogoutButton'
import { brand } from '@/config/brand'

type AdminShellProps = {
  children: ReactNode
  title: string
}

/**
 * Admin chrome for dashboard/management pages: sidebar (desktop) + a compact
 * mobile header (with logout, since the sidebar is hidden on mobile) + titled
 * content area. Management pages compose this in later milestones.
 */
export function AdminShell({ children, title }: AdminShellProps) {
  return (
    <div className="flex min-h-dvh bg-paper">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-fog bg-white px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="text-xs tracking-[0.18em] text-mist uppercase md:hidden">
              {brand.shortName}
            </span>
            <h1 className="text-base font-medium text-ink">{title}</h1>
          </div>
          <div className="md:hidden">
            <LogoutButton className="px-2 py-1" />
          </div>
        </header>
        <main className="flex-1 p-5 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
