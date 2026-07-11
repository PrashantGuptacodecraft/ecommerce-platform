import type { LabelHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utilities/cn'

type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  children: ReactNode
  /** Appends a subtle required marker. */
  required?: boolean
}

export function Label({ children, required, className, ...props }: LabelProps) {
  return (
    <label className={cn('block text-sm font-medium text-charcoal', className)} {...props}>
      {children}
      {required ? (
        <span className="text-danger" aria-hidden>
          {' '}
          *
        </span>
      ) : null}
    </label>
  )
}
