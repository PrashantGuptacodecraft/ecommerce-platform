import type { MetadataRoute } from 'next'

import { getActiveCategories, getProductSlugs } from '@/features/products/queries'
import { getSiteUrl } from '@/lib/utilities/structured-data'

/**
 * Dynamic sitemap generated from live catalogue data. Intentionally excludes
 * /search (dynamic, not crawlable), /admin/* (private), and /api/* (not pages).
 *
 * If Supabase is unreachable the function gracefully degrades to the two
 * hard-coded static routes so the build doesn't fail.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl()

  // Static pages that always exist.
  const staticEntries: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/shop`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  ]

  try {
    const [categories, productSlugs] = await Promise.all([
      getActiveCategories(),
      getProductSlugs(),
    ])

    const categoryEntries: MetadataRoute.Sitemap = categories.map((cat) => ({
      url: `${baseUrl}/category/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    const productEntries: MetadataRoute.Sitemap = productSlugs.map((slug) => ({
      url: `${baseUrl}/product/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    return [...staticEntries, ...categoryEntries, ...productEntries]
  } catch {
    // Supabase unreachable — return the minimum viable sitemap so the build
    // doesn't fail outright.
    return staticEntries
  }
}
