import type { Metadata } from 'next'
import Link from 'next/link'
import { getWishlistProducts } from '@/features/wishlist/queries'
import { ProductCard } from '@/components/product/ProductCard'

export const metadata: Metadata = {
  title: 'Your Wishlist',
  description: 'View your saved products.',
}

export default async function WishlistPage() {
  const products = await getWishlistProducts()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-ink mb-8">Your Wishlist</h1>
      
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-fog bg-paper py-24 text-center">
          <p className="text-lg font-medium text-charcoal">Your wishlist is empty</p>
          <p className="mt-1 text-sm text-mist">Save items you love to view them here later.</p>
          <Link
            href="/"
            className="mt-6 rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-ink/90"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4 xl:gap-x-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={{
              ...product,
              basePricePaise: product.product_variants[0]?.price || 0,
              compareAtPricePaise: null,
              totalStock: 10, // Mocked for now since inventory logic is separate
              isNewArrival: false,
              primaryImage: product.product_images[0] || null
            }} />
          ))}
        </div>
      )}
    </div>
  )
}
