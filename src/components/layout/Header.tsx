'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { BagIcon, MenuIcon, SearchIcon } from '@/components/ui/icons'
import { MobileDrawerNav } from '@/components/layout/MobileDrawerNav'
import { brand } from '@/config/brand'
import { mainNav } from '@/config/navigation'

const iconButton =
  'inline-flex size-11 items-center justify-center rounded-md text-charcoal transition-colors hover:bg-ink/5'

/**
 * Sticky storefront header: mobile menu trigger + wordmark + desktop nav +
 * search/cart actions. Cart count wiring arrives with the cart (Milestone 5).
 */
export function Header() {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <header className="sticky top-0 z-[var(--z-header)] border-b border-fog/80 bg-paper/85 backdrop-blur">
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              aria-label="Open menu"
              className={`${iconButton} md:hidden`}
            >
              <MenuIcon className="size-5" />
            </button>
            <Link
              href="/"
              className="px-1 text-lg font-semibold tracking-[0.22em] text-ink uppercase"
            >
              {brand.name}
            </Link>
          </div>

          <nav className="hidden items-center gap-7 md:flex">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-charcoal transition-colors hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <Link href="/search" aria-label="Search" className={iconButton}>
              <SearchIcon className="size-5" />
            </Link>
            <Link href="/cart" aria-label="Cart" className={iconButton}>
              <BagIcon className="size-5" />
            </Link>
          </div>
        </div>
      </Container>

      <MobileDrawerNav open={navOpen} onClose={() => setNavOpen(false)} />
    </header>
  )
}
