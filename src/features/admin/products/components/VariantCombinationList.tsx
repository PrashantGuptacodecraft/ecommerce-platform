'use client'

import { type OptionGroup } from './OptionGroupEditor'
import { VariantCard } from './VariantCard'

export type VariantNode = {
  id: string
  sku: string
  priceAdjustmentPaise: number
  stockQuantity: number
  isActive: boolean
  optionValueIds: string[]
  imageId: string | null
}

type VariantCombinationListProps = {
  options: OptionGroup[]
  variants: VariantNode[]
  onChange: (variants: VariantNode[]) => void
}

export function VariantCombinationList({
  options,
  variants,
  onChange,
}: VariantCombinationListProps) {
  const handleVariantChange = (index: number, updatedVariant: VariantNode) => {
    const newVariants = [...variants]
    newVariants[index] = updatedVariant
    onChange(newVariants)
  }

  // Duplicate SKU check
  const skuList = variants.map((v) => v.sku.trim().toLowerCase()).filter(Boolean)
  const hasDuplicateSku = (sku: string, index: number) => {
    const normalized = sku.trim().toLowerCase()
    if (!normalized) return false
    return (
      skuList.indexOf(normalized) !== skuList.lastIndexOf(normalized) &&
      skuList.indexOf(normalized) !== index
    ) // well, simpler:
  }

  const isDuplicateSku = (sku: string, index: number) => {
    const normalized = sku.trim().toLowerCase()
    if (!normalized) return false
    return (
      variants.findIndex((v, i) => i !== index && v.sku.trim().toLowerCase() === normalized) !== -1
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-ink">
          Variant Combinations ({variants.length})
        </h3>
      </div>

      <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-xs font-medium text-gray-500 uppercase tracking-wider">
        <div className="col-span-3">Variant</div>
        <div className="col-span-3">SKU</div>
        <div className="col-span-2">Price Adj. (₹)</div>
        <div className="col-span-2">Stock</div>
        <div className="col-span-2 text-right">Status</div>
      </div>

      <div className="space-y-4 md:space-y-2">
        {variants.map((variant, i) => {
          // Resolve the names of the option values for this combination
          const combinationNames = variant.optionValueIds.map((valId) => {
            for (const opt of options) {
              const match = opt.values.find((v) => v.id === valId)
              if (match) return match.value || 'Unset'
            }
            return 'Unknown'
          })

          const combinationLabel = combinationNames.join(' / ')

          return (
            <VariantCard
              key={variant.id}
              variant={variant}
              label={combinationLabel}
              onChange={(updated) => handleVariantChange(i, updated)}
              duplicateSku={isDuplicateSku(variant.sku, i)}
            />
          )
        })}

        {variants.length === 0 && (
          <div className="text-center p-8 text-gray-500 text-sm border border-dashed border-gray-300 rounded-md">
            No valid combinations generated. Add option values above.
          </div>
        )}
      </div>
    </div>
  )
}
