import 'server-only'
import { razorpayClient } from '@/lib/razorpay/razorpay-client.server'
import { onlineCheckoutRepository } from './online-checkout-repository.server'

export const onlineCheckoutService = {
  async initializeRazorpayOrder(
    intentId: string,
    receipt: string,
    amountPaise: number,
    currency: string,
  ): Promise<{ success: boolean; providerOrderId?: string; error?: string }> {
    try {
      const order = (await razorpayClient.orders.create({
        amount: amountPaise,
        currency,
        receipt,
        payment_capture: true, // Enable auto-capture for test mode
      })) as any

      if (!order.id) {
        throw new Error('Razorpay did not return an order ID')
      }

      const attached = await onlineCheckoutRepository.attachRazorpayOrderAtomic(
        intentId,
        order.id,
        amountPaise,
        currency,
      )

      if (!attached) {
        return { success: false, error: 'FAILED_TO_ATTACH' }
      }

      return { success: true, providerOrderId: order.id }
    } catch (error: any) {
      console.error('Razorpay order creation failed:', error)

      // Definite rejection vs Ambiguous failure (timeout/network)
      // Usually, if it has a response status 4xx, it's definite.
      const isDefinite = error.statusCode >= 400 && error.statusCode < 500

      if (isDefinite) {
        await onlineCheckoutRepository.markIntentFailedAtomic(intentId)
        return { success: false, error: 'INITIALIZATION_FAILED' }
      } else {
        await onlineCheckoutRepository.markIntentAmbiguousAtomic(intentId)
        // We could theoretically try to query Razorpay immediately, but it's safer to return failure
        // to the client and let them retry, which will hit the ambiguous recovery logic.
        return { success: false, error: 'INITIALIZATION_AMBIGUOUS' }
      }
    }
  },

  async reconcileAmbiguousIntent(
    intentId: string,
    receipt: string,
    amountPaise: number,
    currency: string,
  ): Promise<{ success: boolean; providerOrderId?: string; error?: string }> {
    try {
      const orders = await razorpayClient.orders.all({
        receipt,
        authorized: 1 as any, // fetch all regardless of authorization
      })

      // Razorpay's .all() might return items array
      const matches = (orders.items || []).filter((o: any) => o.receipt === receipt)

      if (matches.length === 1) {
        const order = matches[0]
        if (order && order.amount === amountPaise && order.currency === currency) {
          const attached = await onlineCheckoutRepository.attachRazorpayOrderAtomic(
            intentId,
            order.id,
            amountPaise,
            currency,
          )
          if (attached) {
            return { success: true, providerOrderId: order.id }
          }
        }
      }

      return { success: false, error: 'RECONCILIATION_FAILED' }
    } catch (error) {
      console.error('Failed to reconcile ambiguous intent:', error)
      return { success: false, error: 'RECONCILIATION_ERROR' }
    }
  },
}
