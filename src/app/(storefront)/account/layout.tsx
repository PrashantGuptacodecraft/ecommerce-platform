import { requireCustomer } from '@/features/auth/server-customer'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogoutButton } from '@/features/auth/components/LogoutButton'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  // Enforce customer auth at the layout level
  try {
    await requireCustomer()
  } catch (e) {
    redirect('/login?next=/account')
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-y-8 lg:grid-cols-4 lg:gap-x-12">
        <aside className="lg:col-span-1">
          <nav className="flex flex-col space-y-1">
            <Link 
              href="/account"
              className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-charcoal-600 transition-colors hover:bg-charcoal-50 hover:text-ink"
            >
              Account Summary
            </Link>
            <Link 
              href="/account/orders"
              className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-charcoal-600 transition-colors hover:bg-charcoal-50 hover:text-ink"
            >
              My Orders
            </Link>
            <div className="pt-4">
              <LogoutButton />
            </div>
          </nav>
        </aside>
        
        <main className="lg:col-span-3">
          {children}
        </main>
      </div>
    </div>
  )
}
