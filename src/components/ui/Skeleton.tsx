import { cn } from '@/lib/utilities/cn'

type SkeletonProps = {
  className?: string
}

/**
 * Loading placeholder. Uses `animate-pulse`, which the global reduced-motion
 * rule in globals.css tames to a near-static state for those users.
 */
export function Skeleton({ className }: SkeletonProps) {
  return <div aria-hidden className={cn('animate-pulse rounded-md bg-fog/70', className)} />
}
