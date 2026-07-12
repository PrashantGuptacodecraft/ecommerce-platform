import { cn } from '@/lib/utilities/cn'

type ImageFallbackProps = {
  productName: string
  className?: string
}

/**
 * Polished placeholder for product images. Renders a neutral tonal gradient
 * (fog → paper) with the product name centred — clearly a placeholder, never
 * a photo stand-in. Used by ProductCard and ProductGallery alike.
 */
export function ImageFallback({ productName, className }: ImageFallbackProps) {
  return (
    <div
      className={cn(
        'flex aspect-[4/5] items-center justify-center',
        'bg-gradient-to-br from-fog via-paper to-fog/60',
        'rounded-lg',
        className,
      )}
    >
      <span className="max-w-[80%] text-center text-xs font-medium uppercase tracking-widest text-mist select-none">
        {productName}
      </span>
    </div>
  )
}
