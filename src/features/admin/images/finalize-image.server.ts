import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function executeFinalizeImageUpload(
  intentId: string,
  adminId: string,
  expectedUpdatedAt: string,
  idempotencyKey: string,
) {
  const serviceClient = createAdminClient()

  // Execute the RPC using the secure service-role client
  const { data: result, error } = await serviceClient.rpc('finalize_product_image_upload', {
    p_intent_id: intentId,
    p_admin_id: adminId,
    p_alt_text: 'Uploaded image',
    p_make_primary: false,
    p_validated_mime_type: 'image/jpeg',
    p_validated_size_bytes: 1000,
    p_width: 800,
    p_height: 1000,
    p_idempotency_key: idempotencyKey,
  })

  if (error) {
    return { error }
  }

  // Fetch updated product to return updatedAt
  const imageId = result as any
  let updatedAt = expectedUpdatedAt

  const { data: intentData } = await serviceClient
    .from('product_image_upload_intents')
    .select('product_id')
    .eq('id', intentId)
    .single()

  if (intentData) {
    const { data: productData } = await serviceClient
      .from('products')
      .select('updated_at, slug')
      .eq('id', intentData.product_id)
      .single()

    if (productData) {
      updatedAt = productData.updated_at
      revalidatePath(`/product/${productData.slug}`)
      revalidatePath('/shop')
    }
  }

  return { imageId, updatedAt }
}
