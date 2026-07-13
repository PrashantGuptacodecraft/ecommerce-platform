'use server'

import { revalidatePath } from 'next/cache'
import { getCartSessionId, getExistingCartSessionId } from './cart-session.server'
import { cartRepository } from './cart-repository.server'
import { addCartItemSchema, updateCartItemSchema, removeCartItemSchema } from './validation'
import { createAdminClient } from '@/lib/supabase/admin'

export type CartActionResult = {
  success: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

export async function addCartItemAction(
  prevState: CartActionResult,
  formData: FormData,
): Promise<CartActionResult> {
  try {
    const rawData = {
      variantId: formData.get('variantId'),
      quantity: Number(formData.get('quantity')),
      idempotencyKey: formData.get('idempotencyKey') || undefined,
    }

    const parsed = addCartItemSchema.safeParse(rawData)
    if (!parsed.success) {
      console.log('PARSED FAILED', parsed.error.flatten().fieldErrors, rawData)
      return { success: false, fieldErrors: parsed.error.flatten().fieldErrors }
    }

    const { variantId, quantity } = parsed.data
    const sessionToken = await getCartSessionId()
    const idempotencyKey = (rawData.idempotencyKey as string) || crypto.randomUUID()

    const result = await cartRepository.upsertCartItemAtomic(
      sessionToken,
      variantId,
      quantity,
      idempotencyKey,
    )

    if (!result.success) {
      return { success: false, error: result.error }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error: any) {
    console.error('Add cart item error:', error)
    return { success: false, error: 'UNKNOWN_ERROR' }
  }
}

export async function updateCartItemQuantityAction(
  prevState: CartActionResult,
  formData: FormData,
): Promise<CartActionResult> {
  try {
    const rawData = {
      variantId: formData.get('variantId'),
      quantity: Number(formData.get('quantity')),
    }

    const parsed = updateCartItemSchema.safeParse(rawData)
    if (!parsed.success) {
      return { success: false, fieldErrors: parsed.error.flatten().fieldErrors }
    }

    const { variantId, quantity } = parsed.data
    const sessionToken = await getExistingCartSessionId()
    if (!sessionToken) {
      return { success: false, error: 'CART_NOT_FOUND' }
    }

    const cartId = await cartRepository.getCartId(sessionToken)
    if (!cartId) {
      return { success: false, error: 'CART_NOT_FOUND' }
    }

    const supabase = createAdminClient()
    const { data: variant } = await supabase
      .from('product_variants')
      .select('is_active, stock_quantity, products(is_active)')
      .eq('id', variantId)
      .single()

    if (!variant || !variant.is_active || !variant.products?.is_active) {
      return { success: false, error: 'PRODUCT_INACTIVE' }
    }

    if (quantity > variant.stock_quantity) {
      return { success: false, error: 'INSUFFICIENT_STOCK' }
    }

    console.log('[updateCartItemQuantityAction] updating repo')
    await cartRepository.updateCartItemQuantity(cartId, variantId, quantity)
    console.log('[updateCartItemQuantityAction] updated repo, revalidating')
    revalidatePath('/', 'layout')
    console.log('[updateCartItemQuantityAction] revalidated, returning')
    return { success: true }
  } catch (error: any) {
    console.error('Update cart item error:', error)
    return { success: false, error: 'Failed to update item quantity.' }
  }
}

export async function removeCartItemAction(
  prevState: CartActionResult,
  formData: FormData,
): Promise<CartActionResult> {
  try {
    const rawData = {
      variantId: formData.get('variantId'),
    }

    const parsed = removeCartItemSchema.safeParse(rawData)
    if (!parsed.success) {
      return { success: false, fieldErrors: parsed.error.flatten().fieldErrors }
    }

    const sessionToken = await getExistingCartSessionId()
    if (!sessionToken) return { success: true }

    const cartId = await cartRepository.getCartId(sessionToken)
    if (!cartId) return { success: true }

    await cartRepository.removeCartItem(cartId, parsed.data.variantId)

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error) {
    console.error('Remove cart item error:', error)
    return { success: false, error: 'Failed to remove item.' }
  }
}

export async function clearCartAction(): Promise<CartActionResult> {
  try {
    const sessionToken = await getExistingCartSessionId()
    if (!sessionToken) return { success: true }

    const cartId = await cartRepository.getCartId(sessionToken)
    if (!cartId) return { success: true }

    await cartRepository.clearCart(cartId)

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error) {
    console.error('Clear cart error:', error)
    return { success: false, error: 'Failed to clear cart.' }
  }
}
