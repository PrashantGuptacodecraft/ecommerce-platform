'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { checkOrderStatusAction } from '../order-status.action'

export function OnlinePaymentStatus({ orderNumber }: { orderNumber: string }) {
  const router = useRouter()
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'failed'>('pending')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    const doPoll = async () => {
      const result = await checkOrderStatusAction(orderNumber)

      if (!mountedRef.current) return

      if (result.status === 'CONFIRMED') {
        setStatus('confirmed')
        router.push(`/checkout/success/${orderNumber}`)
      } else if (result.status === 'PAYMENT_FAILED') {
        setStatus('failed')
      } else {
        timeoutRef.current = setTimeout(doPoll, 3000)
      }
    }
    
    doPoll()

    return () => {
      mountedRef.current = false
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [orderNumber, router])

  return (
    <div className="w-full p-8 text-center bg-neutral-50 rounded-md border">
      <h3 className="text-lg font-medium mb-2">
        {status === 'pending' && 'Payment received, confirming...'}
        {status === 'confirmed' && 'Payment confirmed! Redirecting...'}
        {status === 'failed' && 'Payment failed. Please try again.'}
      </h3>
      {status === 'pending' && (
        <p className="text-sm text-neutral-500">
          Waiting for secure confirmation from the payment provider. Do not close this window.
        </p>
      )}
      {status === 'failed' && (
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-neutral-900 text-white text-sm rounded-md"
        >
          Try Again
        </button>
      )}
    </div>
  )
}
