import type { ElementType, ReactNode } from 'react'
import { cn } from '@/lib/utilities/cn'

type ContainerProps = {
  children: ReactNode
  className?: string
  /** Render as a different element (e.g. `section`, `header`). */
  as?: ElementType
  /** Narrower max width for reading-focused content. */
  size?: 'default' | 'narrow'
}

/**
 * Centres content with the standard page gutter (mobile-first: 16px, widening
 * on larger screens). The single horizontal-rhythm primitive.
 */
export function Container({
  children,
  className,
  as: Tag = 'div',
  size = 'default',
}: ContainerProps) {
  return (
    <Tag
      className={cn(
        'mx-auto w-full px-4 sm:px-6 lg:px-8',
        size === 'narrow' ? 'max-w-3xl' : 'max-w-6xl',
        className,
      )}
    >
      {children}
    </Tag>
  )
}
