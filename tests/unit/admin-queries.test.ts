import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({ default: {} }))

// Mock dependencies before importing the modules that use them
vi.mock('@/lib/security/auth', () => ({
  requireAdmin: vi.fn().mockResolvedValue({ userId: 'admin-1', email: 'admin@example.com' }),
}))

const {
  mockQueryBuilder,
  mockSelect,
  mockEq,
  mockGt,
  mockLt,
  mockGte,
  mockIlike,
  mockOr,
  mockIn,
  mockOrder,
  mockRange,
  mockSingle,
  mockLimit,
} = vi.hoisted(() => {
  const mockSelect = vi.fn()
  const mockEq = vi.fn()
  const mockGt = vi.fn()
  const mockLt = vi.fn()
  const mockGte = vi.fn()
  const mockIlike = vi.fn()
  const mockOr = vi.fn()
  const mockIn = vi.fn()
  const mockOrder = vi.fn()
  const mockRange = vi.fn()
  const mockSingle = vi.fn()
  const mockLimit = vi.fn()

  const mockQueryBuilder = {
    select: mockSelect,
    eq: mockEq,
    gt: mockGt,
    lt: mockLt,
    gte: mockGte,
    ilike: mockIlike,
    or: mockOr,
    in: mockIn,
    order: mockOrder,
    range: mockRange,
    single: mockSingle,
    limit: mockLimit,
  }

  return {
    mockQueryBuilder,
    mockSelect,
    mockEq,
    mockGt,
    mockLt,
    mockGte,
    mockIlike,
    mockOr,
    mockIn,
    mockOrder,
    mockRange,
    mockSingle,
    mockLimit,
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnValue(mockQueryBuilder),
  }),
}))

// Mock site config
vi.mock('@/config/site', () => ({
  site: {
    lowStockThreshold: 5,
    pagination: { adminPageSize: 20 },
  },
}))

import { getDashboardMetrics } from '@/features/admin/dashboard/queries'
import { getAdminProducts } from '@/features/admin/products/queries'
import { requireAdmin } from '@/lib/security/auth'

