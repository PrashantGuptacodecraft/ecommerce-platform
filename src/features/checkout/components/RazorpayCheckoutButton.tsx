'use client'

import { useEffect, useRef, useState } from 'react'
import { verifyRazorpayCallbackAction } from '../online-checkout.actions'

export function RazorpayCheckoutButton({
  orderData,
  onSuccess,
  onError,
  isPending,
}: {
  orderData: {
    razorpayOrderId: string
    amountPaise: number
    currency: string
    keyId: string
    name?: string
    email?: string
    phone?: string
    receipt?: string
  }
  onSuccess: (orderNumber?: string) => void
  onError: (error: string) => void
  isPending: boolean
}) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const hasOpenedRef = useRef(false)
  const onSuccessRef = useRef(onSuccess)
  const onErrorRef = useRef(onError)
  const scriptRef = useRef<HTMLScriptElement | null>(null)

  useEffect(() => {
    onSuccessRef.current = onSuccess
    onErrorRef.current = onError
  }, [onSuccess, onError])

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => setIsScriptLoaded(true)
    script.onerror = () => onErrorRef.current('Failed to load Razorpay SDK')
    scriptRef.current = script
    document.body.appendChild(script)

    return () => {
      if (scriptRef.current && scriptRef.current.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isScriptLoaded || hasOpenedRef.current) return
    hasOpenedRef.current = true

    const options = {
      key: orderData.keyId,
      amount: orderData.amountPaise,
      currency: orderData.currency,
      name: 'Studio Noir',
      description: 'Order Payment',
      order_id: orderData.razorpayOrderId,
      prefill: {
        name: orderData.name,
        email: orderData.email,
        contact: orderData.phone,
      },
      handler: async function (response: any) {
        const result = await verifyRazorpayCallbackAction(
          response.razorpay_order_id,
          response.razorpay_payment_id,
          response.razorpay_signature,
          orderData.amountPaise,
        )

        if (result.success) {
          onSuccessRef.current()
        } else {
          onErrorRef.current(result.error || 'Payment verification failed')
        }
      },
      modal: {
        ondismiss: function () {
          onErrorRef.current('Payment cancelled by user')
        },
      },
    }

    const rzp = new (window as any).Razorpay(options)
    rzp.open()
  }, [isScriptLoaded, orderData])

  return (
    <div className="w-full text-center">
      <p className="text-sm text-neutral-600">Opening secure payment gateway...</p>
    </div>
  )
}
