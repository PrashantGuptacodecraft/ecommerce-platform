'use server'

import { requireAdmin } from '@/lib/security/auth'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { mapAdminMutationError, getSafeErrorMessage } from '../errors/map-admin-mutation-error'
import { site } from '@/config/site'
import { executeFinalizeImageUpload } from './finalize-image.server'

export type ImageActionState = {
  success: boolean
  error?: string
  updatedAt?: string
  timestamp?: number
}

export async function createUploadIntentAction(
  productId: string,
  fileInfo: { mimeType: string; sizeBytes: number },
  idempotencyKey: string,
) {
  await requireAdmin()
  const supabase = await createClient()

  if (!site.upload.acceptedImageTypes.includes(fileInfo.mimeType as any)) {
    return { success: false, error: 'Unsupported file type.' }
  }
  if (fileInfo.sizeBytes > site.upload.maxBytes) {
    return { success: false, error: 'File size exceeds maximum allowed.' }
  }

  const { data, error } = await supabase.rpc('create_product_image_upload_intent', {
    p_product_id: productId,
    p_declared_mime_type: fileInfo.mimeType as any,
    p_declared_size_bytes: fileInfo.sizeBytes,
    p_idempotency_key: idempotencyKey,
  })

  if (error) {
    return { success: false, error: getSafeErrorMessage(mapAdminMutationError(error)) }
  }

  const resultData = data as any

  // Generate signed upload URL
  const { data: signedData, error: signedError } = await supabase.storage
    .from('product-images')
    .createSignedUploadUrl(resultData.object_path)

  if (signedError) {
    return { success: false, error: 'Failed to create secure upload session.' }
  }

  return {
    success: true,
    intentId: resultData.intent_id,
    objectPath: resultData.object_path,
    signedUrl: signedData.signedUrl,
    token: signedData.token,
  }
}

export async function finalizeImageUploadAction(
  intentId: string,
  expectedUpdatedAt: string,
  idempotencyKey: string,
) {
  const adminContext = await requireAdmin()

  // Use the isolated server-only module
  const { imageId, updatedAt, error } = await executeFinalizeImageUpload(
    intentId,
    adminContext.userId,
    expectedUpdatedAt,
    idempotencyKey,
  )

  if (error) {
    return { success: false, error: getSafeErrorMessage(mapAdminMutationError(error)) }
  }

  return { success: true, updatedAt, imageId }
}
