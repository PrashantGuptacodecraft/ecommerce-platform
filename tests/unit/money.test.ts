import { describe, expect, it } from 'vitest'
import { discountPercent, formatPaise } from '@/lib/utilities/money'

describe('formatPaise', () => {
  it('formats whole rupees with no decimals and a ₹ symbol', () => {
    expect(formatPaise(189900)).toBe('₹1,899')
  })

  it('formats fractional paise with two decimals', () => {
    expect(formatPaise(189950)).toBe('₹1,899.50')
  })

  it('uses Indian lakh grouping', () => {
    expect(formatPaise(1000000)).toBe('₹10,000')
    expect(formatPaise(10000000)).toBe('₹1,00,000')
  })

  it('can omit the symbol', () => {
    expect(formatPaise(189900, { withSymbol: false })).toBe('1,899')
  })

  it('formats zero', () => {
    expect(formatPaise(0)).toBe('₹0')
  })
})

describe('discountPercent', () => {
  it('returns rounded percentage off when compare-at is higher', () => {
    expect(discountPercent(189900, 229900)).toBe(17)
  })

  it('returns null when there is no valid discount', () => {
    expect(discountPercent(189900, null)).toBeNull()
    expect(discountPercent(189900, 189900)).toBeNull()
    expect(discountPercent(189900, 100000)).toBeNull()
  })
})
