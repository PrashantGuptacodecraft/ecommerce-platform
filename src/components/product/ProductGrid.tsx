import { EmptyState } from '@/components/ui'
import { StaggerContainer, StaggerItem } from '@/components/motion'
import { ProductCard } from '@/components/product/ProductCard'
import type { ProductSummary } from '@/features/products/types'

type ProductGridProps = {
  products: ProductSummary[]
  emptyMessage?: string
  emptyDescription?: string
}

/**
 * Responsive product grid with staggered reveal animation.
 * Renders EmptyState when the product list is empty.
 */
export function ProductGrid({
  products,
  emptyMessage = 'No products found',
  emptyDescription = 'Try adjusting your filters or check back later.',
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <EmptyState
        title={emptyMessage}
        description={emptyDescription}
      />
    )
  }

  return (
    <StaggerContainer className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {products.map((product) => (
        <StaggerItem key={product.id}>
          <ProductCard product={product} />
        </StaggerItem>
      ))}
    </StaggerContainer>
  )
}
