import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/razorpay/razorpay-signature.server'
import { onlineCheckoutRepository } from '@/features/checkout/online-checkout-repository.server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-razorpay-signature')
    const eventId = req.headers.get('x-razorpay-event-id')

    if (!signature || !eventId) {
      return NextResponse.json({ error: 'Missing headers' }, { status: 400 })
    }

    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const payload = JSON.parse(rawBody)
    const eventType = payload.event

    if (!['payment.captured', 'payment.failed', 'order.paid'].includes(eventType)) {
      // Return 200 for unsupported events so Razorpay doesn't retry them
      return NextResponse.json({ received: true })
    }

    const paymentEntity = payload.payload?.payment?.entity
    const orderEntity = payload.payload?.order?.entity

    // Extract relevant data
    // For payment events, paymentEntity is populated. For order events, orderEntity is populated.
    const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id
    const razorpayPaymentId = paymentEntity?.id
    const amountPaise = paymentEntity?.amount || orderEntity?.amount_paid
    const currency = paymentEntity?.currency || orderEntity?.currency

    if (!razorpayOrderId) {
      return NextResponse.json({ error: 'Missing order_id in payload' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Create or get the webhook event using an atomic INSERT ON CONFLICT
    // Since Supabase RPC handles this better, we'll manually insert and catch duplicate.
    const { data: existingEvent, error: fetchError } = await supabase
      .from('webhook_events')
      .select('id, status, attempt_count')
      .eq('event_id', eventId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError
    }

    if (existingEvent) {
      if (existingEvent.status === 'processed') {
        // Idempotent duplicate success
        return NextResponse.json({ received: true })
      }

      // Increment attempt count
      await supabase
        .from('webhook_events')
        .update({
          status: 'processing',
          attempt_count: existingEvent.attempt_count + 1,
        })
        .eq('id', existingEvent.id)
    } else {
      // Insert new
      const { error: insertError } = await supabase.from('webhook_events').insert({
        event_id: eventId,
        event_type: eventType,
        payload: payload, // careful with logging this in production
        status: 'processing',
        attempt_count: 1,
      })

      if (insertError) {
        // If it's a unique violation, someone else inserted it, we can just return 200 or retry
        if (insertError.code === '23505') return NextResponse.json({ received: true })
        throw insertError
      }
    }

    // Now process the event
    let success = false
    try {
      if (eventType === 'payment.captured' || eventType === 'order.paid') {
        if (!razorpayPaymentId || !amountPaise || !currency) {
          throw new Error('Missing payment details for capture event')
        }

        const result = await onlineCheckoutRepository.confirmPaymentAtomic(
          razorpayOrderId,
          razorpayPaymentId,
          amountPaise,
          currency,
        )

        if (result.success) {
          success = true
        } else {
          throw new Error(result.error || 'Unknown confirmation error')
        }
      } else if (eventType === 'payment.failed') {
        if (!razorpayPaymentId || !amountPaise) {
          throw new Error('Missing payment details for failed event')
        }

        // We only record the failed attempt, we DO NOT release stock or fail the order yet.
        const recorded = await onlineCheckoutRepository.recordPaymentAttemptAtomic(
          razorpayOrderId,
          razorpayPaymentId,
          'failed',
          amountPaise,
        )
        success = recorded
      }

      if (success) {
        await supabase
          .from('webhook_events')
          .update({ status: 'processed', processed_at: new Date().toISOString() })
          .eq('event_id', eventId)

        return NextResponse.json({ received: true })
      }
    } catch (processError: any) {
      // Update webhook event to failed
      await supabase
        .from('webhook_events')
        .update({ status: 'failed', last_error: processError.message })
        .eq('event_id', eventId)

      return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
    }

    return NextResponse.json({ error: 'Failed to process' }, { status: 500 })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
