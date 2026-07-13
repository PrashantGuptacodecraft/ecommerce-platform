'use client'

import { useState, useTransition, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { addCartItemAction } from '../actions'
import { mapCartError } from '../errors'
import { FormError } from '@/components/ui/FormError'

type AddToCartButtonProps = {
  variantId: string | null
  stockQuantity: number | null
  isActive: boolean
  className?: string
}

export function AddToCartButton({
  variantId,
  stockQuantity,
  isActive,
  className,
}: AddToCartButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const pendingIdempotencyKeyRef = useRef<string | null>(null)

  const handleAdd = () => {
    if (!variantId) {
      setError('Please select a variant before adding to cart.')
      return
    }

    if (!isActive) {
      setError('This product is no longer available.')
      return
    }

    if (stockQuantity === 0) {
      setError('This item is out of stock.')
      return
    }

    // Generate a new idempotency key if we don't already have one pending from a failed retry
    if (!pendingIdempotencyKeyRef.current) {
      pendingIdempotencyKeyRef.current = crypto.randomUUID()
    }
    const currentIdempotencyKey = pendingIdempotencyKeyRef.current

    setError(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.append('variantId', variantId)
      formData.append('quantity', '1')
      formData.append('idempotencyKey', currentIdempotencyKey)

      const res = await addCartItemAction({ success: false }, formData)

      if (res.success) {
        // Clear the key so the next click is a new intentional add
        pendingIdempotencyKeyRef.current = null
      } else if (res.error) {
        setError(mapCartError(res.error))
      }
    })
  }

  const disabled = !isActive || stockQuantity === 0 || isPending

  return (
    <div className={className}>
      <Button onClick={handleAdd} disabled={disabled} className="w-full h-14 text-lg">
        {isPending ? 'Adding...' : stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
      </Button>
      {error && (
        <div className="mt-3">
          <FormError>{error}</FormError>
        </div>
      )}
    </div>
  )
}
