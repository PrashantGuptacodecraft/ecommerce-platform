'use client'

import Link from 'next/link'
import { Drawer } from '@/components/ui/Drawer'
import { mainNav } from '@/config/navigation'

type MobileDrawerNavProps = {
  open: boolean
  onClose: () => void
}

/** Mobile slide-in navigation. Composes the design-system `Drawer`. */
export function MobileDrawerNav({ open, onClose }: MobileDrawerNavProps) {
  return (
    <Drawer open={open} onClose={onClose} title="Menu" side="left">
      <nav className="flex flex-col">
        {mainNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className="border-b border-fog py-3 text-base text-charcoal transition-colors hover:text-ink"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </Drawer>
  )
}
