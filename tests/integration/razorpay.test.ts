import { describe, it, expect, vi, beforeEach } from 'vitest'
vi.mock('server-only', () => ({}))
import {
  verifyRazorpaySignature,
  verifyWebhookSignature,
} from '@/lib/razorpay/razorpay-signature.server'
import crypto from 'crypto'

describe('Razorpay Server Utils', () => {
  beforeEach(() => {
    process.env.RAZORPAY_KEY_SECRET = 'test_secret'
    process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret'
  })

  describe('verifyRazorpaySignature', () => {
    it('verifies a valid signature', () => {
      const orderId = 'order_123'
      const paymentId = 'pay_123'

      const signature = crypto
        .createHmac('sha256', 'test_secret')
        .update(orderId + '|' + paymentId)
        .digest('hex')

      expect(verifyRazorpaySignature(orderId, paymentId, signature)).toBe(true)
    })

    it('rejects an invalid signature', () => {
      const orderId = 'order_123'
      const paymentId = 'pay_123'
      const signature = 'invalid_signature'

      expect(verifyRazorpaySignature(orderId, paymentId, signature)).toBe(false)
    })
  })

  describe('verifyWebhookSignature', () => {
    it('verifies a valid webhook signature', () => {
      const rawBody = JSON.stringify({ event: 'payment.captured' })

      const signature = crypto
        .createHmac('sha256', 'test_webhook_secret')
        .update(rawBody)
        .digest('hex')

      expect(verifyWebhookSignature(rawBody, signature)).toBe(true)
    })

    it('rejects an invalid webhook signature', () => {
      const rawBody = JSON.stringify({ event: 'payment.captured' })
      const signature = 'invalid_signature'

      expect(verifyWebhookSignature(rawBody, signature)).toBe(false)
    })
  })
})
