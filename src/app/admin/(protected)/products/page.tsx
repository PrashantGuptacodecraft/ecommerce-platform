import { requireAdmin } from '@/lib/security/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { site } from '@/config/site'

export default async function AdminProductsPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  await requireAdmin()
  const searchParams = await props.searchParams
  const page = parseInt((searchParams?.page as string) || '1', 10)
  const q = (searchParams?.q as string) || ''

  const supabase = await createClient()
  let query = supabase.from('products').select(
    `
    id, name, slug, is_active, base_price_paise, created_at,
    product_variants ( id, stock_quantity, sku )
  `,
    { count: 'exact' },
  )

  if (q) {
    query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%`)
  }

  const from = (page - 1) * site.pagination.adminPageSize
  const to = from + site.pagination.adminPageSize - 1

  const { data: products, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <Link
          href="/admin/products/new"
          className="bg-ink text-paper px-4 py-2 rounded-md font-medium text-sm hover:bg-gray-800 transition-colors"
        >
          Create Product
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <form className="flex gap-2">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search by name or slug..."
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              className="bg-gray-100 text-ink px-4 py-2 rounded-md font-medium text-sm hover:bg-gray-200 border border-gray-300"
            >
              Search
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
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
                        className="text-blue-600 hover:text-blue-800 font-medium"
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
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
