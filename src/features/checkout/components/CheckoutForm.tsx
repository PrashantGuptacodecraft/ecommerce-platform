'use client'

import { useActionState, useEffect, useState, startTransition } from 'react'
import { submitCheckoutAction } from '@/features/checkout/actions'
import { submitOnlineCheckoutAction } from '@/features/checkout/online-checkout.actions'
import { CheckoutAddressFields } from './CheckoutAddressFields'
import { getCheckoutErrorMessage } from '@/features/checkout/errors'
import { Button } from '@/components/ui'
import { useRouter } from 'next/navigation'
import { PaymentMethodSelector } from './PaymentMethodSelector'
import { RazorpayCheckoutButton } from './RazorpayCheckoutButton'
import { OnlinePaymentStatus } from './OnlinePaymentStatus'

export function CheckoutForm({
  cartFingerprint,
  expectedTotalPaise,
}: {
  cartFingerprint: string
  expectedTotalPaise: number
}) {
  const router = useRouter()
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>('razorpay')
  const [codState, codAction, isCodPending] = useActionState(submitCheckoutAction, {
    success: false,
  })
  const [rzpState, rzpAction, isRzpPending] = useActionState(submitOnlineCheckoutAction, {
    success: false,
  })
  const [idempotencyKey] = useState(() => crypto.randomUUID())
  const [showStatus, setShowStatus] = useState(false)
  const [localOrderNumber, setLocalOrderNumber] = useState<string | null>(null)

  const isPending = isCodPending || isRzpPending

  useEffect(() => {
    if (codState.success && codState.orderNumber) {
      router.push(`/checkout/success/${codState.orderNumber}`)
    }
  }, [codState, router])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.append('idempotencyKey', idempotencyKey)
    formData.append('paymentMethod', paymentMethod)

    // Create a payload hash from address + cart fingerprint
    const addressString = `${formData.get('name')}|${formData.get('email')}|${formData.get('phone')}|${formData.get('addressLine1')}|${formData.get('postalCode')}`
    const payloadHash = btoa(encodeURIComponent(`${addressString}|${cartFingerprint}`))
    formData.append('payloadHash', payloadHash)

    startTransition(() => {
      if (paymentMethod === 'cod') {
        codAction(formData)
      } else {
        rzpAction(formData)
      }
    })
  }

  // If Razorpay order created, show modal
  if (rzpState.success && rzpState.razorpayOrderId && !showStatus) {
    return (
      <RazorpayCheckoutButton
        orderData={{
          razorpayOrderId: rzpState.razorpayOrderId,
          amountPaise: rzpState.amountPaise!,
          currency: rzpState.currency!,
          keyId: rzpState.keyId!,
          name: rzpState.name,
          email: rzpState.email,
          phone: rzpState.phone,
          receipt: rzpState.receipt,
        }}
        isPending={isPending}
        onSuccess={() => {
          // TODO: have the server action return orderNumber directly instead of deriving from receipt
          setLocalOrderNumber(rzpState.receipt!.replace('-RZP', ''))
          setShowStatus(true)
        }}
        onError={(err) => {
          // Could handle error display or let user retry
          alert(`Payment issue: ${err}`)
          window.location.reload()
        }}
      />
    )
  }

  if (showStatus && localOrderNumber) {
    return <OnlinePaymentStatus orderNumber={localOrderNumber} />
  }

  const activeState = paymentMethod === 'cod' ? codState : rzpState

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-xl font-medium tracking-tight">Shipping Address</h2>
        <CheckoutAddressFields errors={activeState.fieldErrors} />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-medium tracking-tight">Payment Method</h2>

        <input type="hidden" name="expectedTotalPaise" value={expectedTotalPaise} />
        <PaymentMethodSelector selectedMethod={paymentMethod} onChange={setPaymentMethod} />
      </div>

      {activeState.error && (
        <div className="p-4 text-sm text-red-800 bg-red-50 rounded-md">
          {getCheckoutErrorMessage(activeState.error)}
        </div>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending
          ? 'Processing...'
          : paymentMethod === 'razorpay'
            ? 'Pay Securely'
            : 'Place Order'}
      </Button>
    </form>
  )
}
