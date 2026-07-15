import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

export interface Review {
  id: string
  product_id: string
  author_name: string
  rating: number
  title: string | null
  content: string | null
  is_verified_purchase: boolean
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export async function getProductReviews(productId: string): Promise<Review[]> {
  try {
    const supabase = createAdminClient()
    const result = await supabase
      .from('product_reviews' as any)
      .select('*')
      .eq('product_id', productId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    const { data, error } = result as any

    if (error) {
      console.error('Failed to get product reviews:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Error fetching product reviews:', error)
    return []
  }
}
