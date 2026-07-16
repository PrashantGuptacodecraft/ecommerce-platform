'use server'

import { getExistingCartSessionId } from '@/features/cart/cart-session.server'
import { checkoutFormSchema } from './validation'
import { onlineCheckoutRepository } from './online-checkout-repository.server'
import { onlineCheckoutService } from './online-checkout-service.server'
import { verifyRazorpaySignature } from '@/lib/razorpay/razorpay-signature.server'

export type OnlineCheckoutActionResult = {
  success: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
  razorpayOrderId?: string
  amountPaise?: number
  currency?: string
  keyId?: string
  name?: string
  email?: string
  phone?: string
  receipt?: string
}

export async function submitOnlineCheckoutAction(
  prevState: OnlineCheckoutActionResult,
  formData: FormData,
): Promise<OnlineCheckoutActionResult> {
  try {
    const rawData = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      addressLine1: formData.get('addressLine1'),
      addressLine2: formData.get('addressLine2') || undefined,
      landmark: formData.get('landmark') || undefined,
      city: formData.get('city'),
      state: formData.get('state'),
      postalCode: formData.get('postalCode'),
      notes: formData.get('notes') || undefined,
      paymentMethod: formData.get('paymentMethod'),
      idempotencyKey: formData.get('idempotencyKey'),
      payloadHash: formData.get('payloadHash'),
      expectedTotalPaise: formData.get('expectedTotalPaise'),
    }

    const parsed = checkoutFormSchema.safeParse(rawData)
    if (!parsed.success) {
      return { success: false, fieldErrors: parsed.error.flatten().fieldErrors }
    }

    if (parsed.data.paymentMethod !== 'razorpay') {
      return { success: false, error: 'INVALID_PAYMENT_METHOD' }
    }

    const sessionToken = await getExistingCartSessionId()
    if (!sessionToken) {
      return { success: false, error: 'CART_NOT_FOUND' }
    }

    // Enforce authentication for checkout
    const { requireCustomer } = await import('@/features/auth/server-customer')
    const { customer } = await requireCustomer()

    const {
      name,
      email,
      phone,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      postalCode,
      notes,
      idempotencyKey,
      payloadHash,
      expectedTotalPaise,
    } = parsed.data

    const initResult = await onlineCheckoutRepository.createRazorpayOrderAtomic({
      authUserId: customer.auth_user_id,
      sessionToken,
      idempotencyKey,
      payloadHash,
      name,
      email,
      phone,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      postalCode,
      notes,
      expectedTotalPaise,
    })

    if (
      !initResult.success ||
      !initResult.intentId ||
      !initResult.receipt ||
      !initResult.totalPaise
    ) {
      return { success: false, error: initResult.error || 'ORDER_CREATION_FAILED' }
    }

    // Call Razorpay API
    let rzpResult = await onlineCheckoutService.initializeRazorpayOrder(
      initResult.intentId,
      initResult.receipt,
      initResult.totalPaise,
      'INR',
    )

    // Handle ambiguous recovery
    if (!rzpResult.success && rzpResult.error === 'INITIALIZATION_AMBIGUOUS') {
      rzpResult = await onlineCheckoutService.reconcileAmbiguousIntent(
        initResult.intentId,
        initResult.receipt,
        initResult.totalPaise,
        'INR',
      )
      // If recovery failed, we try initialization one more time safely
      // (actually best to just fail and let the user click pay again)
      if (!rzpResult.success) {
        return { success: false, error: 'INITIALIZATION_AMBIGUOUS_RETRY' }
      }
    } else if (!rzpResult.success) {
      return { success: false, error: rzpResult.error }
    }

    return {
      success: true,
      razorpayOrderId: rzpResult.providerOrderId,
      amountPaise: initResult.totalPaise,
      currency: 'INR',
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      receipt: initResult.receipt,
    }
  } catch (error) {
    console.error('Submit online checkout error:', error)
    return { success: false, error: 'SYSTEM_ERROR' }
  }
}

export async function verifyRazorpayCallbackAction(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string,
  amountPaise: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, signature)

    if (!isValid) {
      return { success: false, error: 'INVALID_SIGNATURE' }
    }

    // We do NOT confirm the order here. We just record the attempt.
    // The webhook will authoritatively confirm it.
    // Callback verification must not confirm the order.
    // Only a verified captured payment (via webhook) may move the order to CONFIRMED.

    await onlineCheckoutRepository.recordPaymentAttemptAtomic(
      razorpayOrderId,
      razorpayPaymentId,
      'authorized',
      amountPaise,
    )

    return { success: true }
  } catch (error) {
    console.error('Verify callback error:', error)
    return { success: false, error: 'SYSTEM_ERROR' }
  }
}
