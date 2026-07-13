import { requireAdmin } from '@/lib/security/auth'
import { getAdminCategories } from '@/features/admin/categories/queries'
import { ProductForm } from '@/features/admin/products/components/ProductForm'
import Link from 'next/link'

export default async function NewProductPage() {
  await requireAdmin()

  const { categories } = await getAdminCategories({ search: '', page: 1 })
  const mappedCategories = categories.map((c) => ({ id: c.id, name: c.name }))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/products"
          className="text-gray-500 hover:text-ink transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 rounded-md"
        >
          &larr; Back
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Create Product</h1>
      </div>

      <ProductForm categories={mappedCategories} />
    </div>
  )
}
