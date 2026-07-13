'use client'

type ProductPricingSectionProps = {
  basePriceRupees: string
  compareAtPriceRupees: string
  onChange: (name: string, value: string) => void
}

export function ProductPricingSection({
  basePriceRupees,
  compareAtPriceRupees,
  onChange,
}: ProductPricingSectionProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200 space-y-4">
      <h2 className="text-lg font-semibold text-ink">Pricing (₹)</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="base_price_rupees" className="block text-sm font-medium text-ink mb-1">
            Price *
          </label>
          <input
            id="base_price_rupees"
            name="base_price_rupees"
            type="number"
            step="0.01"
            min="0"
            required
            value={basePriceRupees}
            onChange={(e) => onChange('base_price_rupees', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 min-h-[44px] text-sm focus:ring-ink focus:border-ink"
            placeholder="0.00"
          />
        </div>

        <div>
          <label
            htmlFor="compare_at_price_rupees"
            className="block text-sm font-medium text-ink mb-1"
          >
            Compare at Price (Optional)
          </label>
          <input
            id="compare_at_price_rupees"
            name="compare_at_price_rupees"
            type="number"
            step="0.01"
            min="0"
            value={compareAtPriceRupees}
            onChange={(e) => onChange('compare_at_price_rupees', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 min-h-[44px] text-sm focus:ring-ink focus:border-ink"
            placeholder="0.00"
          />
          <p className="mt-1 text-xs text-gray-500">
            Must be greater than or equal to the actual price.
          </p>
        </div>
      </div>
    </div>
  )
}
