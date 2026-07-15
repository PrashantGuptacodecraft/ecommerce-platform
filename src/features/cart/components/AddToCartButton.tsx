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

import { motion, AnimatePresence } from 'framer-motion'
import { CheckIcon } from '@/components/ui/icons'

function SubmitButton({ disabled, isSuccess }: { disabled: boolean; isSuccess: boolean }) {
  const { pending } = useFormStatus()
  
  return (
    <Button
      type="submit"
      disabled={disabled || pending}
      className="relative w-full h-14 text-lg overflow-hidden"
      data-testid="add-to-cart-button"
    >
      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="absolute inset-0 flex items-center justify-center gap-2 bg-green-600 text-white"
          >
            <CheckIcon className="size-5" />
            <span>Added to Cart</span>
          </motion.div>
        ) : pending ? (
          <motion.span
            key="pending"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            Adding...
          </motion.span>
        ) : (
          <motion.span
            key="default"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            Add to Cart
          </motion.span>
        )}
      </AnimatePresence>
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

      <SubmitButton disabled={disabled} isSuccess={state.success} />

      {state.error && (
        <div className="mt-3">
          <FormError>{mapCartError(state.error)}</FormError>
        </div>
      )}
    </form>
  )
}
