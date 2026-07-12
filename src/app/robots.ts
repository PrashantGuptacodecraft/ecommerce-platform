import type { MetadataRoute } from 'next'

import { getSiteUrl } from '@/lib/utilities/structured-data'

/**
 * Next.js app-router robots.txt generation.
 *
 * NOTE: robots.txt directives are a *crawl hint*, not a security control.
 * Sensitive routes (/admin/*, /api/*) are protected by authentication and
 * authorization middleware — not by this file.
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl()

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/*', '/api/*'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
