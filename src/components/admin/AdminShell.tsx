import type { ReactNode } from 'react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { brand } from '@/config/brand'

type AdminShellProps = {
  children: ReactNode
  title: string
}

/**
 * Admin chrome for dashboard/management pages: sidebar (desktop) + a compact
 * mobile header + titled content area. Dashboard, product/order/inventory
 * management, and settings pages compose this in later milestones.
 */
export function AdminShell({ children, title }: AdminShellProps) {
  return (
    <div className="flex min-h-dvh bg-paper">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-fog bg-white px-5 py-4">
          <h1 className="text-base font-medium text-ink">{title}</h1>
          <span className="text-xs tracking-[0.18em] text-mist uppercase md:hidden">
            {brand.shortName}
          </span>
        </header>
        <main className="flex-1 p-5 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
