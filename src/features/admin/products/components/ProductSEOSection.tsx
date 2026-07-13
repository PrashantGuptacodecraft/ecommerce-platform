'use client'

type ProductSEOSectionProps = {
  seoTitle: string
  seoDescription: string
  onChange: (name: string, value: string) => void
}

export function ProductSEOSection({ seoTitle, seoDescription, onChange }: ProductSEOSectionProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200 space-y-4">
      <h2 className="text-lg font-semibold text-ink">SEO</h2>

      <div>
        <label htmlFor="seo_title" className="block text-sm font-medium text-ink mb-1">
          SEO Title
        </label>
        <input
          id="seo_title"
          name="seo_title"
          type="text"
          maxLength={60}
          value={seoTitle}
          onChange={(e) => onChange('seo_title', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 min-h-[44px] text-sm focus:ring-ink focus:border-ink"
          placeholder="Optional override for <title>"
        />
        <p className="mt-1 text-xs text-gray-500">Max 60 characters.</p>
      </div>

      <div>
        <label htmlFor="seo_description" className="block text-sm font-medium text-ink mb-1">
          SEO Description
        </label>
        <textarea
          id="seo_description"
          name="seo_description"
          maxLength={160}
          value={seoDescription}
          onChange={(e) => onChange('seo_description', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-ink focus:border-ink min-h-[66px]"
          placeholder="Optional override for meta description"
        />
        <p className="mt-1 text-xs text-gray-500">Max 160 characters.</p>
      </div>
    </div>
  )
}
