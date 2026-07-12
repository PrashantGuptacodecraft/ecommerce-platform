'use client'

import { useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utilities/cn'

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'new', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
] as const

type SortSelectProps = {
  currentSort: string
}

/**
 * Sort dropdown for the shop page. Updates URL search params and preserves
 * existing filter params. Resets page to 1 on sort change.
 */
export function SortSelect({ currentSort }: SortSelectProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const params = new URLSearchParams(searchParams.toString())
      const value = e.target.value

      if (value === 'featured') {
        params.delete('sort')
      } else {
        params.set('sort', value)
      }

      // Reset page when sort changes.
      params.delete('page')

      const qs = params.toString()
      router.push(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
    },
    [searchParams, router, pathname],
  )

  return (
    <select
      value={currentSort}
      onChange={handleChange}
      aria-label="Sort products"
      className={cn(
        'rounded-md border border-fog bg-white px-3 py-2 text-sm text-ink',
        'focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent',
        'min-h-[44px] cursor-pointer',
      )}
    >
      {SORT_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
