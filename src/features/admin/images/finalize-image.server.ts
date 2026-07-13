import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { parseImageMetadata } from './utils/image-parser'

export async function executeFinalizeImageUpload(
  intentId: string,
  adminId: string,
  expectedUpdatedAt: string,
  idempotencyKey: string,
) {
  const serviceClient = createAdminClient()

  // 1. Fetch the intent
  const { data: intentData, error: intentError } = await serviceClient
    .from('product_image_upload_intents')
    .select('*')
    .eq('id', intentId)
    .single()

  if (intentError || !intentData) {
    return { error: intentError || new Error('Intent not found') }
  }

  // 2. Download the uploaded object
  const { data: fileData, error: downloadError } = await serviceClient.storage
    .from('product-images')
    .download(intentData.object_path)

  if (downloadError || !fileData) {
    return { error: downloadError || new Error('Failed to download uploaded file') }
  }

  // 3. Inspect bytes
  const buffer = Buffer.from(await fileData.arrayBuffer())
  if (buffer.length !== intentData.declared_size_bytes) {
    return { error: new Error('File size mismatch') }
  }

  let metadata: { mimeType: string; width: number; height: number }
  try {
    metadata = parseImageMetadata(buffer)
  } catch (err) {
    return { error: new Error('Invalid or unsupported image format') }
  }

  if (metadata.mimeType !== intentData.declared_mime_type) {
    return { error: new Error('MIME type mismatch') }
  }

  // Execute the RPC using the secure service-role client
  const { data: result, error } = await serviceClient.rpc('finalize_product_image_upload', {
    p_intent_id: intentId,
    p_admin_id: adminId,
    p_alt_text: 'Uploaded image', // Can be updated later
    p_make_primary: false,
    p_validated_mime_type: metadata.mimeType,
    p_validated_size_bytes: buffer.length,
    p_width: metadata.width,
    p_height: metadata.height,
    p_idempotency_key: idempotencyKey,
  })

  if (error) {
    return { error }
  }

  // Fetch updated product to return updatedAt
  const imageId = result as any
  let updatedAt = expectedUpdatedAt

  const { data: productData } = await serviceClient
    .from('products')
    .select('updated_at, slug, category_id')
    .eq('id', intentData.product_id)
    .single()

  if (productData) {
    updatedAt = productData.updated_at
    
    // Invalidate caches
    revalidatePath(`/product/${productData.slug}`)
    revalidatePath('/shop')
    revalidatePath('/')
    // We would revalidate category if we had the slug, but we only have category_id here. 
    // Usually cache invalidation is better done via the category slug.
    // For Milestone 5, the global paths are sufficient.
  }

  return { imageId, updatedAt }
}
