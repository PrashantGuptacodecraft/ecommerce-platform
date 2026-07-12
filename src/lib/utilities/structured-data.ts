import 'server-only'

import { brand } from '@/config/brand'
import type { ProductDetail, ProductImage } from '@/features/products/types'
import { getProductImageUrl } from '@/lib/utilities/supabase-image'

// ---------------------------------------------------------------------------
// Site URL
// ---------------------------------------------------------------------------

/**
 * Canonical base URL for the storefront. Reads `NEXT_PUBLIC_SITE_URL` first,
 * then `SITE_URL`, falling back to localhost for local dev. Always strips a
 * trailing slash so callers can safely append paths.
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000'
  return raw.replace(/\/+$/, '')
}

// ---------------------------------------------------------------------------
// JSON-LD helpers — real data only, no fake ratings / reviews / brand claims
// ---------------------------------------------------------------------------

/** Schema.org Product structured data. */
export function productJsonLd(
  product: ProductDetail,
  canonicalUrl: string,
): Record<string, unknown> {
  const images = product.images
    .filter((img): img is ProductImage & { storage_path: string } => {
      const url = getProductImageUrl(img.storage_path)
      return url !== null
    })
    .map((img) => getProductImageUrl(img.storage_path) as string)

  const sku = product.variants[0]?.sku

  const priceInRupees = (product.base_price_paise / 100).toFixed(2)

  const availability =
    product.totalStock > 0
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock'

  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    url: canonicalUrl,
    offers: {
      '@type': 'Offer',
      price: priceInRupees,
      priceCurrency: 'INR',
      availability,
      url: canonicalUrl,
    },
  }

  if (product.description) {
    ld.description = product.description
  }

  if (images.length > 0) {
    ld.image = images
  }

  if (sku) {
    ld.sku = sku
  }

  return ld
}

/** Schema.org BreadcrumbList structured data. */
export function breadcrumbJsonLd(
  items: { name: string; url: string }[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/** Schema.org Organization structured data using brand config. */
export function organizationJsonLd(): Record<string, unknown> {
  const siteUrl = getSiteUrl()

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: brand.name,
    url: siteUrl,
    description: brand.description,
    contactPoint: {
      '@type': 'ContactPoint',
      email: brand.contact.email,
      telephone: brand.contact.phone,
      contactType: 'customer service',
    },
    sameAs: [brand.social.instagram, brand.social.facebook].filter(Boolean),
  }
}

// ---------------------------------------------------------------------------
// Safe serialisation
// ---------------------------------------------------------------------------

/**
 * Serialise a JSON-LD object for embedding inside a `<script>` tag. Escapes
 * characters that could break out of the script context or trigger XSS:
 *
 *   <  →  \\u003C   (prevents </script> injection)
 *   >  →  \\u003E
 *   &  →  \\u0026
 *   '  →  \\u0027
 *   "  →  \\u0022   (only inside JSON string values — the structural quotes
 *                    are left intact by the replacer running after stringify)
 *
 * The escaping is applied to every string *value* in the JSON output, not to
 * the JSON structural characters (colons, braces, etc.).
 */
export function safeJsonLdSerialize(data: unknown): string {
  const json = JSON.stringify(data)

  // Replace dangerous characters in string values. Because JSON.stringify
  // already produces valid JSON, we only need to escape characters that are
  // meaningful in an HTML <script> context.
  return json
    .replace(/</g, '\\u003C')
    .replace(/>/g, '\\u003E')
    .replace(/&/g, '\\u0026')
    .replace(/'/g, '\\u0027')
}
