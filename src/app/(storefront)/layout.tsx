import type { ReactNode } from 'react'
import { AnnouncementBar } from '@/components/layout/AnnouncementBar'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ToastProvider } from '@/components/ui/Toast'

/**
 * Storefront chrome for the public route group: announcement bar, header
 * (with mobile drawer nav), footer, and the app-wide toast host. Individual
 * storefront pages render into `main`.
 */
export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex min-h-dvh flex-col">
        <AnnouncementBar />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </ToastProvider>
  )
}
