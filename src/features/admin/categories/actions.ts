'use server'

import { requireAdmin } from '@/lib/security/auth'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { categorySchema } from '../validation/category'
import { mapAdminMutationError, getSafeErrorMessage } from '../errors/map-admin-mutation-error'

export type SaveCategoryArgs = {
  categoryId?: string
  expectedUpdatedAt?: string
  payloadVersion: number
  payload: {
    name: string
    slug: string
    description: string | null
    sort_order: number
    is_active: boolean
  }
  idempotencyKey: string
}

export type CategoryActionState = {
  success: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
  timestamp?: number
}

export async function saveCategoryTransactionAction(args: SaveCategoryArgs): Promise<CategoryActionState> {
  await requireAdmin()
  const supabase = await createClient()

  const validated = categorySchema.safeParse(args.payload)

  if (!validated.success) {
    return {
      success: false,
      error: getSafeErrorMessage('VALIDATION_FAILED'),
      fieldErrors: validated.error.flatten().fieldErrors,
      timestamp: Date.now(),
    }
  }

  // 2. Call RPC
  const { error } = await supabase.rpc('save_category_transaction', {
    p_category_id: (args.categoryId || null) as any,
    p_expected_updated_at: (args.expectedUpdatedAt || null) as any,
    p_payload_version: args.payloadVersion,
    p_payload: validated.data,
    p_idempotency_key: args.idempotencyKey,
  })

  if (error) {
    return {
      success: false,
      error: getSafeErrorMessage(mapAdminMutationError(error)),
      timestamp: Date.now(),
    }
  }

  // 3. Cache Invalidation
  revalidatePath('/admin/categories')
  
  if (args.categoryId) {
    revalidatePath(`/category/${validated.data.slug}`)
  }
  revalidatePath('/shop')
  revalidatePath('/')

  if (args.categoryId || validated.data.is_active) {
    revalidatePath('/sitemap.xml')
  }

  return {
    success: true,
    timestamp: Date.now(),
  }
}
