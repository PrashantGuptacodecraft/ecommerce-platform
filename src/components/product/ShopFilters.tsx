'use client'

import { useState, useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utilities/cn'
import { formatPaise } from '@/lib/utilities/money'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import type { CatalogueFacets, ShopQuery } from '@/features/products/types'

type ShopFiltersProps = {
  facets: CatalogueFacets
  currentFilters: ShopQuery
}

/**
 * Shop filter sidebar (desktop) / drawer (mobile).
 *
 * Filter values are derived from active catalogue data (via the facets prop),
 * never hardcoded. URL search params are the source of truth.
 */
export function ShopFilters({ facets, currentFilters }: ShopFiltersProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const hasActiveFilters = Boolean(
    currentFilters.category ||
    currentFilters.size ||
    currentFilters.colour ||
    currentFilters.minPrice !== undefined ||
    currentFilters.maxPrice !== undefined,
  )

  const updateFilter = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString())

      if (value === undefined || value === '') {
        params.delete(key)
      } else {
        params.set(key, value)
      }

      // Reset page to 1 when a filter changes.
      params.delete('page')

      const qs = params.toString()
      router.push(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
    },
    [searchParams, router, pathname],
  )

  const clearAll = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('category')
    params.delete('size')
    params.delete('colour')
    params.delete('minPrice')
    params.delete('maxPrice')
    params.delete('page')
    const qs = params.toString()
    router.push(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
  }, [searchParams, router, pathname])

  const filterContent = (
    <div className="space-y-6">
      {/* Clear all */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="text-xs font-medium text-accent underline underline-offset-4 hover:text-accent-hover transition-colors"
        >
          Clear all filters
        </button>
      )}

      {/* Categories */}
      {facets.categories.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate">
            Category
          </h3>
          <div className="space-y-2">
            {facets.categories.map((cat) => {
              const isSelected = currentFilters.category === cat.slug

              return (
                <label
                  key={cat.slug}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm',
                    'transition-colors duration-150 hover:bg-fog/40',
                    isSelected && 'bg-fog/60 font-medium',
                  )}
                >
                  <input
                    type="radio"
                    name="category"
                    checked={isSelected}
                    onChange={() => updateFilter('category', isSelected ? undefined : cat.slug)}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      'flex h-4 w-4 items-center justify-center rounded-full border',
                      isSelected ? 'border-accent bg-accent' : 'border-mist',
                    )}
                  >
                    {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </span>
                  <span className="text-ink">{cat.name}</span>
                  <span className="ml-auto text-xs text-mist">{cat.count}</span>
                </label>
              )
            })}
          </div>
        </div>
      )}

      {/* Size pills */}
      {facets.sizes.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate">Size</h3>
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((size) => {
              const isSelected = currentFilters.size === size

              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => updateFilter('size', isSelected ? undefined : size)}
                  className={cn(
                    'inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full px-3 text-sm font-medium',
                    'transition-all duration-150',
                    isSelected
                      ? 'bg-ink text-paper'
                      : 'border border-fog bg-white text-ink hover:border-ink',
                  )}
                  aria-pressed={isSelected}
                >
                  {size}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Colour pills */}
      {facets.colours.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate">Colour</h3>
          <div className="flex flex-wrap gap-2">
            {facets.colours.map((colour) => {
              const isSelected = currentFilters.colour === colour

              return (
                <button
                  key={colour}
                  type="button"
                  onClick={() => updateFilter('colour', isSelected ? undefined : colour)}
                  className={cn(
                    'inline-flex min-h-[36px] items-center justify-center rounded-full px-3 text-sm font-medium',
                    'transition-all duration-150',
                    isSelected
                      ? 'bg-ink text-paper'
                      : 'border border-fog bg-white text-ink hover:border-ink',
                  )}
                  aria-pressed={isSelected}
                >
                  {colour}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Price range */}
      {facets.priceRange.max > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate">
            Price Range
          </h3>
          <div className="flex items-center gap-2">
            <PriceInput
              label="Min"
              valuePaise={currentFilters.minPrice}
              onChange={(v) => updateFilter('minPrice', v !== undefined ? String(v) : undefined)}
            />
            <span className="text-mist">—</span>
            <PriceInput
              label="Max"
              valuePaise={currentFilters.maxPrice}
              onChange={(v) => updateFilter('maxPrice', v !== undefined ? String(v) : undefined)}
            />
          </div>
          <p className="mt-1.5 text-xs text-mist">
            Range: {formatPaise(facets.priceRange.min)} – {formatPaise(facets.priceRange.max)}
          </p>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Mobile filter trigger */}
      <div className="md:hidden">
        <Button variant="outline" size="sm" onClick={() => setDrawerOpen(true)} className="mb-4">
          Filters
          {hasActiveFilters && (
            <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs text-white">
              !
            </span>
          )}
        </Button>
        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Filters" side="left">
          {filterContent}
        </Drawer>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden w-56 flex-shrink-0 md:block">
        <div className="sticky top-24">{filterContent}</div>
      </aside>
    </>
  )
}

/**
 * Price input that operates in rupees (user-facing) but stores paise.
 */
function PriceInput({
  label,
  valuePaise,
  onChange,
}: {
  label: string
  valuePaise?: number
  onChange: (paise: number | undefined) => void
}) {
  const displayValue = valuePaise !== undefined ? String(Math.round(valuePaise / 100)) : ''

  return (
    <input
      type="number"
      inputMode="numeric"
      aria-label={`${label} price in rupees`}
      placeholder={label}
      min={0}
      value={displayValue}
      onChange={(e) => {
        const raw = e.target.value.trim()
        if (raw === '') {
          onChange(undefined)
          return
        }
        const num = parseInt(raw, 10)
        if (!isNaN(num) && num >= 0) {
          onChange(num * 100)
        }
      }}
      className={cn(
        'w-24 rounded-md border border-fog bg-white px-3 py-2 text-sm text-ink',
        'placeholder:text-mist',
        'focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent',
      )}
    />
  )
}
