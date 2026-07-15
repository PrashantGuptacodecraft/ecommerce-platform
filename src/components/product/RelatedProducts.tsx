import { getRelatedProducts } from '@/features/products/queries'
import { ProductGrid } from '@/components/product/ProductGrid'

export async function RelatedProducts({
  currentProductId,
  categoryId,
}: {
  currentProductId: string
  categoryId?: string
}) {
  if (!categoryId) return null
  
  const related = await getRelatedProducts(currentProductId, categoryId, 4)
  
  if (related.length === 0) return null

  return (
    <div className="mt-24 border-t border-fog pt-12">
      <h2 className="text-2xl font-bold tracking-tight text-ink mb-8">You May Also Like</h2>
      <ProductGrid products={related} />
    </div>
  )
}
