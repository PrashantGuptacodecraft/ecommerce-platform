'use client'

type ProductBasicSectionProps = {
  name: string
  slug: string
  categoryId: string
  categories: { id: string; name: string }[]
  onChange: (name: string, value: string) => void
}

export function ProductBasicSection({
  name,
  slug,
  categoryId,
  categories,
  onChange,
}: ProductBasicSectionProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200 space-y-4">
      <h2 className="text-lg font-semibold text-ink">Basic Information</h2>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-ink mb-1">
          Product Name *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          value={name}
          onChange={(e) => onChange('name', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 min-h-[44px] text-sm focus:ring-ink focus:border-ink"
        />
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-ink mb-1">
          URL Slug *
        </label>
        <input
          id="slug"
          name="slug"
          type="text"
          required
          value={slug}
          onChange={(e) => {
            const normalized = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
            onChange('slug', normalized)
          }}
          className="w-full border border-gray-300 rounded-md px-3 min-h-[44px] text-sm focus:ring-ink focus:border-ink"
        />
      </div>

      <div>
        <label htmlFor="category_id" className="block text-sm font-medium text-ink mb-1">
          Category *
        </label>
        <select
          id="category_id"
          name="category_id"
          required
          value={categoryId}
          onChange={(e) => onChange('category_id', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 min-h-[44px] text-sm focus:ring-ink focus:border-ink bg-white"
        >
          <option value="" disabled>
            Select a category
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
