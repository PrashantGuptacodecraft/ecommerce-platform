'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utilities/cn'
import { formatPaise } from '@/lib/utilities/money'
import { StockBadge } from '@/components/product/StockBadge'
import type {
  ProductOption,
  ProductVariant,
} from '@/features/products/types'

type VariantSelectorProps = {
  options: ProductOption[]
  variants: ProductVariant[]
  basePricePaise: number
  onVariantChange?: (variant: ProductVariant | null) => void
}

/**
 * Generic variant selector for any combination of option groups.
 *
 * - Reads initial selection from URL search params (e.g. ?size=M&colour=Black)
 * - Updates URL search params on change (shareable/bookmarkable)
 * - Disables values that have no active variant with stock > 0
 *   given the current selections for OTHER options
 * - Shows matched variant info (SKU, price, stock)
 */
export function VariantSelector({
  options,
  variants,
  basePricePaise,
  onVariantChange,
}: VariantSelectorProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Sort options by sortOrder
  const sortedOptions = useMemo(
    () => [...options].sort((a, b) => a.sortOrder - b.sortOrder),
    [options],
  )

  // Build initial selections from URL search params
  const getInitialSelections = useCallback((): Record<string, string> => {
    const selections: Record<string, string> = {}
    for (const option of sortedOptions) {
      const paramKey = option.name.toLowerCase()
      const paramValue = searchParams.get(paramKey)
      if (paramValue) {
        // Validate: does this value exist in the option?
        const valid = option.values.some(
          (v) => v.value.toLowerCase() === paramValue.toLowerCase(),
        )
        if (valid) {
          const matched = option.values.find(
            (v) => v.value.toLowerCase() === paramValue.toLowerCase(),
          )
          if (matched) selections[option.id] = matched.id
        }
      }
    }
    return selections
  }, [sortedOptions, searchParams])

  // selections: optionId -> optionValueId
  const [selections, setSelections] = useState<Record<string, string>>(
    getInitialSelections,
  )

  // Track option group refs for keyboard navigation
  const groupRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // Find the variant matching current selections
  const matchedVariant = useMemo((): ProductVariant | null => {
    if (Object.keys(selections).length !== sortedOptions.length) return null

    const selectedValueIds = new Set(Object.values(selections))
    return (
      variants.find(
        (v) =>
          v.isActive &&
          v.optionValueIds.length === selectedValueIds.size &&
          v.optionValueIds.every((id) => selectedValueIds.has(id)),
      ) ?? null
    )
  }, [selections, sortedOptions.length, variants])

  // Notify parent on variant change
  useEffect(() => {
    onVariantChange?.(matchedVariant)
  }, [matchedVariant, onVariantChange])

  /**
   * Determine if a specific option value is available (not disabled).
   * A value is disabled if NO active variant with stock > 0 exists
   * matching it + all other current selections.
   */
  const isValueAvailable = useCallback(
    (optionId: string, valueId: string): boolean => {
      // Build a hypothetical selection set: current selections, but with
      // this option set to this value
      const hypothetical: Record<string, string> = {
        ...selections,
        [optionId]: valueId,
      }

      // Check if any active variant with stock matches
      return variants.some((v) => {
        if (!v.isActive || v.stockQuantity <= 0) return false
        // For each option that HAS a selection in hypothetical,
        // the variant must contain that value
        return Object.entries(hypothetical).every(([, selectedValueId]) =>
          v.optionValueIds.includes(selectedValueId),
        )
      })
    },
    [selections, variants],
  )

  // Update URL search params
  const updateUrl = useCallback(
    (newSelections: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())

      // Clear all option params first
      for (const option of sortedOptions) {
        params.delete(option.name.toLowerCase())
      }

      // Set selected values
      for (const option of sortedOptions) {
        const valueId = newSelections[option.id]
        if (valueId) {
          const value = option.values.find((v) => v.id === valueId)
          if (value) {
            params.set(option.name.toLowerCase(), value.value)
          }
        }
      }

      const qs = params.toString()
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
    },
    [searchParams, sortedOptions, router, pathname],
  )

  const handleSelect = useCallback(
    (optionId: string, valueId: string) => {
      setSelections((prev) => {
        // Toggle off if already selected
        if (prev[optionId] === valueId) {
          const next = { ...prev }
          delete next[optionId]
          updateUrl(next)
          return next
        }

        const next = { ...prev, [optionId]: valueId }
        updateUrl(next)
        return next
      })
    },
    [updateUrl],
  )

  // Keyboard navigation within a group
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, optionId: string, values: { id: string }[]) => {
      const currentIndex = values.findIndex((v) => v.id === selections[optionId])

      let nextIndex = -1
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        nextIndex = currentIndex < values.length - 1 ? currentIndex + 1 : 0
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        nextIndex = currentIndex > 0 ? currentIndex - 1 : values.length - 1
      }

      if (nextIndex >= 0) {
        const nextValue = values[nextIndex]
        if (nextValue) handleSelect(optionId, nextValue.id)
        // Focus the new button
        const groupEl = groupRefs.current.get(optionId)
        if (groupEl) {
          const buttons = groupEl.querySelectorAll<HTMLButtonElement>('[role="radio"]')
          buttons[nextIndex]?.focus()
        }
      }
    },
    [selections, handleSelect],
  )

  const variantPrice = matchedVariant
    ? basePricePaise + matchedVariant.priceAdjustmentPaise
    : basePricePaise

  return (
    <div className="space-y-5">
      {sortedOptions.map((option) => {
        const sortedValues = [...option.values].sort(
          (a, b) => a.sortOrder - b.sortOrder,
        )

        return (
          <div key={option.id}>
            <label className="mb-2 block text-sm font-medium text-ink">
              {option.name}
              {selections[option.id] && (
                <span className="ml-1.5 font-normal text-slate">
                  — {sortedValues.find((v) => v.id === selections[option.id])?.value}
                </span>
              )}
            </label>
            <div
              ref={(el) => {
                if (el) groupRefs.current.set(option.id, el)
              }}
              role="radiogroup"
              aria-label={option.name}
              className="flex flex-wrap gap-2"
              onKeyDown={(e) => handleKeyDown(e, option.id, sortedValues)}
            >
              {sortedValues.map((value) => {
                const isSelected = selections[option.id] === value.id
                const available = isValueAvailable(option.id, value.id)

                return (
                  <button
                    key={value.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    aria-disabled={!available}
                    disabled={!available}
                    onClick={() => handleSelect(option.id, value.id)}
                    className={cn(
                      'inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full px-4 py-2 text-sm font-medium',
                      'transition-all duration-150',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
                      isSelected
                        ? 'bg-ink text-paper'
                        : available
                          ? 'border border-fog bg-white text-ink hover:border-ink'
                          : 'border border-fog bg-white text-ink opacity-40 cursor-not-allowed line-through',
                    )}
                  >
                    {value.value}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Selected variant info */}
      {matchedVariant && (
        <div className="space-y-2 rounded-lg border border-fog bg-white p-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium text-ink">
              {formatPaise(variantPrice)}
            </span>
            <span className="text-xs text-mist">
              SKU: {matchedVariant.sku}
            </span>
          </div>
          <StockBadge totalStock={matchedVariant.stockQuantity} />
        </div>
      )}
    </div>
  )
}
