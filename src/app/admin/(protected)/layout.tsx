import { requireAdmin } from '@/lib/security/auth'
import Link from 'next/link'

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const adminContext = await requireAdmin()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-10 h-16 flex items-center px-4 justify-between">
        <div className="font-semibold text-lg flex items-center gap-4">
          <Link href="/admin" className="hover:text-blue-600">
            Admin
          </Link>
          <nav className="text-sm font-normal hidden md:flex items-center gap-4 ml-4">
            <Link href="/admin/products" className="hover:text-blue-600">
              Products
            </Link>
            <Link href="/admin/categories" className="hover:text-blue-600">
              Categories
            </Link>
            <Link href="/admin/inventory" className="hover:text-blue-600">
              Inventory
            </Link>
          </nav>
        </div>
        <div className="text-sm text-gray-500">
          Admin ID: {adminContext.userId.substring(0, 8)}...
        </div>
      </header>
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">{children}</main>
    </div>
  )
}
