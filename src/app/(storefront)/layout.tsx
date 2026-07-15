import type { ReactNode } from 'react'
import { AnnouncementBar } from '@/components/layout/AnnouncementBar'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ToastProvider } from '@/components/ui/Toast'
import { getCart } from '@/features/cart/queries'
import { WishlistProvider } from '@/features/wishlist/components/WishlistProvider'

/**
 * Storefront chrome for the public route group: announcement bar, header
 * (with mobile drawer nav), footer, and the app-wide toast host. Individual
 * storefront pages render into `main`.
 */
export default async function StorefrontLayout({ children }: { children: ReactNode }) {
  const cart = await getCart()

  return (
    <WishlistProvider>
      <ToastProvider>
        <div className="flex min-h-dvh flex-col">
          <AnnouncementBar />
          <Header cart={cart} />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </ToastProvider>
    </WishlistProvider>
  )
}
