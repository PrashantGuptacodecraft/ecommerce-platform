import { describe, it, expect, vi, beforeEach } from 'vitest'

// The module uses `import 'server-only'` which fails in vitest.
// We mock it out.
vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/supabase/config', () => ({
  getPublicSupabaseConfig: () => ({ url: 'https://test.supabase.co', anonKey: 'test' }),
}))

describe('structured-data utilities', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
  })

  describe('getSiteUrl', () => {
    it('returns NEXT_PUBLIC_SITE_URL when set', async () => {
      vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://mystore.com')
      const { getSiteUrl } = await import('@/lib/utilities/structured-data')
      expect(getSiteUrl()).toBe('https://mystore.com')
    })

    it('falls back to SITE_URL', async () => {
      vi.stubEnv('SITE_URL', 'https://fallback.com/')
      const { getSiteUrl } = await import('@/lib/utilities/structured-data')
      expect(getSiteUrl()).toBe('https://fallback.com')
    })

    it('strips trailing slashes', async () => {
      vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://mystore.com///')
      const { getSiteUrl } = await import('@/lib/utilities/structured-data')
      expect(getSiteUrl()).toBe('https://mystore.com')
    })

    it('defaults to localhost when no env var is set', async () => {
      const { getSiteUrl } = await import('@/lib/utilities/structured-data')
      expect(getSiteUrl()).toBe('http://localhost:3000')
    })
  })

  describe('safeJsonLdSerialize', () => {
    let safeJsonLdSerialize: typeof import('@/lib/utilities/structured-data').safeJsonLdSerialize

    beforeEach(async () => {
      const mod = await import('@/lib/utilities/structured-data')
      safeJsonLdSerialize = mod.safeJsonLdSerialize
    })

    it('escapes < to prevent script injection', () => {
      const result = safeJsonLdSerialize({ name: '</script><script>alert(1)</script>' })
      expect(result).not.toContain('</script>')
      expect(result).toContain('\\u003C')
    })

    it('escapes > characters', () => {
      const result = safeJsonLdSerialize({ name: 'a > b' })
      expect(result).toContain('\\u003E')
    })

    it('escapes & characters', () => {
      const result = safeJsonLdSerialize({ name: 'A & B' })
      expect(result).toContain('\\u0026')
    })

    it('produces valid JSON structure', () => {
      const data = { '@type': 'Product', name: 'Test', price: 100 }
      const result = safeJsonLdSerialize(data)
      // The escaped string should still contain the structure
      expect(result).toContain('@type')
      expect(result).toContain('Product')
    })
  })

  describe('productJsonLd', () => {
    let productJsonLd: typeof import('@/lib/utilities/structured-data').productJsonLd

    beforeEach(async () => {
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
      const mod = await import('@/lib/utilities/structured-data')
      productJsonLd = mod.productJsonLd
    })

    it('produces a valid Product JSON-LD with real data', () => {
      const product = {
        id: '1',
        slug: 'test-product',
        name: 'Test Product',
        description: 'A test product',
        short_description: 'A test',
        base_price_paise: 199900,
        compare_at_price_paise: null,
        fabric: null,
        care_instructions: null,
        fit_info: null,
        is_new_arrival: false,
        is_featured: true,
        seo_title: null,
        seo_description: null,
        category: { id: 'c1', name: 'Shirts', slug: 'shirts' },
        sizeChart: null,
        images: [],
        options: [],
        variants: [
          {
            id: 'v1',
            sku: 'TEST-S',
            stockQuantity: 10,
            priceAdjustmentPaise: 0,
            isActive: true,
            imageId: null,
            optionValueIds: [],
          },
        ],
        totalStock: 10,
      }

      const result = productJsonLd(product, 'https://mystore.com/product/test-product')

      expect(result['@context']).toBe('https://schema.org')
      expect(result['@type']).toBe('Product')
      expect(result.name).toBe('Test Product')
      expect(result.url).toBe('https://mystore.com/product/test-product')
      expect(result.sku).toBe('TEST-S')

      const offer = result.offers as Record<string, unknown>
      expect(offer.price).toBe('1999.00')
      expect(offer.priceCurrency).toBe('INR')
      expect(offer.availability).toBe('https://schema.org/InStock')

      // No fake data
      expect(result).not.toHaveProperty('aggregateRating')
      expect(result).not.toHaveProperty('review')
      expect(result).not.toHaveProperty('brand')
    })

    it('shows OutOfStock when totalStock is 0', () => {
      const product = {
        id: '2',
        slug: 'sold-out',
        name: 'Sold Out',
        description: null,
        short_description: null,
        base_price_paise: 100000,
        compare_at_price_paise: null,
        fabric: null,
        care_instructions: null,
        fit_info: null,
        is_new_arrival: false,
        is_featured: false,
        seo_title: null,
        seo_description: null,
        category: null,
        sizeChart: null,
        images: [],
        options: [],
        variants: [],
        totalStock: 0,
      }

      const result = productJsonLd(product, 'https://mystore.com/product/sold-out')
      const offer = result.offers as Record<string, unknown>
      expect(offer.availability).toBe('https://schema.org/OutOfStock')
    })

    it('omits image field when no images exist', () => {
      const product = {
        id: '3',
        slug: 'no-images',
        name: 'No Images',
        description: null,
        short_description: null,
        base_price_paise: 50000,
        compare_at_price_paise: null,
        fabric: null,
        care_instructions: null,
        fit_info: null,
        is_new_arrival: false,
        is_featured: false,
        seo_title: null,
        seo_description: null,
        category: null,
        sizeChart: null,
        images: [],
        options: [],
        variants: [],
        totalStock: 0,
      }

      const result = productJsonLd(product, 'https://mystore.com/product/no-images')
      expect(result).not.toHaveProperty('image')
    })
  })

  describe('breadcrumbJsonLd', () => {
    it('generates a valid BreadcrumbList', async () => {
      const { breadcrumbJsonLd } = await import('@/lib/utilities/structured-data')
      const result = breadcrumbJsonLd([
        { name: 'Home', url: 'https://mystore.com/' },
        { name: 'Shop', url: 'https://mystore.com/shop' },
      ])

      expect(result['@type']).toBe('BreadcrumbList')
      const items = result.itemListElement as Array<Record<string, unknown>>
      expect(items).toHaveLength(2)
      expect(items[0]!.position).toBe(1)
      expect(items[1]!.position).toBe(2)
    })
  })
})
