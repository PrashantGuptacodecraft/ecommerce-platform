'use client'

type ProductStateSectionProps = {
  isActive: boolean
  isFeatured: boolean
  isNewArrival: boolean
  isNewProduct: boolean
  onChange: (name: string, value: boolean) => void
}

export function ProductStateSection({
  isActive,
  isFeatured,
  isNewArrival,
  isNewProduct,
  onChange,
}: ProductStateSectionProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200 space-y-4">
      <h2 className="text-lg font-semibold text-ink">Status & Tags</h2>

      <div>
        <label htmlFor="is_active" className="block text-sm font-medium text-ink mb-1">
          Product Status
        </label>
        {isNewProduct ? (
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border border-gray-200">
            This product will be saved as <strong>Inactive</strong> initially. You can activate it
            after saving.
          </div>
        ) : (
          <select
            id="is_active"
            name="is_active"
            value={String(isActive)}
            onChange={(e) => onChange('is_active', e.target.value === 'true')}
            className="w-full border border-gray-300 rounded-md px-3 min-h-[44px] text-sm focus:ring-ink focus:border-ink bg-white"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        )}
      </div>

      <div className="pt-2">
        <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
          <input
            type="checkbox"
            name="is_featured"
            checked={isFeatured}
            onChange={(e) => onChange('is_featured', e.target.checked)}
            className="rounded border-gray-300 text-ink focus:ring-ink w-4 h-4"
          />
          <span className="text-sm font-medium text-ink">Featured Product</span>
        </label>
      </div>

      <div>
        <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
          <input
            type="checkbox"
            name="is_new_arrival"
            checked={isNewArrival}
            onChange={(e) => onChange('is_new_arrival', e.target.checked)}
            className="rounded border-gray-300 text-ink focus:ring-ink w-4 h-4"
          />
          <span className="text-sm font-medium text-ink">New Arrival</span>
        </label>
      </div>
    </div>
  )
}
