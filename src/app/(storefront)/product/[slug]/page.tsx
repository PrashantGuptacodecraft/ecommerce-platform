import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { Container } from '@/components/ui/Container'
import { FadeIn } from '@/components/motion/FadeIn'
import { RevealOnScroll } from '@/components/motion/RevealOnScroll'
import { Price } from '@/components/ui/Price'
import { Badge } from '@/components/ui/Badge'
import { getProductBySlug, getProductSlugs } from '@/features/products/queries'
import { Breadcrumbs } from '@/components/product/Breadcrumbs'
import { ProductGallery } from '@/components/product/ProductGallery'
import { ProductDetailClient } from './ProductDetailClient'
import { getProductReviews } from '@/features/reviews/queries'
import { ProductReviewsSection } from '@/features/reviews/components/ProductReviewsSection'
import { RelatedProducts } from '@/components/product/RelatedProducts'
import {
  getSiteUrl,
  productJsonLd,
  breadcrumbJsonLd,
  safeJsonLdSerialize,
} from '@/lib/utilities/structured-data'
import { brand } from '@/config/brand'

/**
 * Caching strategy: product pages are rendered on demand with ISR-compatible
 * revalidation. `dynamicParams = true` ensures new products appear without
 * requiring a full redeployment. `generateStaticParams` pre-renders known
 * product slugs at build time for performance.
 *
 * In future milestones, admin product mutations will call
 * `revalidatePath('/product/[slug]')` to purge stale pages.
 */
export const dynamicParams = true
export const revalidate = 3600 // 1 hour ISR

type ProductPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  try {
    const slugs = await getProductSlugs()
    return slugs.map((slug) => ({ slug }))
  } catch {
    // If Supabase is unreachable during build, return empty — dynamicParams
    // ensures the pages are still renderable on demand.
    return []
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const siteUrl = getSiteUrl()
  const canonicalUrl = `${siteUrl}/product/${product.slug}`

  return {
    title: product.seo_title ?? `${product.name} — ${brand.name}`,
    description:
      product.seo_description ?? product.short_description ?? `${product.name}. ${brand.tagline}`,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: product.name,
      description: product.short_description ?? product.description ?? brand.tagline,
      url: canonicalUrl,
      type: 'website',
    },
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    notFound()
  }
  
  const reviews = await getProductReviews(product.id)

  const siteUrl = getSiteUrl()
  const canonicalUrl = `${siteUrl}/product/${product.slug}`

  // Breadcrumbs
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Shop', href: '/shop' },
  ]
  if (product.category) {
    breadcrumbItems.push({
      label: product.category.name,
      href: `/category/${product.category.slug}`,
    })
  }
  breadcrumbItems.push({
    label: product.name,
    href: `/product/${product.slug}`,
  })

  // JSON-LD structured data
  const productLd = productJsonLd(product, canonicalUrl)
  const breadcrumbLd = breadcrumbJsonLd(
    breadcrumbItems.map((item) => ({
      name: item.label,
      url: `${siteUrl}${item.href}`,
    })),
  )

  return (
    <>
      {/* JSON-LD: real data only, safely serialized */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdSerialize(productLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdSerialize(breadcrumbLd) }}
      />

      <div className="py-10">
        <Container>
          <FadeIn>
            <Breadcrumbs items={breadcrumbItems} />
          </FadeIn>

          <div className="mt-6 grid gap-8 md:grid-cols-2 md:gap-12 lg:gap-16">
            {/* Gallery — left/top */}
            <div className="group">
              <ProductGallery images={product.images} productName={product.name} />
            </div>

            {/* Product info — right/bottom */}
            <div className="flex flex-col gap-5">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {product.is_new_arrival && <Badge variant="accent">New Arrival</Badge>}
                {product.is_featured && <Badge variant="outline">Featured</Badge>}
              </div>

              {/* Name */}
              <h1 className="font-serif text-2xl text-ink sm:text-3xl lg:text-4xl">
                {product.name}
              </h1>

              {/* Price */}
              <Price
                pricePaise={product.base_price_paise}
                compareAtPaise={product.compare_at_price_paise}
                size="lg"
              />

              {/* Short description */}
              {product.short_description && (
                <p className="text-sm leading-relaxed text-slate">{product.short_description}</p>
              )}

              {/* Variant selector + Add to Cart — Client boundary */}
              <Suspense>
                <ProductDetailClient
                  options={product.options}
                  variants={product.variants}
                  basePricePaise={product.base_price_paise}
                  sizeChart={product.sizeChart}
                  productName={product.name}
                  totalStock={product.totalStock}
                />
              </Suspense>

              {/* Product details */}
              <RevealOnScroll>
                <div className="space-y-4 border-t border-fog pt-6">
                  {product.description && (
                    <div>
                      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink">
                        Description
                      </h2>
                      <p className="text-sm leading-relaxed text-slate whitespace-pre-line">
                        {product.description}
                      </p>
                    </div>
                  )}

                  {product.fabric && (
                    <div>
                      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-ink">
                        Fabric
                      </h2>
                      <p className="text-sm text-slate">{product.fabric}</p>
                    </div>
                  )}

                  {product.fit_info && (
                    <div>
                      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-ink">
                        Fit
                      </h2>
                      <p className="text-sm text-slate">{product.fit_info}</p>
                    </div>
                  )}

                  {product.care_instructions && (
                    <div>
                      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-ink">
                        Care
                      </h2>
                      <p className="text-sm text-slate whitespace-pre-line">
                        {product.care_instructions}
                      </p>
                    </div>
                  )}
                </div>
              </RevealOnScroll>
            </div>
          </div>

          <Suspense fallback={<div className="h-40 animate-pulse bg-fog/20 mt-16 rounded-xl" />}>
            <RelatedProducts currentProductId={product.id} categoryId={product.category?.id} />
          </Suspense>

          <Suspense fallback={<div className="h-40 animate-pulse bg-fog/20 mt-16 rounded-xl" />}>
            <ProductReviewsSection productId={product.id} reviews={reviews} />
          </Suspense>
        </Container>
      </div>

      {/* Bottom padding for sticky AddToCartBar on mobile */}
      <div className="h-20 md:h-0" />
    </>
  )
}
