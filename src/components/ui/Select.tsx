'use client'

import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utilities/cn'
import { ChevronDownIcon } from '@/components/ui/icons'

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean
}

/**
 * Native select styled to match the design system (native is the most
 * accessible + mobile-friendly choice). Ref-forwarded for react-hook-form.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, invalid, children, ...props },
  ref,
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          'h-11 w-full appearance-none rounded-md border bg-white pr-10 pl-3 text-sm text-ink',
          'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
          invalid
            ? 'border-danger focus-visible:ring-danger/30'
            : 'border-ink/15 hover:border-ink/25',
          'disabled:cursor-not-allowed disabled:bg-fog/40 disabled:text-mist',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate" />
    </div>
  )
})
