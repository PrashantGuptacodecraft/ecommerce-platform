import type { ReactNode } from 'react'
import { cn } from '@/lib/utilities/cn'

export type BadgeVariant = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'outline'

const VARIANTS: Record<BadgeVariant, string> = {
  neutral: 'bg-ink/5 text-charcoal',
  accent: 'bg-accent text-accent-contrast',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  outline: 'border border-ink/15 text-charcoal',
}

type BadgeProps = {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

export function Badge({ children, variant = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
