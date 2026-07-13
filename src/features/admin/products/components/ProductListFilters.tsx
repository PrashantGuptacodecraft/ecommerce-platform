'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useState, useEffect, useRef } from 'react'

export default function ProductListFilters({
  categories,
}: {
  categories: { id: string; name: string }[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('q') || '')
  const initialRender = useRef(true)

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(name, value)
      } else {
        params.delete(name)
      }
      params.delete('page') // Reset page on filter change
      return params.toString()
    },
    [searchParams],
  )

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false
      return
    }

    const timer = setTimeout(() => {
      router.push(pathname + '?' + createQueryString('q', search))
    }, 300)

    return () => clearTimeout(timer)
  }, [search, router, pathname, createQueryString])

  return (
    <div className="p-4 border-b border-gray-200 bg-white space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <label htmlFor="search-products" className="sr-only">
            Search
          </label>
          <input
            id="search-products"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, slug, or SKU..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-ink focus:border-ink"
          />
        </div>

        {/* Filters Grid for Mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Status Filter */}
          <select
            aria-label="Filter by status"
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-ink focus:border-ink bg-white"
            value={searchParams.get('status') || ''}
            onChange={(e) =>
              router.push(pathname + '?' + createQueryString('status', e.target.value))
            }
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Category Filter */}
          <select
            aria-label="Filter by category"
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-ink focus:border-ink bg-white"
            value={searchParams.get('categoryId') || ''}
            onChange={(e) =>
              router.push(pathname + '?' + createQueryString('categoryId', e.target.value))
            }
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            aria-label="Filter by stock"
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-ink focus:border-ink bg-white"
            value={searchParams.get('stockStatus') || ''}
            onChange={(e) =>
              router.push(pathname + '?' + createQueryString('stockStatus', e.target.value))
            }
          >
            <option value="">All Stock</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
      </div>
    </div>
  )
}
