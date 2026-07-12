'use server'

import { requireAdmin } from '@/lib/security/auth'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { mapAdminMutationError, getSafeErrorMessage } from '../errors/map-admin-mutation-error'
import { adjustStockSchema } from '../validation/inventory'

export type InventoryActionState = {
  success: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
  timestamp?: number
}

export async function adjustStockAction(
  prevState: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  await requireAdmin()
  const supabase = await createClient()

  const rawData = {
    variant_id: formData.get('variant_id'),
    change_quantity: parseInt((formData.get('change_quantity') as string) || '0', 10),
    note: formData.get('note'),
    idempotency_key: formData.get('idempotency_key'),
  }

  const validated = adjustStockSchema.safeParse(rawData)
  if (!validated.success) {
    return {
      success: false,
      error: getSafeErrorMessage('VALIDATION_FAILED'),
      fieldErrors: validated.error.flatten().fieldErrors,
      timestamp: Date.now(),
    }
  }

  const { error } = await supabase.rpc('manual_adjust_variant_stock', {
    p_variant_id: validated.data.variant_id,
    p_change_quantity: validated.data.change_quantity,
    p_note: validated.data.note,
    p_idempotency_key: validated.data.idempotency_key,
  })

  if (error) {
    return {
      success: false,
      error: getSafeErrorMessage(mapAdminMutationError(error)),
      timestamp: Date.now(),
    }
  }

  revalidatePath('/shop')

  return {
    success: true,
    timestamp: Date.now(),
  }
}
