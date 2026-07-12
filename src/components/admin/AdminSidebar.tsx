'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utilities/cn'
import { adminNav } from '@/config/navigation'
import { brand } from '@/config/brand'
import { LogoutButton } from '@/components/admin/LogoutButton'

/** Admin navigation sidebar (desktop) with active-route highlighting + logout. */
export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-fog bg-white md:flex">
      <div className="border-b border-fog px-5 py-4">
        <p className="text-sm font-semibold tracking-[0.18em] text-ink uppercase">
          {brand.shortName}
        </p>
        <p className="text-xs text-mist">Administration</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {adminNav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(`${item.href}`))
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'rounded-md px-3 py-2 text-sm transition-colors',
                active ? 'bg-ink text-paper' : 'text-charcoal hover:bg-ink/5',
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-fog p-3">
        <LogoutButton />
      </div>
    </aside>
  )
}
