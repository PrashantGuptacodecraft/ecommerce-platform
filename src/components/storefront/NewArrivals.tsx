import { getNewArrivals } from '@/features/products/queries'
import { ProductGrid } from '@/components/product/ProductGrid'

type NewArrivalsProps = {
  limit?: number
}

/**
 * Server component that fetches and renders new arrival products from the
 * database. Only products flagged `is_new_arrival = true` appear.
 */
export async function NewArrivals({ limit = 4 }: NewArrivalsProps) {
  const products = await getNewArrivals(limit)

  return (
    <ProductGrid
      products={products}
      emptyMessage="No new arrivals yet"
      emptyDescription="New arrivals will appear here once products are marked in the admin panel."
    />
  )
}
