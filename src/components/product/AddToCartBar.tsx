'use client'

import { cn } from '@/lib/utilities/cn'
import { formatPaise } from '@/lib/utilities/money'
import { Button } from '@/components/ui'
import type { ProductVariant } from '@/features/products/types'

import { AddToCartButton } from '@/features/cart/components/AddToCartButton'

type AddToCartBarProps = {
  selectedVariant: ProductVariant | null
  basePricePaise: number
}

/**
 * Sticky add-to-cart bar for mobile. Non-sticky (inline) on desktop.
 */
export function AddToCartBar({ selectedVariant, basePricePaise }: AddToCartBarProps) {
  const price = selectedVariant
    ? basePricePaise + selectedVariant.priceAdjustmentPaise
    : basePricePaise

  const noVariant = selectedVariant === null

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

        {noVariant ? (
          <Button size="lg" disabled className="flex-1 md:flex-none md:px-8">
            Select options
          </Button>
        ) : (
          <div className="flex-1 md:flex-none">
            <AddToCartButton
              variantId={selectedVariant.id}
              stockQuantity={selectedVariant.stockQuantity}
              isActive={selectedVariant.isActive}
              className="w-full"
            />
          </div>
        )}
      </div>
    </div>
  )
}
