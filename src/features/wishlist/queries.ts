import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { getExistingWishlistSessionId } from './wishlist-session.server'

export async function getWishlistProductIds(): Promise<string[]> {
  try {
    const sessionToken = await getExistingWishlistSessionId()
    if (!sessionToken) return []

    const supabase = createAdminClient()

    const res1 = await supabase
      .from('wishlists' as any)
      .select('id')
      .eq('session_token', sessionToken)
      .single()

    const wishlist = (res1 as any).data

    if (!wishlist) return []

    const res2 = await supabase
      .from('wishlist_items' as any)
      .select('product_id')
      .eq('wishlist_id', wishlist.id)

    const items = (res2 as any).data

    return items ? items.map((item: any) => item.product_id) : []
  } catch (error) {
    console.error('Failed to get wishlist product ids:', error)
    return []
  }
}

export async function getWishlistProducts(): Promise<any[]> {
  try {
    const sessionToken = await getExistingWishlistSessionId()
    if (!sessionToken) return []

    const supabase = createAdminClient()

    const res1 = await supabase
      .from('wishlists' as any)
      .select('id')
      .eq('session_token', sessionToken)
      .single()

    const wishlist = (res1 as any).data

    if (!wishlist) return []

    // Fetch the products through the wishlist_items join
    const result2 = await supabase
      .from('wishlist_items' as any)
      .select('product_id')
      .eq('wishlist_id', wishlist.id)
      
    const items = (result2 as any).data

    if (!items || items.length === 0) return []
    
    const productIds = items.map((i: any) => i.product_id)
    
    // We fetch the full product details. In a real app we'd fetch images and prices too.
    const result3 = await supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        is_active,
        product_images (
          id,
          storage_path,
          alt_text
        ),
        product_variants (
          id,
          price
        )
      `)
      .in('id', productIds)
      .eq('is_active', true)
      
    const products = (result3 as any).data

    return products || []
  } catch (error) {
    console.error('Failed to get wishlist products:', error)
    return []
  }
}
