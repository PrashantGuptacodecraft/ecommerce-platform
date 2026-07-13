import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  addCartItemAction,
  updateCartItemQuantityAction,
  removeCartItemAction,
  clearCartAction,
} from '@/features/cart/actions'
import { cartRepository } from '@/features/cart/cart-repository.server'
import * as sessionModule from '@/features/cart/cart-session.server'
import { createAdminClient } from '@/lib/supabase/admin'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('@/features/cart/cart-session.server', () => ({
  getCartSessionId: vi.fn(),
  getExistingCartSessionId: vi.fn(),
}))

vi.mock('@/features/cart/cart-repository.server', () => ({
  cartRepository: {
    getOrCreateCart: vi.fn(),
    getCartId: vi.fn(),
    upsertCartItemAtomic: vi.fn(),
    updateCartItemQuantity: vi.fn(),
    removeCartItem: vi.fn(),
    clearCart: vi.fn(),
  },
}))

describe('Cart Actions', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any)
  })

  it('addCartItemAction - rejects inactive product', async () => {
    const formData = new FormData()
    formData.append('variantId', '123e4567-e89b-12d3-a456-426614174000')
    formData.append('quantity', '1')

    vi.mocked(sessionModule.getCartSessionId).mockResolvedValue('session-123')

    vi.mocked(cartRepository.upsertCartItemAtomic).mockResolvedValue({
      success: false,
      error: 'PRODUCT_INACTIVE',
    })

    const result = await addCartItemAction({ success: false }, formData)

    expect(result.success).toBe(false)
    expect(result.error).toBe('PRODUCT_INACTIVE')
  })

  it('addCartItemAction - rejects out of stock', async () => {
    const formData = new FormData()
    formData.append('variantId', '123e4567-e89b-12d3-a456-426614174000')
    formData.append('quantity', '1')

    vi.mocked(sessionModule.getCartSessionId).mockResolvedValue('session-123')

    vi.mocked(cartRepository.upsertCartItemAtomic).mockResolvedValue({
      success: false,
      error: 'OUT_OF_STOCK',
    })

    const result = await addCartItemAction({ success: false }, formData)

    expect(result.success).toBe(false)
    expect(result.error).toBe('OUT_OF_STOCK')
  })

  it('addCartItemAction - safely adds item and isolates by session token', async () => {
    const formData = new FormData()
    formData.append('variantId', '123e4567-e89b-12d3-a456-426614174000')
    formData.append('quantity', '2')

    vi.mocked(sessionModule.getCartSessionId).mockResolvedValue('session-token-xyz')

    mockSupabase.single.mockResolvedValue({
      data: { is_active: true, stock_quantity: 10, products: { is_active: true } },
    })

    vi.mocked(cartRepository.getCartId).mockResolvedValue('cart-123')
    mockSupabase.maybeSingle.mockResolvedValue({ data: null }) // no existing item

    vi.mocked(cartRepository.upsertCartItemAtomic).mockResolvedValue({ success: true, quantity: 2 })

    const result = await addCartItemAction({ success: false }, formData)

    expect(result.success).toBe(true)
    expect(cartRepository.upsertCartItemAtomic).toHaveBeenCalledWith(
      'session-token-xyz',
      '123e4567-e89b-12d3-a456-426614174000',
      2,
      expect.any(String)
    )
  })

  it('updateCartItemQuantityAction - limits to available stock', async () => {
    const formData = new FormData()
    formData.append('variantId', '123e4567-e89b-12d3-a456-426614174000')
    formData.append('quantity', '10') // stock is only 5

    vi.mocked(sessionModule.getExistingCartSessionId).mockResolvedValue('session-123')
    vi.mocked(cartRepository.getCartId).mockResolvedValue('cart-123')

    mockSupabase.single.mockResolvedValue({
      data: { is_active: true, stock_quantity: 5, products: { is_active: true } },
    })

    const result = await updateCartItemQuantityAction({ success: false }, formData)

    expect(result.success).toBe(false)
    expect(result.error).toBe('INSUFFICIENT_STOCK')
  })
})
