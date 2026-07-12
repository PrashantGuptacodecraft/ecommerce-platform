import { Badge } from '@/components/ui'
import { cn } from '@/lib/utilities/cn'
import { site } from '@/config/site'

type StockStatus = 'out-of-stock' | 'low-stock' | 'in-stock'

/**
 * Derives a stock status from a total stock count.
 * Reusable helper for any component that needs to branch on stock level.
 */
export function stockStatus(totalStock: number): StockStatus {
  if (totalStock === 0) return 'out-of-stock'
  if (totalStock <= site.lowStockThreshold) return 'low-stock'
  return 'in-stock'
}

type StockBadgeProps = {
  totalStock: number
  className?: string
}

/**
 * Renders a badge reflecting the stock level.
 * - Out of Stock → danger badge
 * - Low Stock    → warning badge with remaining count
 * - In Stock     → success badge (useful on PDP, hidden on cards)
 */
export function StockBadge({ totalStock, className }: StockBadgeProps) {
  const status = stockStatus(totalStock)

  if (status === 'out-of-stock') {
    return (
      <Badge variant="danger" className={cn(className)}>
        Out of Stock
      </Badge>
    )
  }

  if (status === 'low-stock') {
    return (
      <Badge variant="warning" className={cn(className)}>
        Low Stock — {totalStock} left
      </Badge>
    )
  }

  return (
    <Badge variant="success" className={cn(className)}>
      In Stock
    </Badge>
  )
}
