import 'server-only'
import Razorpay from 'razorpay'

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error(
    '[RAZORPAY] ⚠️  RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not set. ' +
      'Using dummy keys — online payments WILL fail at runtime. ' +
      'Set the env vars before deploying to production.',
  )
}

export const razorpayClient = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret',
})
