import type { ReactNode } from 'react'
import { cn } from '@/lib/utilities/cn'

type CardProps = {
  children: ReactNode
  className?: string
  /** Adds hover elevation for clickable cards. */
  interactive?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const PADDING = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6 sm:p-8',
}

export function Card({ children, className, interactive = false, padding = 'md' }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-fog bg-white shadow-sm',
        interactive && 'transition-shadow duration-150 hover:shadow-md',
        PADDING[padding],
        className,
      )}
    >
      {children}
    </div>
  )
}
