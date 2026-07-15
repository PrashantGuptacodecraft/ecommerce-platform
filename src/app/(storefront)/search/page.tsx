import { Suspense } from 'react'
import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import { RevealOnScroll } from '@/components/motion/RevealOnScroll'
import { listProducts, getCatalogueFacets } from '@/features/products/queries'
import { shopQuerySchema } from '@/features/products/types'
import { ProductGrid } from '@/components/product/ProductGrid'
import { Pagination } from '@/components/product/Pagination'
import { ShopFilters } from '@/components/product/ShopFilters'
import { SortSelect } from '@/components/product/SortSelect'
import { SearchIcon } from '@/components/ui/icons'
import { brand } from '@/config/brand'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: `Search — ${brand.name}`,
  robots: { index: false, follow: true },
}

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const rawParams = await searchParams
  const flat: Record<string, string> = {}
  for (const [key, val] of Object.entries(rawParams)) {
    if (typeof val === 'string') flat[key] = val
    else if (Array.isArray(val) && val[0] != null) flat[key] = val[0]
  }

  const query = shopQuerySchema.parse(flat)
  const term = query.q ?? ''

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
    term.length > 0
      ? listProducts(sanitisedQuery)
      : Promise.resolve({ items: [], total: 0, page: 1, pageSize: 12, totalPages: 0 }),
    getCatalogueFacets()
  ])

  const activeParams: Record<string, string> = {}
  if (term) activeParams.q = term
  if (sanitisedQuery.category) activeParams.category = sanitisedQuery.category
  if (sanitisedQuery.size) activeParams.size = sanitisedQuery.size
  if (sanitisedQuery.colour) activeParams.colour = sanitisedQuery.colour
  if (sanitisedQuery.minPrice !== undefined) activeParams.minPrice = String(sanitisedQuery.minPrice)
  if (sanitisedQuery.maxPrice !== undefined) activeParams.maxPrice = String(sanitisedQuery.maxPrice)
  if (sanitisedQuery.sort && sanitisedQuery.sort !== 'featured')
    activeParams.sort = sanitisedQuery.sort

  return (
    <div className="py-10">
      <Container>
        <RevealOnScroll>
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex-1 w-full max-w-lg">
              <form action="/search" method="get">
                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-mist" />
                  <input
                    type="search"
                    name="q"
                    defaultValue={term}
                    placeholder="Search products…"
                    aria-label="Search products"
                    className="w-full rounded-lg border border-fog bg-white py-3 pr-4 pl-10 text-sm text-ink placeholder:text-mist focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  {/* Preserve filters as hidden inputs */}
                  {sanitisedQuery.category && <input type="hidden" name="category" value={sanitisedQuery.category} />}
                  {sanitisedQuery.sort && <input type="hidden" name="sort" value={sanitisedQuery.sort} />}
                </div>
              </form>
              {term && (
                <p className="mt-4 font-serif text-2xl text-ink sm:text-3xl">
                  Results for &ldquo;{term}&rdquo;
                  <span className="ml-3 text-sm font-sans text-mist whitespace-nowrap">
                    {result.total} {result.total === 1 ? 'product' : 'products'}
                  </span>
                </p>
              )}
            </div>
            
            {term && (
              <div className="flex items-center gap-3">
                <Suspense>
                  <SortSelect currentSort={sanitisedQuery.sort ?? 'featured'} />
                </Suspense>
              </div>
            )}
          </div>
        </RevealOnScroll>

        {term ? (
          <div className="flex gap-8">
            <Suspense>
              <ShopFilters facets={facets} currentFilters={sanitisedQuery} />
            </Suspense>

            <div className="min-w-0 flex-1">
              <ProductGrid
                products={result.items}
                emptyMessage={`No results for "${term}"`}
                emptyDescription="Try adjusting your search term or filters to find what you're looking for."
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
        ) : (
          <ProductGrid
            products={[]}
            emptyMessage="Enter a search term"
            emptyDescription="Type a product name or keyword to find what you're looking for."
          />
        )}
      </Container>
    </div>
  )
}
