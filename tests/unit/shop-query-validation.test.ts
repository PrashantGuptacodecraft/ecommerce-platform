import { describe, it, expect } from 'vitest'
import { shopQuerySchema, searchQuerySchema, productSortSchema } from '@/features/products/types'

describe('shopQuerySchema validation', () => {
  it('parses valid filter values', () => {
    const result = shopQuerySchema.parse({
      category: 'shirts',
      size: 'M',
      colour: 'Black',
      minPrice: '89900',
      maxPrice: '299900',
      sort: 'price-asc',
      page: '2',
    })

    expect(result.category).toBe('shirts')
    expect(result.size).toBe('M')
    expect(result.colour).toBe('Black')
    expect(result.minPrice).toBe(89900)
    expect(result.maxPrice).toBe(299900)
    expect(result.sort).toBe('price-asc')
    expect(result.page).toBe(2)
  })

  it('catches invalid sort values to default', () => {
    const result = shopQuerySchema.parse({ sort: 'invalid-sort' })
    expect(result.sort).toBe('featured')
  })

  it('whitelists only valid sort values', () => {
    expect(productSortSchema.parse('featured')).toBe('featured')
    expect(productSortSchema.parse('new')).toBe('new')
    expect(productSortSchema.parse('price-asc')).toBe('price-asc')
    expect(productSortSchema.parse('price-desc')).toBe('price-desc')
    expect(productSortSchema.parse('DROP TABLE')).toBe('featured') // catches invalid
  })

  it('enforces safe page numbers', () => {
    expect(shopQuerySchema.parse({ page: '0' }).page).toBe(1) // catches to 1
    expect(shopQuerySchema.parse({ page: '-5' }).page).toBe(1)
    expect(shopQuerySchema.parse({ page: 'abc' }).page).toBe(1)
    expect(shopQuerySchema.parse({ page: '10001' }).page).toBe(1) // above max
    expect(shopQuerySchema.parse({ page: '9999' }).page).toBe(9999)
  })

  it('enforces max page size constraint', () => {
    // Page > 10000 should catch to 1
    expect(shopQuerySchema.parse({ page: '50000' }).page).toBe(1)
  })

  it('rejects negative price values', () => {
    const result = shopQuerySchema.safeParse({ minPrice: '-100' })
    expect(result.success).toBe(false)
  })

  it('normalizes empty values', () => {
    const result = shopQuerySchema.parse({})
    expect(result.category).toBeUndefined()
    expect(result.size).toBeUndefined()
    expect(result.colour).toBeUndefined()
    expect(result.minPrice).toBeUndefined()
    expect(result.maxPrice).toBeUndefined()
    expect(result.page).toBe(1)
  })

  it('rejects malformed price values', () => {
    const result = shopQuerySchema.safeParse({ minPrice: 'not-a-number' })
    expect(result.success).toBe(false)
  })

  it('handles extreme price values', () => {
    const result = shopQuerySchema.safeParse({ maxPrice: '999999999' })
    // 999999999 > 100_000_000 max, should fail
    expect(result.success).toBe(false)
  })

  it('trims string values', () => {
    const result = shopQuerySchema.parse({ category: '  shirts  ' })
    expect(result.category).toBe('shirts')
  })
})

describe('searchQuerySchema validation', () => {
  it('parses valid search params', () => {
    const result = searchQuerySchema.parse({ q: 'linen shirt', page: '1' })
    expect(result.q).toBe('linen shirt')
    expect(result.page).toBe(1)
  })

  it('handles missing search term', () => {
    const result = searchQuerySchema.parse({})
    expect(result.q).toBeUndefined()
    expect(result.page).toBe(1)
  })

  it('enforces max query length', () => {
    const longQuery = 'a'.repeat(101)
    const result = searchQuerySchema.safeParse({ q: longQuery })
    expect(result.success).toBe(false)
  })

  it('trims search term', () => {
    const result = searchQuerySchema.parse({ q: '  linen  ' })
    expect(result.q).toBe('linen')
  })

  it('catches invalid page to 1', () => {
    expect(searchQuerySchema.parse({ page: '0' }).page).toBe(1)
    expect(searchQuerySchema.parse({ page: 'garbage' }).page).toBe(1)
  })
})
