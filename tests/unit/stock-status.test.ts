import { describe, it, expect } from 'vitest'
import { stockStatus } from '@/components/product/StockBadge'

describe('stockStatus', () => {
  it('returns out-of-stock when totalStock is 0', () => {
    expect(stockStatus(0)).toBe('out-of-stock')
  })

  it('returns low-stock when totalStock <= threshold (5)', () => {
    expect(stockStatus(1)).toBe('low-stock')
    expect(stockStatus(5)).toBe('low-stock')
  })

  it('returns in-stock when totalStock > threshold', () => {
    expect(stockStatus(6)).toBe('in-stock')
    expect(stockStatus(100)).toBe('in-stock')
  })
})
