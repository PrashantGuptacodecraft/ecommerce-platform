'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const reviewSchema = z.object({
  productId: z.string().uuid(),
  authorName: z.string().min(2, "Name must be at least 2 characters").max(50),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional().nullable(),
  content: z.string().max(1000).optional().nullable(),
})

export async function submitReviewAction(formData: FormData) {
  try {
    const data = {
      productId: formData.get('productId') as string,
      authorName: formData.get('authorName') as string,
      rating: parseInt(formData.get('rating') as string, 10),
      title: formData.get('title') as string || null,
      content: formData.get('content') as string || null,
    }

    const validated = reviewSchema.parse(data)

    const supabase = createAdminClient()
    
    // Default status is 'pending', will not show publicly until approved
    const { error } = await supabase
      .from('product_reviews' as any)
      .insert({
        product_id: validated.productId,
        author_name: validated.authorName,
        rating: validated.rating,
        title: validated.title,
        content: validated.content,
        status: 'pending', 
        is_verified_purchase: false // In phase 2, we can verify this by checking orders
      })

    if (error) {
      console.error('Insert error:', error)
      return { success: false, error: 'Failed to submit review' }
    }

    revalidatePath(`/product/[slug]`, 'page')
    
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: (error as any).errors[0].message }
    }
    console.error('Error submitting review:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
