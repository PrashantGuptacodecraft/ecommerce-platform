'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { getProductImageUrl } from '@/lib/utilities/supabase-image'
import type { ProductImage } from '@/features/products/types'

type ImageReorderListProps = {
  images: ProductImage[]
  onUpdateImages: (updatedImages: ProductImage[]) => void
  onDeleteImage: (imageId: string) => void
  disabled?: boolean
}

export function ImageReorderList({ images, onUpdateImages, onDeleteImage, disabled }: ImageReorderListProps) {
  // We manage a local sorted array for immediate UI feedback.
  // The parent handles the actual saving to backend.
  const sortedImages = [...images].sort((a, b) => a.sort_order - b.sort_order)

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newImages = [...sortedImages]
    const current = newImages[index]
    const previous = newImages[index - 1]
    if (current && previous) {
      newImages[index - 1] = current
      newImages[index] = previous
    }
    
    // Update sort orders based on new array positions
    const finalized = newImages.map((img, i) => ({ ...img, sort_order: i }))
    onUpdateImages(finalized)
  }

  const handleMoveDown = (index: number) => {
    if (index === sortedImages.length - 1) return
    const newImages = [...sortedImages]
    const current = newImages[index]
    const next = newImages[index + 1]
    if (current && next) {
      newImages[index + 1] = current
      newImages[index] = next
    }
    
    // Update sort orders
    const finalized = newImages.map((img, i) => ({ ...img, sort_order: i }))
    onUpdateImages(finalized)
  }

  const handleSetPrimary = (imageId: string) => {
    const newImages = sortedImages.map(img => ({
      ...img,
      is_primary: img.id === imageId
    }))
    onUpdateImages(newImages)
  }

  const handleAltTextChange = (imageId: string, altText: string) => {
    const newImages = sortedImages.map(img => 
      img.id === imageId ? { ...img, alt_text: altText } : img
    )
    onUpdateImages(newImages)
  }

  if (sortedImages.length === 0) {
    return (
      <div className="py-8 text-center border border-dashed border-fog rounded-md bg-paper/50">
        <p className="text-sm text-mist">No images uploaded yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sortedImages.map((img, index) => {
        const url = getProductImageUrl(img.storage_path)
        return (
          <div 
            key={img.id} 
            className={`flex flex-col sm:flex-row gap-4 p-4 rounded-md border ${img.is_primary ? 'border-ink bg-paper/20' : 'border-fog bg-paper/50'}`}
          >
            <div className="flex-shrink-0 w-24 h-32 bg-fog rounded-md overflow-hidden relative">
              {url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={url} 
                  alt={img.alt_text || 'Product image preview'} 
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-mist text-xs">
                  No preview
                </div>
              )}
              {img.is_primary && (
                <div className="absolute top-0 left-0 right-0 bg-ink text-paper text-[10px] uppercase font-bold text-center py-1">
                  Primary
                </div>
              )}
            </div>

            <div className="flex-grow space-y-3 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-medium text-slate mb-1">Alt Text</label>
                <input
                  type="text"
                  value={img.alt_text || ''}
                  onChange={(e) => handleAltTextChange(img.id, e.target.value)}
                  disabled={disabled}
                  placeholder="Describe this image for screen readers"
                  className="w-full h-10 px-3 py-2 border border-fog rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-ink focus:border-ink"
                />
              </div>

              <div className="flex flex-wrap gap-2 items-center justify-between">
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    disabled={disabled || index === 0}
                    onClick={() => handleMoveUp(index)}
                  >
                    Up
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    disabled={disabled || index === sortedImages.length - 1}
                    onClick={() => handleMoveDown(index)}
                  >
                    Down
                  </Button>
                  {!img.is_primary && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      disabled={disabled}
                      onClick={() => handleSetPrimary(img.id)}
                    >
                      Set Primary
                    </Button>
                  )}
                </div>

                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                  disabled={disabled}
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
                      onDeleteImage(img.id)
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
