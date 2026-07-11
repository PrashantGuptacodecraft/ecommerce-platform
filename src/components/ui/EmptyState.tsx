import type { ReactNode } from 'react'
import { cn } from '@/lib/utilities/cn'

type EmptyStateProps = {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

/**
 * Centred empty/zero state for lists, search results, empty carts, etc.
 * Every list surface in the storefront and admin should render one of these
 * rather than a blank area (a Phase 1 definition-of-done requirement).
 */
export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-fog px-6 py-14 text-center',
        className,
      )}
    >
      {icon ? <div className="text-mist">{icon}</div> : null}
      <div className="space-y-1">
        <h3 className="text-base font-medium text-ink">{title}</h3>
        {description ? <p className="mx-auto max-w-sm text-sm text-slate">{description}</p> : null}
      </div>
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  )
}
