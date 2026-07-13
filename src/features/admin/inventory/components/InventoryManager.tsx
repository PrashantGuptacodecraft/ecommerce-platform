'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { StockAdjustmentDrawer } from './StockAdjustmentDrawer'

type InventoryManagerProps = {
  variants: any[]
  totalPages: number
  currentPage: number
}

export function InventoryManager({ variants, totalPages, currentPage }: InventoryManagerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [selectedVariant, setSelectedVariant] = useState<any | null>(null)

  const currentSearch = searchParams.get('search') || ''
  const currentStatus = searchParams.get('stockStatus') || ''

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const search = formData.get('search') as string

    const params = new URLSearchParams(searchParams.toString())
    if (search) params.set('search', search)
    else params.delete('search')

    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  const handleStatusFilter = (status: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (status) params.set('stockStatus', status)
    else params.delete('stockStatus')

    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearch} className="w-full md:w-1/3 flex gap-2">
          <Input
            name="search"
            placeholder="Search by SKU or product name..."
            defaultValue={currentSearch}
            className="flex-grow"
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <Button
            variant={!currentStatus ? 'primary' : 'outline'}
            onClick={() => handleStatusFilter('')}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={currentStatus === 'in_stock' ? 'primary' : 'outline'}
            onClick={() => handleStatusFilter('in_stock')}
            size="sm"
          >
            In Stock
          </Button>
          <Button
            variant={currentStatus === 'low_stock' ? 'primary' : 'outline'}
            onClick={() => handleStatusFilter('low_stock')}
            size="sm"
          >
            Low Stock
          </Button>
          <Button
            variant={currentStatus === 'out_of_stock' ? 'primary' : 'outline'}
            onClick={() => handleStatusFilter('out_of_stock')}
            size="sm"
          >
            Out of Stock
          </Button>
        </div>
      </div>

      {/* Table List */}
      <div className="bg-white rounded-md border border-fog overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-paper border-b border-fog text-xs uppercase text-slate">
              <tr>
                <th className="px-4 py-3 font-medium">Product / SKU</th>
                <th className="px-4 py-3 font-medium text-right">Stock</th>
                <th className="px-4 py-3 font-medium text-center">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fog">
              {variants.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-mist">
                    No variants found matching your criteria.
                  </td>
                </tr>
              ) : (
                variants.map((v) => (
                  <tr key={v.id} className="hover:bg-paper/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink">{v.products?.name}</div>
                      <div className="text-xs text-mist font-mono mt-0.5">{v.sku}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-ink">
                      {v.stock_quantity}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {!v.is_active ? (
                        <Badge variant="neutral">Inactive</Badge>
                      ) : v.stock_quantity === 0 ? (
                        <Badge variant="danger">Out of Stock</Badge>
                      ) : v.stock_quantity < 5 ? (
                        <Badge variant="warning">Low Stock</Badge>
                      ) : (
                        <Badge variant="success">In Stock</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="secondary" size="sm" onClick={() => setSelectedVariant(v)}>
                        Adjust
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-fog bg-paper flex items-center justify-between">
            <div className="text-xs text-slate">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <StockAdjustmentDrawer
        isOpen={!!selectedVariant}
        onClose={() => setSelectedVariant(null)}
        variant={selectedVariant}
      />
    </div>
  )
}
