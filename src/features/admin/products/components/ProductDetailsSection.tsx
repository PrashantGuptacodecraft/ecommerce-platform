'use client'

type ProductDetailsSectionProps = {
  shortDescription: string
  fullDescription: string
  fabric: string
  fit: string
  careInstructions: string
  sizeChart: string
  onChange: (name: string, value: string) => void
}

export function ProductDetailsSection({
  shortDescription,
  fullDescription,
  fabric,
  fit,
  careInstructions,
  sizeChart,
  onChange,
}: ProductDetailsSectionProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200 space-y-4">
      <h2 className="text-lg font-semibold text-ink">Product Details</h2>

      <div>
        <label htmlFor="short_description" className="block text-sm font-medium text-ink mb-1">
          Short Description *
        </label>
        <textarea
          id="short_description"
          name="short_description"
          required
          maxLength={150}
          value={shortDescription}
          onChange={(e) => onChange('short_description', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-ink focus:border-ink min-h-[66px]"
          placeholder="Brief summary for listings (max 150 chars)"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-ink mb-1">
          Full Description
        </label>
        <textarea
          id="description"
          name="description"
          value={fullDescription}
          onChange={(e) => onChange('description', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-ink focus:border-ink min-h-[132px]"
          placeholder="Detailed description"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="fabric" className="block text-sm font-medium text-ink mb-1">
            Fabric
          </label>
          <input
            id="fabric"
            name="fabric"
            type="text"
            value={fabric}
            onChange={(e) => onChange('fabric', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 min-h-[44px] text-sm focus:ring-ink focus:border-ink"
            placeholder="e.g. 100% Linen"
          />
        </div>

        <div>
          <label htmlFor="fit" className="block text-sm font-medium text-ink mb-1">
            Fit
          </label>
          <input
            id="fit"
            name="fit"
            type="text"
            value={fit}
            onChange={(e) => onChange('fit', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 min-h-[44px] text-sm focus:ring-ink focus:border-ink"
            placeholder="e.g. Relaxed Fit"
          />
        </div>
      </div>

      <div>
        <label htmlFor="care_instructions" className="block text-sm font-medium text-ink mb-1">
          Care Instructions
        </label>
        <input
          id="care_instructions"
          name="care_instructions"
          type="text"
          value={careInstructions}
          onChange={(e) => onChange('care_instructions', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 min-h-[44px] text-sm focus:ring-ink focus:border-ink"
          placeholder="e.g. Machine wash cold"
        />
      </div>

      <div>
        <label htmlFor="size_chart" className="block text-sm font-medium text-ink mb-1">
          Size Chart Name
        </label>
        <input
          id="size_chart"
          name="size_chart"
          type="text"
          value={sizeChart}
          onChange={(e) => onChange('size_chart', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 min-h-[44px] text-sm focus:ring-ink focus:border-ink"
          placeholder="e.g. top_adult"
        />
      </div>
    </div>
  )
}
