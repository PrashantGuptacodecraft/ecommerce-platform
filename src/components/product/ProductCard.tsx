import Link from 'next/link'
import Image from 'next/image'
import { Badge, Price } from '@/components/ui'
import { ScaleOnHover } from '@/components/motion'
import { cn } from '@/lib/utilities/cn'
import { getProductImageUrl } from '@/lib/utilities/supabase-image'
import { ImageFallback } from '@/components/product/ImageFallback'
import type { ProductSummary } from '@/features/products/types'

type ProductCardProps = {
  product: ProductSummary
}

/**
 * Product card for listing grids. Wraps the entire card in a link to the PDP.
 *
 * Badges overlay the image top-left:
 * - "New" for new arrivals
 * - "Sold Out" for zero stock
 *
 * The image area uses ScaleOnHover for a subtle interactive feel.
 * If no image is available, a polished gradient fallback is shown.
 */
import { WishlistButton } from '@/components/product/WishlistButton'

export function ProductCard({ product }: ProductCardProps) {
  const imageUrl = product.primaryImage
    ? getProductImageUrl(product.primaryImage.storage_path)
    : null

  const isSoldOut = product.totalStock === 0

  return (
    <div className="group block relative">
      <Link href={`/product/${product.slug}`} className="block" aria-label={product.name}>
        {/* Image area */}
        <div className="relative overflow-hidden rounded-lg">
          <ScaleOnHover>
            {imageUrl ? (
              <div className="relative aspect-[4/5]">
                <Image
                  src={imageUrl}
                  alt={product.primaryImage?.alt_text ?? product.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className={cn('object-cover', isSoldOut && 'opacity-60')}
                />
              </div>
            ) : (
              <ImageFallback productName={product.name} className={cn(isSoldOut && 'opacity-60')} />
            )}
          </ScaleOnHover>

          {/* Overlay badges — top-left */}
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1.5">
            {product.isNewArrival && <Badge variant="accent">New</Badge>}
            {isSoldOut && <Badge variant="danger">Sold Out</Badge>}
          </div>
        </div>

        {/* Info below image */}
        <div className="mt-3 space-y-1">
          <h3 className="truncate text-sm font-medium text-ink group-hover:text-accent transition-colors duration-150">
            {product.name}
          </h3>
          <Price
            pricePaise={product.basePricePaise}
            compareAtPaise={product.compareAtPricePaise}
            size="sm"
          />
        </div>
      </Link>
      
      {/* Wishlist Button - Absolute top right. We render this outside the Link so it captures clicks properly without navigation */}
      <div className="absolute top-2 right-2 z-20">
        <WishlistButton productId={product.id} />
      </div>
    </div>
  )
}
