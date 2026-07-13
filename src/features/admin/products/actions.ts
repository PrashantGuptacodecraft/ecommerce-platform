'use server'

import { requireAdmin } from '@/lib/security/auth'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { productTreePayloadSchema as productSchema } from '../validation/product'
import { mapAdminMutationError, getSafeErrorMessage } from '../errors/map-admin-mutation-error'

export type SaveProductArgs = {
  productId?: string
  expectedUpdatedAt?: string
  payloadVersion: number
  payload: any // validated by zod
  idempotencyKey: string
}

export type ProductActionState = {
  success: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
  productId?: string
  updatedAt?: string
  timestamp?: number
}

export async function saveProductAction(args: SaveProductArgs): Promise<ProductActionState> {
  await requireAdmin()
  const supabase = await createClient()

  const validated = productSchema.safeParse(args.payload)

  if (!validated.success) {
    return {
      success: false,
      error: getSafeErrorMessage('VALIDATION_FAILED'),
      fieldErrors: validated.error.flatten().fieldErrors,
      timestamp: Date.now(),
    }
  }

  // Call RPC
  const { data, error } = await supabase.rpc('save_product_tree', {
    p_product_id: (args.productId || null) as any,
    p_expected_updated_at: (args.expectedUpdatedAt || null) as any,
    p_payload_version: args.payloadVersion,
    p_payload: validated.data as any,
    p_idempotency_key: args.idempotencyKey,
  })

  if (error) {
    return {
      success: false,
      error: getSafeErrorMessage(mapAdminMutationError(error)),
      timestamp: Date.now(),
    }
  }

  const resultData = data as { product_id: string; updated_at: string }

  // Cache Invalidation
  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${resultData.product_id}`)
  revalidatePath(`/product/${validated.data.product.slug}`)
  revalidatePath('/shop')
  revalidatePath('/')

  if (args.productId || validated.data.product.is_active) {
    revalidatePath('/sitemap.xml')
  }

  return {
    success: true,
    productId: resultData.product_id,
    updatedAt: resultData.updated_at,
    timestamp: Date.now(),
  }
}
