import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { onlineCheckoutRepository } from '@/features/checkout/online-checkout-repository.server'
import { razorpayClient } from '@/lib/razorpay/razorpay-client.server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  // 1. Verify cron secret securely
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const token = authHeader.substring(7)
  const expectedSecret = process.env.CRON_SECRET || ''

  if (!expectedSecret) {
    console.error('CRON_SECRET is not configured')
    return new NextResponse('Internal Server Error', { status: 500 })
  }

  // Timing safe comparison
  try {
    const isAuthorized = crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedSecret))
    if (!isAuthorized) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
  } catch (e) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    // 2. Fetch candidates (batch size 50)
    const candidates = await onlineCheckoutRepository.listExpiredCandidates(50)

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ processed: 0 })
    }

    let processedCount = 0

    // 3. Reconcile each candidate
    for (const candidate of candidates) {
      try {
        if (!candidate.razorpay_order_id) {
          // It failed to even initialize with Razorpay and never attached an order ID
          // Safe to expire immediately
          await onlineCheckoutRepository.expireRazorpayOrderAtomic(
            candidate.order_id,
            'Intent expired before provider order ID was attached',
          )
          processedCount++
          continue
        }

        // Fetch Razorpay Order
        const rzpOrder = await razorpayClient.orders.fetch(candidate.razorpay_order_id)

        if (rzpOrder.status === 'paid') {
          // Fetch payments to find the captured one
          const payments = await razorpayClient.orders.fetchPayments(candidate.razorpay_order_id)
          const capturedPayment = payments.items?.find((p: any) => p.status === 'captured')

          if (capturedPayment) {
            await onlineCheckoutRepository.confirmPaymentAtomic(
              candidate.razorpay_order_id,
              capturedPayment.id,
              Number(capturedPayment.amount),
              capturedPayment.currency as string,
            )
            processedCount++
          } else {
            // Paid but no captured payment found? Ambiguous, extend hold.
            await onlineCheckoutRepository.updateReconciliationHold(candidate.intent_id, true)
          }
        } else if (rzpOrder.status === 'attempted') {
          // Check if there is an authorized payment that needs manual capture or time to clear
          const payments = await razorpayClient.orders.fetchPayments(candidate.razorpay_order_id)
          const authorizedPayment = payments.items?.find((p: any) => p.status === 'authorized')

          if (authorizedPayment) {
            if (candidate.hold_extension_count < 3) {
              // Extend hold (up to 3 times, i.e., 45 mins)
              await onlineCheckoutRepository.updateReconciliationHold(candidate.intent_id, true)
            } else {
              // Exhausted hold extensions with authorized payment — flag for admin
              const adminClient = createAdminClient()
              await adminClient
                .from('razorpay_payment_intents')
                .update({
                  requires_manual_review: true,
                  review_reason: 'Authorized payment not captured after 3 reconciliation cycles',
                })
                .eq('id', candidate.intent_id)
              await onlineCheckoutRepository.updateReconciliationHold(candidate.intent_id, false)
            }
          } else {
            // It's attempted but all payments failed. We can safely expire.
            await onlineCheckoutRepository.expireRazorpayOrderAtomic(
              candidate.order_id,
              'Razorpay order attempted but all payments failed',
            )
            processedCount++
          }
        } else if (rzpOrder.status === 'created') {
          // Created but no attempts. Customer abandoned.
          await onlineCheckoutRepository.expireRazorpayOrderAtomic(
            candidate.order_id,
            'Customer abandoned checkout without attempting payment',
          )
          processedCount++
        } else {
          // Unknown status
          await onlineCheckoutRepository.updateReconciliationHold(candidate.intent_id, true)
        }
      } catch (err) {
        console.error(`Failed to reconcile intent ${candidate.intent_id}:`, err)
        // Network error fetching from provider, do not expire.
        await onlineCheckoutRepository.updateReconciliationHold(candidate.intent_id, true)
      }
    }

    return NextResponse.json({ processed: processedCount, candidates: candidates.length })
  } catch (error) {
    console.error('Reconciliation cron error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
