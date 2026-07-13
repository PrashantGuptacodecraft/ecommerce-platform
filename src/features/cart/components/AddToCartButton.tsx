'use client'

import { useState, useRef, useEffect } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
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

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      disabled={disabled || pending}
      className="w-full h-14 text-lg"
      data-testid="add-to-cart-button"
    >
      {pending ? 'Adding...' : 'Add to Cart'}
    </Button>
  )
}

export function AddToCartButton({
  variantId,
  stockQuantity,
  isActive,
  className,
}: AddToCartButtonProps) {
  const [state, formAction] = useFormState(addCartItemAction, { success: false })
  const pendingIdempotencyKeyRef = useRef<string | null>(null)
  const [currentIdempotencyKey, setCurrentIdempotencyKey] = useState<string>('')

  useEffect(() => {
    if (state.success) {
      pendingIdempotencyKeyRef.current = null
      setCurrentIdempotencyKey(crypto.randomUUID())
    }
  }, [state.success])

  useEffect(() => {
    if (!pendingIdempotencyKeyRef.current) {
      pendingIdempotencyKeyRef.current = crypto.randomUUID()
    }
    setCurrentIdempotencyKey(pendingIdempotencyKeyRef.current)
  }, [])

  const disabled = !isActive || stockQuantity === 0 || !variantId

  return (
    <form action={formAction} className={className}>
      <input type="hidden" name="variantId" value={variantId || ''} />
      <input type="hidden" name="quantity" value="1" />
      <input type="hidden" name="idempotencyKey" value={currentIdempotencyKey} />

      <SubmitButton disabled={disabled} />

      {state.error && (
        <div className="mt-3">
          <FormError>{mapCartError(state.error)}</FormError>
        </div>
      )}
    </form>
  )
}
