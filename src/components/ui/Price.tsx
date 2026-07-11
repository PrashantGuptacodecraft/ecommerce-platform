import { cn } from '@/lib/utilities/cn'
import { discountPercent, formatPaise } from '@/lib/utilities/money'

type PriceSize = 'sm' | 'md' | 'lg'

const SIZES: Record<PriceSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
}

type PriceProps = {
  pricePaise: number
  compareAtPaise?: number | null
  size?: PriceSize
  className?: string
}

/**
 * Renders a price from integer paise, with an optional struck-through
 * compare-at price and a percent-off badge when there is a real discount.
 */
export function Price({ pricePaise, compareAtPaise, size = 'md', className }: PriceProps) {
  const percent = discountPercent(pricePaise, compareAtPaise)

  return (
    <span className={cn('inline-flex items-baseline gap-2', className)}>
      <span className={cn('font-medium tabular-nums text-ink', SIZES[size])}>
        {formatPaise(pricePaise)}
      </span>
      {compareAtPaise && percent ? (
        <>
          <span className="text-sm tabular-nums text-mist line-through">
            {formatPaise(compareAtPaise)}
          </span>
          <span className="text-xs font-medium text-success">-{percent}%</span>
        </>
      ) : null}
    </span>
  )
}
