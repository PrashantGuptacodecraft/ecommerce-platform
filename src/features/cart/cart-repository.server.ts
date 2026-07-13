import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

export const cartRepository = {
  async getOrCreateCart(sessionToken: string): Promise<string> {
    const supabase = createAdminClient()

    // Check if cart exists
    const { data: existingCart } = await supabase
      .from('carts')
      .select('id')
      .eq('session_token', sessionToken)
      .maybeSingle()

    if (existingCart) {
      return existingCart.id
    }

    // Create new cart
    const { data: newCart, error } = await supabase
      .from('carts')
      .insert({ session_token: sessionToken })
      .select('id')
      .single()

    if (error || !newCart) {
      throw new Error('Failed to create cart')
    }

    return newCart.id
  },

  async getCartId(sessionToken: string): Promise<string | null> {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('carts')
      .select('id')
      .eq('session_token', sessionToken)
      .maybeSingle()
    return data?.id || null
  },

  async upsertCartItemAtomic(
    sessionToken: string,
    variantId: string,
    quantity: number,
    idempotencyKey: string,
  ): Promise<{ success: boolean; quantity?: number; error?: string }> {
    const supabase = createAdminClient()

    const { data, error } = await supabase.rpc('upsert_cart_item_atomic', {
      p_session_token: sessionToken,
      p_variant_id: variantId,
      p_quantity: quantity,
      p_idempotency_key: idempotencyKey,
    })

    if (error) {
      console.error('upsert_cart_item_atomic RPC error:', error)
      throw new Error('Failed to add item to cart via RPC')
    }

    // The RPC returns a JSON object like { success: true, quantity: X } or { success: false, error: 'ERR' }
    return data as { success: boolean; quantity?: number; error?: string }
  },

  async updateCartItemQuantity(cartId: string, variantId: string, quantity: number): Promise<void> {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('cart_id', cartId)
      .eq('variant_id', variantId)

    if (error) throw error
  },

  async removeCartItem(cartId: string, variantId: string): Promise<void> {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId)
      .eq('variant_id', variantId)

    if (error) throw error
  },

  async clearCart(cartId: string): Promise<void> {
    const supabase = createAdminClient()
    const { error } = await supabase.from('cart_items').delete().eq('cart_id', cartId)

    if (error) throw error
  },
}
