import type { Metadata } from 'next'
import { getAdminInventory } from '@/features/admin/inventory/queries'
import { InventoryManager } from '@/features/admin/inventory/components/InventoryManager'
import { Container } from '@/components/ui/Container'

export const metadata: Metadata = {
  title: 'Inventory Management - Admin',
}

type PageProps = {
  searchParams: Promise<{
    page?: string
    search?: string
    stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock'
  }>
}

export default async function AdminInventoryPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams
  const page = parseInt(resolvedParams.page || '1', 10)
  const search = resolvedParams.search || ''
  const stockStatus = resolvedParams.stockStatus

  const { variants, totalPages } = await getAdminInventory({
    page,
    search,
    stockStatus,
  })

  return (
    <Container className="py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Inventory Management</h1>
          <p className="text-mist text-sm mt-1">Adjust and monitor variant stock levels.</p>
        </div>
      </div>

      <InventoryManager variants={variants} totalPages={totalPages} currentPage={page} />
    </Container>
  )
}
