'use client'

import { useTransition } from 'react'
import { HeartIcon } from '@/components/ui/icons'
import { toggleWishlistItemAction } from '@/features/wishlist/actions'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utilities/cn'
import { useWishlist } from '@/features/wishlist/components/WishlistProvider'

interface WishlistButtonProps {
  productId: string
  className?: string
}

export function WishlistButton({ productId, className }: WishlistButtonProps) {
  const { wishedProductIds, toggleLocalWishedState, isLoaded } = useWishlist()
  const isWished = wishedProductIds.has(productId)
  
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault() // prevent navigating if inside a link
    e.stopPropagation()
    
    // Optimistic update
    const willBeWished = !isWished
    toggleLocalWishedState(productId, willBeWished)
    
    startTransition(async () => {
      const result = await toggleWishlistItemAction(productId)
      
      if (!result.success) {
        // Revert on failure
        toggleLocalWishedState(productId, !willBeWished)
        toast({
          title: 'Error',
          description: 'Failed to update wishlist. Please try again.',
        })
      } else {
        toast({
          title: result.isAdded ? 'Added to Wishlist' : 'Removed from Wishlist',
          description: 'Your wishlist has been updated.',
        })
      }
    })
  }

  // Hide or disable the button subtly before it loads if we want, but it's fine
  // to just let it be un-filled until the context loads.
  
  return (
    <button
      onClick={handleToggle}
      disabled={isPending || !isLoaded}
      className={cn(
        'group flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-all hover:scale-110 active:scale-95 disabled:pointer-events-none disabled:opacity-70',
        className
      )}
      aria-label={isWished ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <HeartIcon
        className={cn(
          'h-5 w-5 transition-colors',
          isWished ? 'fill-red-500 text-red-500' : 'text-slate group-hover:text-ink'
        )}
      />
    </button>
  )
}
