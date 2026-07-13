'use client'

import { useState, useTransition, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { formatPaise } from '@/lib/utilities/money'
import { getProductImageUrl } from '@/lib/utilities/supabase-image'
import { mapCartError } from '../errors'
import { updateCartItemQuantityAction, removeCartItemAction } from '../actions'
import { TrashIcon } from '@/components/ui/icons'
import { FormError } from '@/components/ui/FormError'
import type { CartItemDetail } from '../queries'

export function CartLineItem({ item }: { item: CartItemDetail }) {
  const [isPending, setIsPending] = useState(false)
  const [quantity, setQuantity] = useState(item.quantity)
  const [error, setError] = useState<string | null>(null)

  // Sync state with props in case it updates from another component
  useEffect(() => {
    setQuantity(item.quantity)
  }, [item.quantity])

  const handleQuantityChange = async (newQty: number) => {
    if (newQty < 1 || newQty > 99) return
    setQuantity(newQty)
    setError(null)
    setIsPending(true)

    try {
      const formData = new FormData()
      formData.append('variantId', item.variant_id)
      formData.append('quantity', newQty.toString())

      const res = await updateCartItemQuantityAction({ success: false }, formData)
      if (!res.success && res.error) {
        setError(mapCartError(res.error))
        setQuantity(item.quantity) // revert
      }
    } finally {
      setIsPending(false)
    }
  }

  const handleRemove = async () => {
    setError(null)
    setIsPending(true)

    try {
      const formData = new FormData()
      formData.append('variantId', item.variant_id)

      const res = await removeCartItemAction({ success: false }, formData)
      if (!res.success && res.error) {
        setError(mapCartError(res.error))
      }
    } finally {
      setIsPending(false)
    }
  }

  const isUnavailable = item.state === 'unavailable'
  const isOutOfStock = item.state === 'out_of_stock'
  const isDisabled = isUnavailable || isOutOfStock || isPending

  return (
    <div
      className={`flex gap-4 py-4 border-b border-fog ${isUnavailable ? 'opacity-50 grayscale' : ''}`}
    >
      {/* Image */}
      <div className="shrink-0 w-20 h-24 relative bg-paper rounded overflow-hidden">
        {item.variant.image_url ? (
          <Image
            src={getProductImageUrl(item.variant.image_url)!}
            alt={item.product.name}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-fog text-mist text-xs">
            No img
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 flex flex-col justify-between">
        <div className="flex justify-between items-start gap-2">
          <div>
            <Link
              href={`/product/${item.product.slug}`}
              className="text-sm font-medium text-ink hover:underline line-clamp-1"
            >
              {item.product.name}
            </Link>
            <div className="text-xs text-mist mt-1 space-y-0.5">
              {item.variant.options.map((opt, i) => (
                <p key={i}>
                  {opt.name}: {opt.value}
                </p>
              ))}
            </div>
          </div>
          <button
            onClick={handleRemove}
            disabled={isPending}
            className="text-mist hover:text-danger transition-colors p-1"
            aria-label="Remove item"
          >
            <TrashIcon className="size-4" />
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center border border-fog rounded h-8">
            <button
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={isDisabled || quantity <= 1}
              className="w-8 h-full flex items-center justify-center text-ink disabled:opacity-50"
              aria-label="Decrease quantity"
            >
              -
            </button>
            <span className="w-8 text-center text-sm font-medium text-ink flex items-center justify-center border-x border-fog h-full">
              {quantity}
            </span>
            <button
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={isDisabled || quantity >= item.variant.stock_quantity || quantity >= 99}
              className="w-8 h-full flex items-center justify-center text-ink disabled:opacity-50"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <div className="text-right">
            {!isUnavailable && !isOutOfStock ? (
              <span className="font-semibold text-ink text-sm">
                {formatPaise(item.lineTotalPaise)}
              </span>
            ) : null}
          </div>
        </div>

        {(error || item.state !== 'available') && (
          <div className="mt-2 text-xs">
            {error ? <FormError>{error}</FormError> : null}
            {!error && item.state === 'out_of_stock' && (
              <span className="text-danger">Out of stock</span>
            )}
            {!error && item.state === 'insufficient_stock' && (
              <span className="text-warning">Only {item.variant.stock_quantity} remaining</span>
            )}
            {!error && item.state === 'unavailable' && (
              <span className="text-mist">Currently unavailable</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
