'use server'

import { requireAdmin } from '@/lib/security/auth'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { categorySchema } from '../validation/category'
import { mapAdminMutationError, getSafeErrorMessage } from '../errors/map-admin-mutation-error'

export type CategoryActionState = {
  success: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
  timestamp?: number
}

export async function saveCategoryAction(
  prevState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  await requireAdmin()
  const supabase = await createClient()

  // 1. Parse and validate
  const rawData = {
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description'),
    sort_order: parseInt((formData.get('sort_order') as string) || '0', 10),
    is_active: formData.get('is_active') === 'true',
  }

  const categoryId = formData.get('category_id') as string | null
  const expectedUpdatedAt = formData.get('expected_updated_at') as string | null
  const idempotencyKey = formData.get('idempotency_key') as string

  const validated = categorySchema.safeParse(rawData)

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
    p_category_id: (categoryId || null) as any,
    p_expected_updated_at: (expectedUpdatedAt || null) as any,
    p_payload_version: 1,
    p_payload: validated.data,
    p_idempotency_key: idempotencyKey,
  })

  if (error) {
    return {
      success: false,
      error: getSafeErrorMessage(mapAdminMutationError(error)),
      timestamp: Date.now(),
    }
  }

  // 3. Cache Invalidation
  if (categoryId) {
    revalidatePath(`/category/${validated.data.slug}`)
  }
  revalidatePath('/shop')
  revalidatePath('/')

  if (categoryId || validated.data.is_active) {
    revalidatePath('/sitemap.xml')
  }

  return {
    success: true,
    timestamp: Date.now(),
  }
}
