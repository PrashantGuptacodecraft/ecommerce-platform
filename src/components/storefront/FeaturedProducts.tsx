import { getFeaturedProducts } from '@/features/products/queries'
import { ProductGrid } from '@/components/product/ProductGrid'

type FeaturedProductsProps = {
  limit?: number
}

/**
 * Server component that fetches and renders featured products from the database.
 * Uses the "Featured Collection" label — not "Best Sellers" (no sales data yet).
 */
export async function FeaturedProducts({ limit = 4 }: FeaturedProductsProps) {
  const products = await getFeaturedProducts(limit)

  return (
    <ProductGrid
      products={products}
      emptyMessage="No featured products yet"
      emptyDescription="Featured products will appear here once they are marked in the admin panel."
    />
  )
}
