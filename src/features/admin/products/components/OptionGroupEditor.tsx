'use client'

import { OptionValueEditor } from './OptionValueEditor'
import { TrashIcon } from '@/components/ui/icons'

export const MAX_VALUES_PER_GROUP = 20

export type OptionValue = {
  id: string
  value: string
  sortOrder: number
}

export type OptionGroup = {
  id: string
  name: string
  sortOrder: number
  values: OptionValue[]
}

type OptionGroupEditorProps = {
  group: OptionGroup
  onChange: (group: OptionGroup) => void
  onRemove: () => void
  onRemoveValueWarning?: (valueId: string) => boolean // returns false if removal blocked
}

export function OptionGroupEditor({
  group,
  onChange,
  onRemove,
  onRemoveWarning,
}: OptionGroupEditorProps & { onRemoveWarning?: () => boolean }) {
  const handleNameChange = (name: string) => {
    onChange({ ...group, name })
  }

  const handleAddValue = () => {
    if (group.values.length >= MAX_VALUES_PER_GROUP) return
    const newValues = [
      ...group.values,
      { id: crypto.randomUUID(), value: '', sortOrder: group.values.length },
    ]
    onChange({ ...group, values: newValues })
  }

  const handleValueChange = (index: number, value: string) => {
    const newValues = [...group.values]
    const current = newValues[index]
    if (current) {
      newValues[index] = { ...current, value }
      onChange({ ...group, values: newValues })
    }
  }

  const handleRemoveValue = (index: number) => {
    // If warning callback returns false, we abort removal
    if (onRemoveWarning && !onRemoveWarning()) return

    const newValues = [...group.values]
    newValues.splice(index, 1)

    // Re-adjust sort orders
    const reordered = newValues.map((v, i) => ({ ...v, sortOrder: i }))
    onChange({ ...group, values: reordered })
  }

  // Duplicate check
  const valueTexts = group.values.map((v) => v.value.trim().toLowerCase())
  const hasDuplicates = (val: string, index: number) => {
    const normalized = val.trim().toLowerCase()
    if (!normalized) return false
    return valueTexts.indexOf(normalized) !== index
  }

  return (
    <div className="border border-gray-200 rounded-md p-4 bg-gray-50 space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-ink mb-1">Option Name *</label>
          <input
            type="text"
            value={group.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. Size, Color"
            maxLength={50}
            className="w-full border border-gray-300 rounded-md px-3 min-h-[44px] text-sm focus:ring-ink focus:border-ink bg-white"
          />
        </div>
        <div className="pt-6">
          <button
            type="button"
            onClick={onRemove}
            className="p-2 text-gray-500 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Remove option group"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="space-y-3 pl-4 border-l-2 border-gray-200">
        <label className="block text-sm font-medium text-ink">Option Values *</label>

        {group.values.map((v, i) => (
          <OptionValueEditor
            key={v.id}
            value={v.value}
            onChange={(val) => handleValueChange(i, val)}
            onRemove={() => handleRemoveValue(i)}
            error={hasDuplicates(v.value, i) ? 'Duplicate value' : undefined}
          />
        ))}

        {group.values.length < MAX_VALUES_PER_GROUP && (
          <button
            type="button"
            onClick={handleAddValue}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 min-h-[44px] px-2 flex items-center rounded-md hover:bg-blue-50 transition-colors -ml-2"
          >
            + Add another value
          </button>
        )}
      </div>
    </div>
  )
}
