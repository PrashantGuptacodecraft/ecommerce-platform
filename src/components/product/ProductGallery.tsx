'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'
import { motion, useReducedMotion, type PanInfo } from 'motion/react'
import { cn } from '@/lib/utilities/cn'
import { getProductImageUrl } from '@/lib/utilities/supabase-image'
import { ImageFallback } from '@/components/product/ImageFallback'
import type { ProductImage } from '@/features/products/types'

type ProductGalleryProps = {
  images: ProductImage[]
  productName: string
}

const SWIPE_THRESHOLD = 50
const SWIPE_VELOCITY = 500

/**
 * Product image gallery:
 * - Zero images → polished fallback
 * - One image → single image, no nav
 * - Multiple → main image + thumbnail strip + prev/next + swipe + keyboard
 */
export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const reduce = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)

  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order)
  const count = sorted.length

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex((count + index) % count)
    },
    [count],
  )

  const goPrev = useCallback(() => goTo(activeIndex - 1), [goTo, activeIndex])
  const goNext = useCallback(() => goTo(activeIndex + 1), [goTo, activeIndex])

  // Arrow key navigation
  useEffect(() => {
    if (count <= 1) return

    const el = containerRef.current
    if (!el) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goNext()
      }
    }

    el.addEventListener('keydown', onKeyDown)
    return () => el.removeEventListener('keydown', onKeyDown)
  }, [count, goPrev, goNext])

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset, velocity } = info
      if (Math.abs(offset.x) > SWIPE_THRESHOLD || Math.abs(velocity.x) > SWIPE_VELOCITY) {
        if (offset.x < 0) goNext()
        else goPrev()
      }
    },
    [goNext, goPrev],
  )

  // Zero images
  if (count === 0) {
    return <ImageFallback productName={productName} />
  }

  const activeImage = sorted[activeIndex]!
  const activeUrl = getProductImageUrl(activeImage.storage_path)

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-3"
      tabIndex={0}
      role="region"
      aria-label={`${productName} images`}
      aria-roledescription="carousel"
    >
      {/* Main image */}
      <div className="relative overflow-hidden rounded-lg">
        <motion.div
          className="relative aspect-[4/5]"
          whileHover={reduce ? undefined : { scale: 1.03 }}
          transition={{ duration: 0.2 }}
          drag={count > 1 ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          dragDirectionLock
          onDragEnd={count > 1 ? handleDragEnd : undefined}
          style={{ touchAction: 'pan-y' }}
        >
          {activeUrl ? (
            <Image
              src={activeUrl}
              alt={activeImage.alt_text ?? `${productName} — image ${activeIndex + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={activeIndex === 0}
              className="object-cover"
            />
          ) : (
            <ImageFallback productName={productName} />
          )}
        </motion.div>

        {/* Prev/Next buttons */}
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous image"
              className={cn(
                'absolute top-1/2 left-2 z-10 -translate-y-1/2',
                'flex h-10 w-10 items-center justify-center rounded-full',
                'bg-white/80 text-ink shadow-sm backdrop-blur-sm',
                'opacity-0 transition-opacity duration-200 group-hover:opacity-100',
                'hover:bg-white focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              )}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next image"
              className={cn(
                'absolute top-1/2 right-2 z-10 -translate-y-1/2',
                'flex h-10 w-10 items-center justify-center rounded-full',
                'bg-white/80 text-ink shadow-sm backdrop-blur-sm',
                'opacity-0 transition-opacity duration-200 group-hover:opacity-100',
                'hover:bg-white focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              )}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </>
        )}

        {/* Image counter indicator */}
        {count > 1 && (
          <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-ink/60 px-2.5 py-1 text-xs font-medium text-paper backdrop-blur-sm">
            {activeIndex + 1} / {count}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {count > 1 && (
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          role="tablist"
          aria-label="Image thumbnails"
        >
          {sorted.map((image, index) => {
            const thumbUrl = getProductImageUrl(image.storage_path)
            const isActive = index === activeIndex

            return (
              <button
                key={image.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`View image ${index + 1}`}
                onClick={() => goTo(index)}
                className={cn(
                  'relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2 transition-all duration-150',
                  isActive
                    ? 'border-accent ring-1 ring-accent/30'
                    : 'border-transparent opacity-60 hover:opacity-100',
                )}
              >
                {thumbUrl ? (
                  <Image
                    src={thumbUrl}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                    loading={index > 4 ? 'lazy' : undefined}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-fog/50">
                    <span className="text-[8px] uppercase text-mist">{index + 1}</span>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
