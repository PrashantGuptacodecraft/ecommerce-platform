'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Drawer } from '@/components/ui/Drawer'
import { LogoutButton } from '@/components/admin/LogoutButton'
import { brand } from '@/config/brand'
import { cn } from '@/lib/utilities/cn'
import {
  MenuIcon,
  LayoutDashboardIcon,
  BoxIcon,
  TagsIcon,
  ClipboardListIcon,
} from '@/components/ui/icons'

type AdminLayoutClientProps = {
  children: React.ReactNode
  adminEmail: string | null
}

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboardIcon },
  { label: 'Products', href: '/admin/products', icon: BoxIcon },
  { label: 'Categories', href: '/admin/categories', icon: TagsIcon },
  { label: 'Inventory', href: '/admin/inventory', icon: ClipboardListIcon },
]

export function AdminLayoutClient({ children, adminEmail }: AdminLayoutClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  // Generate simple breadcrumbs from pathname
  const pathSegments = pathname.split('/').filter(Boolean)
  const breadcrumbs = pathSegments.map((segment, index) => {
    const isLast = index === pathSegments.length - 1
    const label = segment.charAt(0).toUpperCase() + segment.slice(1)
    const href = '/' + pathSegments.slice(0, index + 1).join('/')
    return { label, href, isLast }
  })

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-ink text-paper">
      <div className="flex h-16 shrink-0 items-center border-b border-white/10 px-6">
        <span className="text-sm font-bold tracking-[0.2em] uppercase text-white">
          {brand.shortName}
        </span>
        <span className="ml-2 text-xs text-mist">Admin</span>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(`${item.href}`))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                'min-h-[44px] outline-none focus-visible:ring-2 focus-visible:ring-accent',
                active ? 'bg-white/10 text-white' : 'text-mist hover:bg-white/5 hover:text-white',
              )}
            >
              <Icon
                className={cn(
                  'mr-3 size-5 shrink-0',
                  active ? 'text-white' : 'text-mist group-hover:text-white',
                )}
              />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-4 px-3">
          <p className="truncate text-xs font-medium text-mist">{adminEmail || 'Administrator'}</p>
        </div>
        <div className="px-3">
          <LogoutButton className="w-full text-left text-sm text-mist hover:text-white hover:bg-white/5 p-2 -mx-2 rounded-md transition-colors" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-dvh bg-paper overflow-x-hidden">
      {/* Desktop Sidebar (Fixed) */}
      <aside className="hidden w-64 shrink-0 flex-col md:flex fixed inset-y-0 left-0 z-20">
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col md:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-fog bg-white/80 px-4 backdrop-blur-md md:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="md:hidden flex size-11 items-center justify-center rounded-md text-charcoal outline-none focus-visible:ring-2 focus-visible:ring-accent -ml-2"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open sidebar menu"
            >
              <MenuIcon className="size-6" />
            </button>

            {/* Breadcrumbs */}
            <nav aria-label="Breadcrumb" className="hidden sm:flex">
              <ol className="flex items-center space-x-2 text-sm text-slate">
                {breadcrumbs.map((crumb, idx) => (
                  <li key={crumb.href} className="flex items-center">
                    {idx > 0 && <span className="mx-2 text-mist">/</span>}
                    {crumb.isLast ? (
                      <span className="font-medium text-ink" aria-current="page">
                        {crumb.label}
                      </span>
                    ) : (
                      <Link
                        href={crumb.href}
                        className="hover:text-ink transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
                      >
                        {crumb.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>

          <div className="flex items-center md:hidden">
            <span className="text-xs font-medium text-slate truncate max-w-[120px]">
              {adminEmail || 'Admin'}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">{children}</main>
      </div>

      {/* Mobile Drawer */}
      <Drawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        side="left"
        className="w-[280px] p-0 bg-ink"
      >
        <SidebarContent />
      </Drawer>
    </div>
  )
}
