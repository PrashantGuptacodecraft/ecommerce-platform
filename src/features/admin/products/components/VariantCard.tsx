'use client'

import { type VariantNode } from './VariantCombinationList'

type VariantCardProps = {
  variant: VariantNode
  label: string
  onChange: (variant: VariantNode) => void
  duplicateSku: boolean
}

export function VariantCard({ variant, label, onChange, duplicateSku }: VariantCardProps) {
  const handlePriceChange = (rupeesStr: string) => {
    if (!rupeesStr) {
      onChange({ ...variant, priceAdjustmentPaise: 0 })
      return
    }
    const paise = Math.round(parseFloat(rupeesStr) * 100)
    if (!isNaN(paise)) {
      onChange({ ...variant, priceAdjustmentPaise: paise })
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-md p-4 md:p-0 md:border-none md:bg-transparent flex flex-col md:grid md:grid-cols-12 md:gap-4 md:items-center">
      {/* Mobile Title */}
      <div className="md:hidden font-medium text-ink mb-3">{label}</div>

      {/* Desktop Title */}
      <div className="hidden md:block col-span-3 font-medium text-ink truncate px-4" title={label}>
        {label}
      </div>

      <div className="md:col-span-3 mb-3 md:mb-0">
        <label className="block md:hidden text-xs font-medium text-gray-500 mb-1">SKU</label>
        <input
          type="text"
          value={variant.sku}
          onChange={(e) => {
            const normalized = e.target.value
              .trim()
              .toUpperCase()
              .replace(/[^A-Z0-9-]/g, '')
            onChange({ ...variant, sku: normalized })
          }}
          placeholder="SKU"
          maxLength={100}
          className={`w-full border ${duplicateSku ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-ink focus:ring-ink'} rounded-md px-3 min-h-[44px] md:min-h-[36px] text-sm bg-white`}
        />
        {duplicateSku && <p className="text-red-600 text-xs mt-1 md:hidden">Duplicate SKU</p>}
      </div>

      <div className="md:col-span-2 mb-3 md:mb-0">
        <label className="block md:hidden text-xs font-medium text-gray-500 mb-1">
          Price Adj. (₹)
        </label>
        <input
          type="number"
          step="0.01"
          value={
            variant.priceAdjustmentPaise ? (variant.priceAdjustmentPaise / 100).toFixed(2) : ''
          }
          onChange={(e) => handlePriceChange(e.target.value)}
          placeholder="0.00"
          className="w-full border border-gray-300 rounded-md px-3 min-h-[44px] md:min-h-[36px] text-sm focus:ring-ink focus:border-ink bg-white"
        />
      </div>

      <div className="md:col-span-2 mb-3 md:mb-0 flex items-center h-[44px] md:h-[36px] px-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-500 cursor-not-allowed">
        <label className="md:hidden text-xs font-medium text-gray-500 mr-2">Stock:</label>
        {variant.stockQuantity}
      </div>

      <div className="md:col-span-2 flex items-center md:justify-end pr-4">
        <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
          <input
            type="checkbox"
            checked={variant.isActive}
            onChange={(e) => onChange({ ...variant, isActive: e.target.checked })}
            className="rounded border-gray-300 text-ink focus:ring-ink w-4 h-4"
          />
          <span className="text-sm font-medium text-ink md:hidden">Active</span>
        </label>
      </div>
    </div>
  )
}
