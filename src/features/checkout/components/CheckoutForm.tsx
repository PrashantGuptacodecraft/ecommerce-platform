'use client'

import { useActionState, useEffect, useState, startTransition } from 'react'
import { submitCheckoutAction } from '@/features/checkout/actions'
import { CheckoutAddressFields } from './CheckoutAddressFields'
import { getCheckoutErrorMessage } from '@/features/checkout/errors'
import { Button } from '@/components/ui'
import { useRouter } from 'next/navigation'

export function CheckoutForm({
  cartFingerprint,
  expectedTotalPaise,
}: {
  cartFingerprint: string
  expectedTotalPaise: number
}) {
  const router = useRouter()
  const [state, action, isPending] = useActionState(submitCheckoutAction, { success: false })
  const [idempotencyKey] = useState(() => crypto.randomUUID())

  useEffect(() => {
    if (state.success && state.orderNumber) {
      router.push(`/order/success/${state.orderNumber}`)
    }
  }, [state, router])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.append('idempotencyKey', idempotencyKey)

    // Create a payload hash from address + cart fingerprint
    const addressString = `${formData.get('name')}|${formData.get('email')}|${formData.get('phone')}|${formData.get('addressLine1')}|${formData.get('postalCode')}`
    const payloadHash = btoa(encodeURIComponent(`${addressString}|${cartFingerprint}`))
    formData.append('payloadHash', payloadHash)

    startTransition(() => {
      action(formData)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-xl font-medium tracking-tight">Shipping Address</h2>
        <CheckoutAddressFields errors={state.fieldErrors} />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-medium tracking-tight">Payment Method</h2>
        <div className="p-4 border rounded-md bg-neutral-50/50">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input type="hidden" name="payloadHash" value={cartFingerprint} />
            <input type="hidden" name="expectedTotalPaise" value={expectedTotalPaise} />
            <input
              type="radio"
              name="paymentMethod"
              value="cod"
              defaultChecked
              className="w-4 h-4 text-neutral-900 border-neutral-300 focus:ring-neutral-900"
            />
            <span className="font-medium text-sm">Cash on Delivery (COD)</span>
          </label>
        </div>
      </div>

      {state.error && (
        <div className="p-4 text-sm text-red-800 bg-red-50 rounded-md">
          {getCheckoutErrorMessage(state.error)}
        </div>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Processing...' : 'Place Order'}
      </Button>
    </form>
  )
}
