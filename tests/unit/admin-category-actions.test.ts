import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({ default: {} }))

vi.mock('@/lib/security/auth', () => ({
  requireAdmin: vi.fn().mockResolvedValue({ userId: 'admin-1', email: 'admin@example.com' }),
}))

const { mockRpc, mockRevalidatePath } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
  mockRevalidatePath: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    rpc: mockRpc,
  }),
}))

vi.mock('next/cache', () => ({
  revalidatePath: mockRevalidatePath,
}))

import { saveCategoryTransactionAction } from '@/features/admin/categories/actions'
import { requireAdmin } from '@/lib/security/auth'

describe('Admin Category Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRpc.mockResolvedValue({ data: null, error: null })
  })

  it('requires admin authorization', async () => {
    await saveCategoryTransactionAction({
      payloadVersion: 1,
      payload: { name: 'Test', slug: 'test', description: '', sort_order: 0, is_active: true },
      idempotencyKey: 'idemp-1',
    })
    expect(requireAdmin).toHaveBeenCalled()
  })

  it('validates payload using zod schema', async () => {
    const result = await saveCategoryTransactionAction({
      payloadVersion: 1,
      // @ts-ignore deliberately breaking type for validation test
      payload: { name: '', slug: 'invalid slug!', sort_order: 'abc' },
      idempotencyKey: 'idemp-1',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Please check the form for errors.')
    expect(result.fieldErrors).toBeDefined()
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('passes expectedUpdatedAt to RPC for concurrency check', async () => {
    await saveCategoryTransactionAction({
      categoryId: 'cat-1',
      expectedUpdatedAt: '2023-01-01T00:00:00Z',
      payloadVersion: 1,
      payload: { name: 'Test', slug: 'test', description: '', sort_order: 0, is_active: true },
      idempotencyKey: 'idemp-1',
    })

    expect(mockRpc).toHaveBeenCalledWith(
      'save_category_transaction',
      expect.objectContaining({
        p_category_id: 'cat-1',
        p_expected_updated_at: '2023-01-01T00:00:00Z',
      }),
    )
  })

  it('handles DUPLICATE_CATEGORY_SLUG constraint error', async () => {
    mockRpc.mockResolvedValueOnce({
      error: {
        code: '23505',
        message: 'duplicate key value violates unique constraint "categories_slug_key"',
      },
    })

    const result = await saveCategoryTransactionAction({
      payloadVersion: 1,
      payload: { name: 'Test', slug: 'test', description: '', sort_order: 0, is_active: true },
      idempotencyKey: 'idemp-1',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('slug is already in use')
  })

  it('handles CATEGORY_IN_USE business error', async () => {
    mockRpc.mockResolvedValueOnce({
      error: { message: 'CATEGORY_IN_USE' },
    })

    const result = await saveCategoryTransactionAction({
      payloadVersion: 1,
      payload: { name: 'Test', slug: 'test', description: '', sort_order: 0, is_active: false },
      idempotencyKey: 'idemp-1',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('cannot be deactivated or deleted')
  })

  it('handles CONCURRENCY_CONFLICT stale edit error', async () => {
    mockRpc.mockResolvedValueOnce({
      error: { message: 'CONCURRENCY_CONFLICT' },
    })

    const result = await saveCategoryTransactionAction({
      categoryId: 'cat-1',
      expectedUpdatedAt: 'old-date',
      payloadVersion: 1,
      payload: { name: 'Test', slug: 'test', description: '', sort_order: 0, is_active: true },
      idempotencyKey: 'idemp-1',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Another administrator has modified this record')
  })

  it('invalidates cache only after successful mutation', async () => {
    // 1. Failed mutation
    mockRpc.mockResolvedValueOnce({ error: { message: 'err' } })
    await saveCategoryTransactionAction({
      payloadVersion: 1,
      payload: { name: 'Test', slug: 'test', description: '', sort_order: 0, is_active: true },
      idempotencyKey: 'idemp-failed',
    })
    expect(mockRevalidatePath).not.toHaveBeenCalled()

    // 2. Successful mutation
    mockRpc.mockResolvedValueOnce({ error: null })
    await saveCategoryTransactionAction({
      categoryId: 'cat-1',
      payloadVersion: 1,
      payload: { name: 'Test', slug: 'test', description: '', sort_order: 0, is_active: true },
      idempotencyKey: 'idemp-success',
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/categories')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/category/test')
  })

  it('maps unknown errors safely', async () => {
    mockRpc.mockResolvedValueOnce({
      error: { message: 'Some weird database internal failure' },
    })

    const result = await saveCategoryTransactionAction({
      payloadVersion: 1,
      payload: { name: 'Test', slug: 'test', description: '', sort_order: 0, is_active: true },
      idempotencyKey: 'idemp-1',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('An unexpected error occurred. Please try again.')
  })
})
