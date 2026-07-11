'use client'

import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utilities/cn'

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid, rows = 4, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(
        'w-full rounded-md border bg-white px-3 py-2.5 text-sm text-ink',
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
