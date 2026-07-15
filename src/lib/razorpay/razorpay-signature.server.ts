import 'server-only'
import crypto from 'crypto'

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!secret) {
    console.error('RAZORPAY_KEY_SECRET is not set — rejecting signature verification')
    return false
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(orderId + '|' + paymentId)
      .digest('hex')

    // Timing-safe comparison is best practice
    return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) {
    console.error('RAZORPAY_WEBHOOK_SECRET is not set — rejecting webhook verification')
    return false
  }

  try {
    const expectedSignature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')

    return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))
  } catch (error) {
    console.error('Webhook signature verification error:', error)
    return false
  }
}
