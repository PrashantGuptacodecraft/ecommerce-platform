'use client'

import { OptionGroupEditor, type OptionGroup } from './OptionGroupEditor'
import { VariantCombinationList, type VariantNode } from './VariantCombinationList'

import { computeVariants } from '../utils/cartesian'

export const MAX_OPTIONS = 3
export const MAX_VARIANTS = 100

type VariantEditorProps = {
  options: OptionGroup[]
  variants: VariantNode[]
  onChange: (options: OptionGroup[], variants: VariantNode[]) => void
  disabled?: boolean
}

export function VariantEditor({ options, variants, onChange, disabled }: VariantEditorProps) {
  const handleOptionsChange = (index: number, updatedGroup: OptionGroup) => {
    const newOptions = [...options]
    newOptions[index] = updatedGroup
    const newVariants = computeVariants(newOptions, variants)
    onChange(newOptions, newVariants)
  }

  const handleRemoveOption = (index: number) => {
    // If we remove an option, we recalculate variants.
    // We should warn if any existing variant has stock, but since we are removing an entire dimension,
    // ALL variants will be rebuilt unless there are other dimensions. Actually, any structural change rebuilding variants might lose stock if they disappear.
    // The safest is to warn if ANY variant has stock.
    const hasStock = variants.some((v) => v.stockQuantity > 0)
    if (hasStock) {
      if (
        !confirm(
          'Removing an option group will destroy existing variant combinations. Some variants have stock in the ledger. Are you sure?',
        )
      ) {
        return
      }
    }

    const newOptions = [...options]
    newOptions.splice(index, 1)

    // Reorder
    const reordered = newOptions.map((o, i) => ({ ...o, sortOrder: i }))
    const newVariants = computeVariants(reordered, variants)
    onChange(reordered, newVariants)
  }

  const handleRemoveValueWarning = () => {
    const hasStock = variants.some((v) => v.stockQuantity > 0)
    if (hasStock) {
      return confirm(
        'Removing this value will delete associated variant combinations that currently hold stock. Are you sure?',
      )
    }
    return true
  }

  const handleAddOption = () => {
    if (options.length >= MAX_OPTIONS) return
    const newGroup: OptionGroup = {
      id: crypto.randomUUID(),
      name: '',
      sortOrder: options.length,
      values: [],
    }
    onChange([...options, newGroup], computeVariants([...options, newGroup], variants))
  }

  const handleVariantsChange = (newVariants: VariantNode[]) => {
    onChange(options, newVariants)
  }

  const combinationCount = computeVariants(options, variants).length

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink">Options & Variants</h2>
        {options.length < MAX_OPTIONS && (
          <button
            type="button"
            onClick={handleAddOption}
            disabled={disabled}
            className="text-sm font-medium text-ink bg-gray-100 hover:bg-gray-200 px-3 min-h-[36px] flex items-center rounded-md transition-colors disabled:opacity-50"
          >
            Add Option
          </button>
        )}
      </div>

      {options.length === 0 && (
        <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-md border border-gray-200">
          This product has no options (e.g. Size, Color). It will be treated as a single-variant
          product.
        </div>
      )}

      {options.length > 0 && (
        <div className="space-y-4">
          {options.map((opt, i) => (
            <OptionGroupEditor
              key={opt.id}
              group={opt}
              onChange={(updated) => handleOptionsChange(i, updated)}
              onRemove={() => handleRemoveOption(i)}
              onRemoveWarning={handleRemoveValueWarning}
            />
          ))}
        </div>
      )}

      {combinationCount > MAX_VARIANTS && (
        <div className="bg-red-50 text-red-800 p-4 rounded-md border border-red-200 text-sm">
          Warning: This generates {combinationCount} combinations. The maximum allowed is{' '}
          {MAX_VARIANTS}. Please remove some option values.
        </div>
      )}

      {options.length > 0 && combinationCount <= MAX_VARIANTS && combinationCount > 0 && (
        <div className="pt-6 border-t border-gray-200 mt-6">
          <VariantCombinationList
            options={options}
            variants={variants}
            onChange={handleVariantsChange}
          />
        </div>
      )}
    </div>
  )
}
