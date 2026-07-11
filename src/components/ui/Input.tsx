'use client'

import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utilities/cn'

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean
}

/**
 * Text input. `invalid` toggles the error ring and sets aria-invalid. Height is
 * touch-friendly (44px). Ref-forwarded for react-hook-form `register`.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, type = 'text', ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(
        'h-11 w-full rounded-md border bg-white px-3 text-sm text-ink',
        'placeholder:text-mist',
        'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
        invalid
          ? 'border-danger focus-visible:ring-danger/30'
          : 'border-ink/15 hover:border-ink/25',
        'disabled:cursor-not-allowed disabled:bg-fog/40 disabled:text-mist',
        className,
      )}
      {...props}
    />
  )
})
