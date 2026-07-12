import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Container } from '@/components/ui/Container'
import { RevealOnScroll } from '@/components/motion/RevealOnScroll'
import { getCategoryBySlug, listProducts } from '@/features/products/queries'
import { shopQuerySchema } from '@/features/products/types'
import { ProductGrid } from '@/components/product/ProductGrid'
import { Pagination } from '@/components/product/Pagination'
import { Breadcrumbs } from '@/components/product/Breadcrumbs'
import { getSiteUrl } from '@/lib/utilities/structured-data'
import { brand } from '@/config/brand'

/**
 * Caching strategy: the category page uses `force-dynamic` because it reads
 * URL search params (page, sort). ISR could be used for the default view in
 * future with revalidation tags.
 */
export const dynamic = 'force-dynamic'

/** Allow category slugs not returned by generateStaticParams to render on demand. */
export const dynamicParams = true

type CategoryPageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) return {}

  return {
    title: `${category.name} — ${brand.name}`,
    description: category.description ?? `Shop ${category.name} at ${brand.name}. ${brand.tagline}`,
    alternates: { canonical: `${getSiteUrl()}/category/${category.slug}` },
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)

  if (!category) {
    notFound()
  }

  const rawParams = await searchParams
  const flat: Record<string, string> = {}
  for (const [key, val] of Object.entries(rawParams)) {
    if (typeof val === 'string') flat[key] = val
    else if (Array.isArray(val) && val[0] != null) flat[key] = val[0]
  }

  const query = shopQuerySchema.parse({ ...flat, category: slug })

  const result = await listProducts(query)

  const activeParams: Record<string, string> = { category: slug }
  if (query.sort && query.sort !== 'featured') activeParams.sort = query.sort

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Shop', href: '/shop' },
    { label: category.name, href: `/category/${category.slug}` },
  ]

  return (
    <div className="py-10">
      <Container>
        <Breadcrumbs items={breadcrumbs} />

        <RevealOnScroll>
          <div className="mt-6 mb-8">
            <h1 className="font-serif text-3xl text-ink sm:text-4xl">
              {category.name}
            </h1>
            {category.description && (
              <p className="mt-2 max-w-2xl text-sm text-slate">
                {category.description}
              </p>
            )}
            <p className="mt-1 text-sm text-mist">
              {result.total} {result.total === 1 ? 'product' : 'products'}
            </p>
          </div>
        </RevealOnScroll>

        <ProductGrid
          products={result.items}
          emptyMessage={`No ${category.name.toLowerCase()} found`}
          emptyDescription="Check back later for new arrivals in this category."
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
