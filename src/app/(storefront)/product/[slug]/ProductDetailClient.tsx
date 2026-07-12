'use client'

import { useState, useCallback } from 'react'
import { VariantSelector } from '@/components/product/VariantSelector'
import { AddToCartBar } from '@/components/product/AddToCartBar'
import { StockBadge } from '@/components/product/StockBadge'
import { SizeChart } from '@/components/product/SizeChart'
import type { ProductOption, ProductVariant } from '@/features/products/types'

type ProductDetailClientProps = {
  options: ProductOption[]
  variants: ProductVariant[]
  basePricePaise: number
  sizeChart: unknown
  productName: string
  totalStock: number
}

/**
 * Client boundary for the interactive parts of the product detail page:
 * variant selector, stock badge, size chart, and add-to-cart bar.
 *
 * Separated from the server page so the bulk of the PDP (gallery, metadata,
 * description, JSON-LD) remains a Server Component.
 */
export function ProductDetailClient({
  options,
  variants,
  basePricePaise,
  sizeChart,
  productName,
  totalStock,
}: ProductDetailClientProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)

  const handleVariantChange = useCallback(
    (variant: ProductVariant | null) => {
      setSelectedVariant(variant)
    },
    [],
  )

  return (
    <div className="space-y-5">
      {/* Overall stock badge (before variant selection) */}
      <StockBadge totalStock={totalStock} />

      {/* Variant selector */}
      {options.length > 0 && (
        <VariantSelector
          options={options}
          variants={variants}
          basePricePaise={basePricePaise}
          onVariantChange={handleVariantChange}
        />
      )}

      {/* Size chart */}
      <SizeChart sizeChart={sizeChart} productName={productName} />

      {/* Add to cart bar */}
      <AddToCartBar
        selectedVariant={selectedVariant}
        basePricePaise={basePricePaise}
      />
    </div>
  )
}
