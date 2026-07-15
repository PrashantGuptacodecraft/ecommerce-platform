'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getWishlistSessionId } from './wishlist-session.server'
import { revalidatePath } from 'next/cache'

export async function toggleWishlistItemAction(productId: string) {
  try {
    const supabase = createAdminClient()
    const sessionToken = await getWishlistSessionId()

    // 1. Get or create wishlist for this session
    const res1 = await supabase
      .from('wishlists' as any)
      .select('id')
      .eq('session_token', sessionToken)
      .single()

    let wishlist = (res1 as any).data

    if (!wishlist) {
      const res2 = await supabase
        .from('wishlists' as any)
        .insert({ session_token: sessionToken })
        .select('id')
        .single()

      const newWishlist = (res2 as any).data
      const createError = (res2 as any).error
      
      if (createError) throw new Error('Failed to create wishlist')
      wishlist = newWishlist
    }

    // 2. Check if item exists in wishlist
    const res3 = await supabase
      .from('wishlist_items' as any)
      .select('id')
      .eq('wishlist_id', wishlist.id)
      .eq('product_id', productId)
      .single()

    const existingItem = (res3 as any).data

    if (existingItem) {
      // Remove it
      const res4 = await supabase
        .from('wishlist_items' as any)
        .delete()
        .eq('id', existingItem.id)
      
      const deleteError = (res4 as any).error
      if (deleteError) throw new Error('Failed to remove item from wishlist')
    } else {
      // Add it
      const res5 = await supabase
        .from('wishlist_items' as any)
        .insert({
          wishlist_id: wishlist.id,
          product_id: productId
        })
      
      const insertError = (res5 as any).error
      if (insertError) throw new Error('Failed to add item to wishlist')
    }

    revalidatePath('/wishlist')
    revalidatePath(`/product/[slug]`, 'page')
    
    return { success: true, isAdded: !existingItem }
  } catch (error) {
    console.error('Error toggling wishlist item:', error)
    return { success: false, error: 'Failed to update wishlist' }
  }
}
