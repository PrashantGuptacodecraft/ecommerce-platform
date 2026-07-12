'use server'

import { requireAdmin } from '@/lib/security/auth'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { productTreePayloadSchema } from '../validation/product'
import { mapAdminMutationError, getSafeErrorMessage } from '../errors/map-admin-mutation-error'

export type ProductActionState = {
  success: boolean
  productId?: string
  updatedAt?: string
  error?: string
  fieldErrors?: Record<string, string[]>
  timestamp?: number
}

export async function saveProductTreeAction(
  prevState: ProductActionState,
  data: {
    productId: string | null
    expectedUpdatedAt: string | null
    payload: any
    idempotencyKey: string
  },
): Promise<ProductActionState> {
  await requireAdmin()
  const supabase = await createClient()

  const validated = productTreePayloadSchema.safeParse(data.payload)

  if (!validated.success) {
    return {
      success: false,
      error: getSafeErrorMessage('VALIDATION_FAILED'),
      fieldErrors: validated.error.flatten().fieldErrors,
      timestamp: Date.now(),
    }
  }

  const payloadToSave = validated.data
  const isNewProduct = !data.productId

  // Rule: For the first product save, enforce is_active = false on the server
  if (isNewProduct) {
    payloadToSave.product.is_active = false
  }

  const { data: resultData, error } = await supabase.rpc('save_product_tree', {
    p_product_id: (data.productId || null) as any,
    p_expected_updated_at: (data.expectedUpdatedAt || null) as any,
    p_payload_version: 1,
    p_payload: payloadToSave,
    p_idempotency_key: data.idempotencyKey,
  })

  if (error) {
    return {
      success: false,
      error: getSafeErrorMessage(mapAdminMutationError(error)),
      timestamp: Date.now(),
    }
  }

  const returnedProductId = (resultData as any).product_id

  // Fetch the actual updated_at since the RPC doesn't return it
  const { data: productData, error: fetchError } = await supabase
    .from('products')
    .select('updated_at, slug')
    .eq('id', returnedProductId)
    .single()

  if (fetchError || !productData) {
    return {
      success: false,
      error: 'Product saved but failed to retrieve updated timestamp.',
      timestamp: Date.now(),
    }
  }

  // Cache Invalidation
  if (!isNewProduct) {
    revalidatePath(`/product/${productData.slug}`)
  }
  revalidatePath('/shop')
  revalidatePath('/')

  if (payloadToSave.product.is_active || !isNewProduct) {
    revalidatePath('/sitemap.xml')
  }

  return {
    success: true,
    productId: returnedProductId,
    updatedAt: productData.updated_at,
    timestamp: Date.now(),
  }
}
