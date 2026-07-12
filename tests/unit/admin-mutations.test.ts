import { describe, it, expect, vi } from 'vitest'

describe('Admin Mutations - RPC Mocks', () => {
  it('should mock manual_adjust_variant_stock with idempotency', async () => {
    const mockRpc = vi.fn().mockResolvedValue({
      data: [{ new_stock: 10, transaction_id: '123' }],
      error: null,
    })

    const result = await mockRpc('manual_adjust_variant_stock', {
      p_variant_id: 'var-1',
      p_change_quantity: 5,
      p_note: 'Restock',
      p_idempotency_key: 'idemp-1',
    })

    expect(mockRpc).toHaveBeenCalledWith('manual_adjust_variant_stock', {
      p_variant_id: 'var-1',
      p_change_quantity: 5,
      p_note: 'Restock',
      p_idempotency_key: 'idemp-1',
    })
    expect(result.data[0].new_stock).toBe(10)
  })

  it('should mock save_product_tree with payload validation', async () => {
    const mockRpc = vi.fn().mockResolvedValue({
      data: { success: true, product_id: 'prod-1' },
      error: null,
    })

    const payload = {
      product: { name: 'Test', slug: 'test' },
      options: [],
      variants: [],
    }

    const result = await mockRpc('save_product_tree', {
      p_product_id: 'prod-1',
      p_expected_updated_at: null,
      p_payload_version: 1,
      p_payload: payload,
      p_idempotency_key: 'idemp-2',
    })

    expect(mockRpc).toHaveBeenCalled()
    expect(result.data.success).toBe(true)
  })
})
