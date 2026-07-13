import { requireAdmin } from '@/lib/security/auth'
import Link from 'next/link'
import { site } from '@/config/site'
import { getAdminProducts } from '@/features/admin/products/queries'
import { getAdminCategoryOptions } from '@/features/admin/categories/queries'
import ProductListFilters from '@/features/admin/products/components/ProductListFilters'
import { Pagination } from '@/components/product/Pagination'

export default async function AdminProductsPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  await requireAdmin()
  const searchParams = await props.searchParams
  const page = parseInt((searchParams?.page as string) || '1', 10)
  const search = (searchParams?.q as string) || ''
  const status = searchParams?.status as 'active' | 'inactive' | undefined
  const categoryId = searchParams?.categoryId as string | undefined
  const stockStatus = searchParams?.stockStatus as
    'low_stock' | 'out_of_stock' | 'in_stock' | undefined

  // Safe searchParams dictionary for Pagination component
  const safeSearchParams: Record<string, string> = {}
  if (search) safeSearchParams.q = search
  if (status) safeSearchParams.status = status
  if (categoryId) safeSearchParams.categoryId = categoryId
  if (stockStatus) safeSearchParams.stockStatus = stockStatus

  const [productsData, categories] = await Promise.all([
    getAdminProducts({ page, search, status, categoryId, stockStatus }),
    getAdminCategoryOptions(),
  ])

  const { products, count, totalPages } = productsData

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <Link
          href="/admin/products/new"
          className="bg-ink text-paper px-4 min-h-[44px] flex items-center justify-center rounded-md font-medium text-sm hover:bg-gray-800 transition-colors"
        >
          Create Product
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
        <ProductListFilters categories={categories} />

        {/* Mobile Product Cards View */}
        <div className="block md:hidden">
          {products?.map((p) => {
            const totalStock = p.product_variants.reduce((sum, v) => sum + v.stock_quantity, 0)
            const isLowStock = totalStock > 0 && totalStock <= site.lowStockThreshold
            const isOutOfStock = totalStock === 0

            return (
              <div key={p.id} className="p-4 border-b border-gray-200 flex flex-col gap-2 relative">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-ink pr-12">{p.name}</div>
                    <div className="text-gray-500 text-xs mt-1">{p.slug}</div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium shrink-0 ${p.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                  >
                    {p.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="flex justify-between items-end mt-2">
                  <div className="flex flex-col gap-1">
                    <div className="text-sm font-medium">
                      ₹{(p.base_price_paise / 100).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span>{totalStock} units</span>
                      {isOutOfStock && (
                        <span className="text-red-600 text-xs font-medium ml-2">Out of Stock</span>
                      )}
                      {isLowStock && (
                        <span className="text-amber-600 text-xs font-medium ml-2">Low Stock</span>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label={`Edit ${p.name}`}
                  >
                    Edit
                  </Link>
                </div>
              </div>
            )
          })}
          {(!products || products.length === 0) && (
            <div className="p-8 text-center text-gray-500 text-sm">No products found.</div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">Product</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Price</th>
                <th className="px-6 py-3 font-medium">Stock</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products?.map((p) => {
                const totalStock = p.product_variants.reduce((sum, v) => sum + v.stock_quantity, 0)
                const isLowStock = totalStock > 0 && totalStock <= site.lowStockThreshold
                const isOutOfStock = totalStock === 0

                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-ink">{p.name}</div>
                      <div className="text-gray-500 text-xs mt-1">{p.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${p.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                      >
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">₹{(p.base_price_paise / 100).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span>{totalStock} units</span>
                        {isOutOfStock && (
                          <span className="text-red-600 text-xs font-medium">Out of Stock</span>
                        )}
                        {isLowStock && (
                          <span className="text-amber-600 text-xs font-medium">Low Stock</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium inline-flex min-h-[44px] items-center justify-center"
                        aria-label={`Edit ${p.name}`}
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                )
              })}
              {(!products || products.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No products found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-center">
            <Pagination page={page} totalPages={totalPages} searchParams={safeSearchParams} />
          </div>
        )}
      </div>
    </div>
  )
}
