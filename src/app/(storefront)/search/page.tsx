import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import { RevealOnScroll } from '@/components/motion/RevealOnScroll'
import { searchProducts } from '@/features/products/queries'
import { searchQuerySchema } from '@/features/products/types'
import { ProductGrid } from '@/components/product/ProductGrid'
import { Pagination } from '@/components/product/Pagination'
import { SearchIcon } from '@/components/ui/icons'
import { brand } from '@/config/brand'

/**
 * Search results are noindex — search pages should not appear in Google.
 * Uses force-dynamic because results depend on URL search params.
 */
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

  const query = searchQuerySchema.parse(flat)
  const term = query.q ?? ''

  const result =
    term.length > 0
      ? await searchProducts(term, { page: query.page })
      : { items: [], total: 0, page: 1, pageSize: 12, totalPages: 0 }

  const activeParams: Record<string, string> = {}
  if (term) activeParams.q = term

  return (
    <div className="py-10">
      <Container>
        <RevealOnScroll>
          <div className="mb-8">
            {/* Search input */}
            <form action="/search" method="get" className="mb-6">
              <div className="relative max-w-lg">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-mist" />
                <input
                  type="search"
                  name="q"
                  defaultValue={term}
                  placeholder="Search products…"
                  aria-label="Search products"
                  className="w-full rounded-lg border border-fog bg-white py-3 pr-4 pl-10 text-sm text-ink placeholder:text-mist focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </form>

            {term ? (
              <>
                <h1 className="font-serif text-2xl text-ink sm:text-3xl">
                  Results for &ldquo;{term}&rdquo;
                </h1>
                <p className="mt-1 text-sm text-mist">
                  {result.total} {result.total === 1 ? 'product' : 'products'} found
                </p>
              </>
            ) : (
              <h1 className="font-serif text-2xl text-ink sm:text-3xl">Search</h1>
            )}
          </div>
        </RevealOnScroll>

        <ProductGrid
          products={result.items}
          emptyMessage={term ? `No results for "${term}"` : 'Enter a search term'}
          emptyDescription={
            term
              ? 'Try a different search term or browse our categories.'
              : 'Type a product name or keyword to find what you\u2019re looking for.'
          }
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
      </Container>
    </div>
  )
}
