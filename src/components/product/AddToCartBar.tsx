'use client'

import { cn } from '@/lib/utilities/cn'
import { formatPaise } from '@/lib/utilities/money'
import { Button } from '@/components/ui'
import type { ProductVariant } from '@/features/products/types'

type AddToCartBarProps = {
  selectedVariant: ProductVariant | null
  basePricePaise: number
  /**
   * Milestone 5 will provide this callback to wire real cart behaviour.
   * Until then, the button is non-functional (clearly labelled).
   */
  onAddToCart?: (variant: ProductVariant) => void
}

/**
 * Sticky add-to-cart bar for mobile. Non-sticky (inline) on desktop.
 *
 * Milestone 4 scope: read-only. The button does NOT fake a cart action, persist
 * data, show a success toast, decrement stock, or call any endpoint. It is
 * clearly labelled as not-yet-functional.
 *
 * Milestone 5 wires real cart behaviour by passing onAddToCart.
 */
export function AddToCartBar({ selectedVariant, basePricePaise, onAddToCart }: AddToCartBarProps) {
  const price = selectedVariant
    ? basePricePaise + selectedVariant.priceAdjustmentPaise
    : basePricePaise

  const isCartWired = typeof onAddToCart === 'function'
  const hasStock = selectedVariant !== null && selectedVariant.stockQuantity > 0
  const noVariant = selectedVariant === null

  let buttonLabel: string
  let disabled: boolean

  if (noVariant) {
    buttonLabel = 'Select options'
    disabled = true
  } else if (selectedVariant.stockQuantity <= 0) {
    buttonLabel = 'Out of stock'
    disabled = true
  } else if (!isCartWired) {
    buttonLabel = 'Add to Cart — Coming Soon'
    disabled = true
  } else {
    buttonLabel = 'Add to Cart'
    disabled = false
  }

  const handleClick = () => {
    if (isCartWired && selectedVariant && hasStock) {
      onAddToCart(selectedVariant)
    }
  }

  return (
    <div
      className={cn(
        // Mobile: sticky bottom bar
        'fixed inset-x-0 bottom-0 z-[var(--z-header)] border-t border-fog bg-paper px-4 py-3',
        // Desktop: inline, not sticky
        'md:static md:z-auto md:border-t-0 md:bg-transparent md:px-0 md:py-0',
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-4">
        <span className="text-lg font-medium tabular-nums text-ink">{formatPaise(price)}</span>
        <Button
          size="lg"
          className="flex-1 md:flex-none md:px-8"
          disabled={disabled}
          onClick={handleClick}
          aria-disabled={disabled}
        >
          {buttonLabel}
        </Button>
      </div>
    </div>
  )
}
