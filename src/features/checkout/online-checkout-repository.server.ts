import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

export const onlineCheckoutRepository = {
  async createRazorpayOrderAtomic(params: {
    authUserId: string
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
    expectedTotalPaise: number
  }) {
    const supabase = createAdminClient()
    const { data, error } = await supabase.rpc('create_razorpay_order_atomic', {
      p_auth_user_id: params.authUserId,
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
      p_expected_total_paise: params.expectedTotalPaise,
    })

    if (error) {
      console.error('create_razorpay_order_atomic RPC error:', error)
      return { success: false, error: 'ORDER_CREATION_FAILED' }
    }

    return data as {
      success: boolean
      error?: string
      orderId?: string
      orderNumber?: string
      intentId?: string
      receipt?: string
      totalPaise?: number
    }
  },

  async attachRazorpayOrderAtomic(
    intentId: string,
    razorpayOrderId: string,
    amountPaise: number,
    currency: string,
  ): Promise<boolean> {
    const supabase = createAdminClient()
    const { data, error } = await supabase.rpc('attach_razorpay_order_atomic', {
      p_intent_id: intentId,
      p_razorpay_order_id: razorpayOrderId,
      p_amount_paise: amountPaise,
      p_currency: currency,
    })

    if (error) {
      console.error('attach_razorpay_order_atomic error:', error)
      return false
    }
    return !!data
  },

  async recordPaymentAttemptAtomic(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    status: 'created' | 'authorized' | 'captured' | 'failed' | 'refunded',
    amountPaise: number,
  ): Promise<boolean> {
    const supabase = createAdminClient()
    const { data, error } = await supabase.rpc('record_razorpay_payment_attempt_atomic', {
      p_razorpay_order_id: razorpayOrderId,
      p_razorpay_payment_id: razorpayPaymentId,
      p_status: status,
      p_amount_paise: amountPaise,
    })

    if (error) {
      console.error('record_razorpay_payment_attempt_atomic error:', error)
      return false
    }
    return !!data
  },

  async confirmPaymentAtomic(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    amountPaise: number,
    currency: string,
  ) {
    const supabase = createAdminClient()
    const { data, error } = await supabase.rpc('confirm_razorpay_payment_atomic', {
      p_razorpay_order_id: razorpayOrderId,
      p_razorpay_payment_id: razorpayPaymentId,
      p_amount_paise: amountPaise,
      p_currency: currency,
    })

    if (error) {
      console.error('confirm_razorpay_payment_atomic error:', error)
      return { success: false, error: 'CONFIRMATION_FAILED' }
    }

    return data as { success: boolean; error?: string; orderNumber?: string; status?: string }
  },

  async markIntentFailedAtomic(intentId: string): Promise<boolean> {
    const supabase = createAdminClient()
    const { error } = await supabase.rpc('mark_intent_initialization_failed_atomic', {
      p_intent_id: intentId,
    })
    return !error
  },

  async markIntentAmbiguousAtomic(intentId: string): Promise<boolean> {
    const supabase = createAdminClient()
    const { error } = await supabase.rpc('mark_intent_initialization_ambiguous_atomic', {
      p_intent_id: intentId,
    })
    return !error
  },

  async expireRazorpayOrderAtomic(orderId: string, reason: string): Promise<boolean> {
    const supabase = createAdminClient()
    const { error } = await supabase.rpc('expire_razorpay_order_atomic', {
      p_order_id: orderId,
      p_reason: reason,
    })
    return !error
  },

  async listExpiredCandidates(limit: number) {
    const supabase = createAdminClient()
    const { data, error } = await supabase.rpc('list_expired_razorpay_candidates', {
      p_limit: limit,
    })

    if (error) {
      console.error('list_expired_razorpay_candidates error:', error)
      return []
    }

    return data as Array<{
      intent_id: string
      order_id: string
      razorpay_order_id: string | null
      deterministic_receipt: string
      hold_extension_count: number
    }>
  },

  async updateReconciliationHold(intentId: string, extendHold: boolean) {
    const supabase = createAdminClient()
    const { error } = await supabase.rpc('update_razorpay_intent_reconciliation', {
      p_intent_id: intentId,
      p_extend_hold: extendHold,
    })
    return !error
  },
}