describe('Admin Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup standard mock returns for the builder chain
    mockSelect.mockReturnValue(mockQueryBuilder)
    mockEq.mockReturnValue(mockQueryBuilder)
    mockGt.mockReturnValue(mockQueryBuilder)
    mockLt.mockReturnValue(mockQueryBuilder)
    mockGte.mockReturnValue(mockQueryBuilder)
    mockIlike.mockReturnValue(mockQueryBuilder)
    mockOr.mockReturnValue(mockQueryBuilder)
    mockIn.mockReturnValue(mockQueryBuilder)
    mockOrder.mockReturnValue(mockQueryBuilder)
    mockLimit.mockReturnValue(mockQueryBuilder)

    // For final execution
    mockRange.mockResolvedValue({ data: [], count: 0, error: null })
    mockSingle.mockResolvedValue({ data: null, error: null })
  })

  describe('Dashboard Metrics', () => {
    it('requires admin authorization', async () => {
      // Mock Promise.all to return the expected 6 array elements
      // so the query doesn't crash during destructuring
      const origAll = Promise.all
      Promise.all = vi
        .fn()
        .mockResolvedValue([
          { count: 10 },
          { count: 5 },
          { count: 20 },
          { count: 2 },
          { count: 1 },
          { data: [] },
        ])

      await getDashboardMetrics()
      expect(requireAdmin).toHaveBeenCalled()

      Promise.all = origAll
    })

    it('uses shared site.lowStockThreshold for stock calculations', async () => {
      // Mock Promise.all
      const origAll = Promise.all
      let capturedQueries: any[] = []
      Promise.all = vi.fn().mockImplementation((queries) => {
        capturedQueries = queries
        return Promise.resolve([
          { count: 10 },
          { count: 5 },
          { count: 20 },
          { count: 2 },
          { count: 1 },
          { data: [] },
        ])
      })

      await getDashboardMetrics()

      // We expect the low stock query to have been built with .lt('stock_quantity', 5)
      expect(mockLt).toHaveBeenCalledWith('stock_quantity', 5)

      Promise.all = origAll
    })
  })

  describe('Products List', () => {
    it('requires admin authorization', async () => {
      await getAdminProducts({})
      expect(requireAdmin).toHaveBeenCalled()
    })

    it('safely handles query failure without crashing (throws to error boundary)', async () => {
      mockRange.mockResolvedValueOnce({ data: null, count: null, error: new Error('DB Error') })

      await expect(getAdminProducts({})).rejects.toThrow('DB Error')
    })

    it('returns empty results gracefully', async () => {
      mockRange.mockResolvedValueOnce({ data: [], count: 0, error: null })

      const result = await getAdminProducts({})
      expect(result.products).toEqual([])
      expect(result.count).toBe(0)
      expect(result.totalPages).toBe(0)
    })

    it('calculates pagination boundaries correctly', async () => {
      mockRange.mockResolvedValueOnce({ data: [{ id: '1' }], count: 45, error: null })

      const result = await getAdminProducts({ page: 2 })
      expect(mockRange).toHaveBeenCalledWith(20, 39) // page 2, size 20: index 20 to 39
      expect(result.totalPages).toBe(3) // ceil(45/20)
    })

    it('filters by status correctly', async () => {
      await getAdminProducts({ status: 'active' })
      expect(mockEq).toHaveBeenCalledWith('is_active', true)

      await getAdminProducts({ status: 'inactive' })
      expect(mockEq).toHaveBeenCalledWith('is_active', false)
    })

    it('filters by category correctly', async () => {
      await getAdminProducts({ categoryId: 'cat-1' })
      expect(mockEq).toHaveBeenCalledWith('category_id', 'cat-1')
    })

    it('handles product search by name, slug, and SKU cross-table', async () => {
      // Mock the subqueries for search
      // pData (name/slug)
      mockOr.mockResolvedValueOnce({ data: [{ id: 'prod-1' }] })
      // vData (sku)
      mockIlike.mockResolvedValueOnce({ data: [{ product_id: 'prod-2' }] })

      await getAdminProducts({ search: 'test' })

      // Should query products table OR
      expect(mockOr).toHaveBeenCalledWith('name.ilike.%test%,slug.ilike.%test%')
      // Should query variants table ILIKE
      expect(mockIlike).toHaveBeenCalledWith('sku', '%test%')

      // Should combine results into the main query using .in()
      expect(mockIn).toHaveBeenCalledWith('id', ['prod-1', 'prod-2'])
    })

    it('handles low-stock filtering', async () => {
      // Mock the variant subquery for stock
      mockLt.mockResolvedValueOnce({ data: [{ product_id: 'prod-low' }] })

      await getAdminProducts({ stockStatus: 'low_stock' })

      expect(mockGt).toHaveBeenCalledWith('stock_quantity', 0)
      expect(mockLt).toHaveBeenCalledWith('stock_quantity', 5)
      expect(mockIn).toHaveBeenCalledWith('id', ['prod-low'])
    })

    it('handles out-of-stock filtering', async () => {
      // Mock the variant subquery for stock
      mockEq.mockResolvedValueOnce({ data: [{ product_id: 'prod-out' }] })

      await getAdminProducts({ stockStatus: 'out_of_stock' })

      expect(mockEq).toHaveBeenCalledWith('stock_quantity', 0)
      expect(mockIn).toHaveBeenCalledWith('id', ['prod-out'])
    })

    it('returns empty immediately if cross-table search yields no matching IDs', async () => {
      mockOr.mockResolvedValueOnce({ data: [] })
      mockIlike.mockResolvedValueOnce({ data: [] })

      const result = await getAdminProducts({ search: 'nomatch' })
      expect(result.products).toEqual([])
      expect(mockIn).not.toHaveBeenCalled() // skipped main query entirely
    })
  })
})
