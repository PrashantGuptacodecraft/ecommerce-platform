import { Suspense } from 'react'
import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import { Skeleton } from '@/components/ui/Skeleton'
import { RevealOnScroll } from '@/components/motion/RevealOnScroll'
import { listProducts, getCatalogueFacets } from '@/features/products/queries'
import { shopQuerySchema } from '@/features/products/types'
import { ProductGrid } from '@/components/product/ProductGrid'
import { Pagination } from '@/components/product/Pagination'
import { ShopFilters } from '@/components/product/ShopFilters'
import { SortSelect } from '@/components/product/SortSelect'
import { getSiteUrl } from '@/lib/utilities/structured-data'
import { brand } from '@/config/brand'

export const metadata: Metadata = {
  title: `Shop All — ${brand.name}`,
  description: `Browse our complete collection of considered essentials. ${brand.tagline}`,
  alternates: { canonical: `${getSiteUrl()}/shop` },
}

/**
 * Caching strategy: the shop page uses `force-dynamic` because it reads URL
 * search params (filters, sort, page). Each unique param combination produces
 * a different result, so static caching would be incorrect. Supabase RLS
 * ensures only active/public data is returned.
 */
export const dynamic = 'force-dynamic'

type ShopPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const rawParams = await searchParams

  // Flatten array params to first value, then validate with Zod.
  const flat: Record<string, string> = {}
  for (const [key, val] of Object.entries(rawParams)) {
    if (typeof val === 'string') flat[key] = val
    else if (Array.isArray(val) && val[0] != null) flat[key] = val[0]
  }

  const query = shopQuerySchema.parse(flat)

  // Validate minPrice <= maxPrice; ignore reversed ranges.
  const sanitisedQuery = { ...query }
  if (
    typeof sanitisedQuery.minPrice === 'number' &&
    typeof sanitisedQuery.maxPrice === 'number' &&
    sanitisedQuery.minPrice > sanitisedQuery.maxPrice
  ) {
    delete sanitisedQuery.minPrice
    delete sanitisedQuery.maxPrice
  }

  const [result, facets] = await Promise.all([
    listProducts(sanitisedQuery),
    getCatalogueFacets(),
  ])

  // Build searchParams string for Pagination (preserves filters during navigation)
  const activeParams: Record<string, string> = {}
  if (sanitisedQuery.category) activeParams.category = sanitisedQuery.category
  if (sanitisedQuery.size) activeParams.size = sanitisedQuery.size
  if (sanitisedQuery.colour) activeParams.colour = sanitisedQuery.colour
  if (sanitisedQuery.minPrice !== undefined) activeParams.minPrice = String(sanitisedQuery.minPrice)
  if (sanitisedQuery.maxPrice !== undefined) activeParams.maxPrice = String(sanitisedQuery.maxPrice)
  if (sanitisedQuery.sort && sanitisedQuery.sort !== 'featured') activeParams.sort = sanitisedQuery.sort

  return (
    <div className="py-10">
      <Container>
        {/* Header */}
        <RevealOnScroll>
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-serif text-3xl text-ink sm:text-4xl">Shop All</h1>
              <p className="mt-1 text-sm text-mist">
                {result.total} {result.total === 1 ? 'product' : 'products'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Suspense>
                <SortSelect currentSort={sanitisedQuery.sort ?? 'featured'} />
              </Suspense>
            </div>
          </div>
        </RevealOnScroll>

        {/* Filters + Grid */}
        <div className="flex gap-8">
          {/* Filter sidebar — hidden on mobile, toggled via drawer inside ShopFilters */}
          <Suspense>
            <ShopFilters facets={facets} currentFilters={sanitisedQuery} />
          </Suspense>

          {/* Product grid */}
          <div className="min-w-0 flex-1">
            <ProductGrid
              products={result.items}
              emptyMessage="No products found"
              emptyDescription="Try adjusting your filters or search to find what you're looking for."
            />

            {result.totalPages > 1 && (
              <div className="mt-10">
                <Pagination
                  page={result.page}
                  totalPages={result.totalPages}
                  searchParams={activeParams}
                />
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  )
}
