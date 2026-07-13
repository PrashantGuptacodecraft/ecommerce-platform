'use client'

import { TrashIcon } from '@/components/ui/icons'

type OptionValueProps = {
  value: string
  onChange: (value: string) => void
  onRemove: () => void
  error?: string
}

export function OptionValueEditor({ value, onChange, onRemove, error }: OptionValueProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. Small, Red, Cotton"
          maxLength={50}
          className="w-full border border-gray-300 rounded-md px-3 min-h-[44px] text-sm focus:ring-ink focus:border-ink"
        />
        {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="p-2 text-gray-500 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        title="Remove value"
      >
        <TrashIcon className="w-5 h-5" />
      </button>
    </div>
  )
}
