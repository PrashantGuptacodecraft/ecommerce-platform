import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

export const checkoutRepository = {
  async createCodOrderAtomic(params: {
    sessionToken: string
    idempotencyKey: string
    payloadHash: string
    name: string
    email: string
    phone: string
    addressLine1: string
    addressLine2?: string
    landmark?: string
    city: string
    state: string
    postalCode: string
    notes?: string
  }): Promise<{ success: boolean; error?: string; orderNumber?: string; orderId?: string; totalPaise?: number }> {
    const supabase = createAdminClient()

    const { data, error } = await supabase.rpc('create_cod_order_atomic', {
      p_session_token: params.sessionToken,
      p_idempotency_key: params.idempotencyKey,
      p_payload_hash: params.payloadHash,
      p_name: params.name,
      p_email: params.email,
      p_phone: params.phone,
      p_address_line1: params.addressLine1,
      p_address_line2: params.addressLine2 || '',
      p_landmark: params.landmark || '',
      p_city: params.city,
      p_state: params.state,
      p_postal_code: params.postalCode,
      p_notes: params.notes || '',
    })

    if (error) {
      console.error('create_cod_order_atomic RPC error:', error)
      return { success: false, error: 'ORDER_CREATION_FAILED' }
    }

    return data as { success: boolean; error?: string; orderNumber?: string; orderId?: string; totalPaise?: number }
  }
}
