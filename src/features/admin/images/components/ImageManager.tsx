'use client'

import { useState } from 'react'
import { ImageUploader } from './ImageUploader'
import { ImageReorderList } from './ImageReorderList'
import { updateProductImagesAction, deleteProductImageAction } from '../actions'
import type { ProductImage } from '@/features/products/types'

type ImageManagerProps = {
  productId: string
  initialImages: ProductImage[]
  initialExpectedUpdatedAt: string
  onUpdatedAtChange: (newUpdatedAt: string) => void
}

export function ImageManager({
  productId,
  initialImages,
  initialExpectedUpdatedAt,
  onUpdatedAtChange,
}: ImageManagerProps) {
  const [images, setImages] = useState<ProductImage[]>(initialImages)
  const [expectedUpdatedAt, setExpectedUpdatedAt] = useState(initialExpectedUpdatedAt)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUploadSuccess = (imageId: string, newUpdatedAt: string) => {
    // When an image is finalized, the backend doesn't return the full image object,
    // so in a real scenario we might want to re-fetch the product or Optimistically append.
    // For now, we rely on the parent or page refresh to get the new images if we don't have the storage_path.
    // Let's at least update the updated_at token.
    setExpectedUpdatedAt(newUpdatedAt)
    onUpdatedAtChange(newUpdatedAt)
    // To show it immediately we'd need the storage path. The user is instructed to use a full product reload or we just trigger a router.refresh()
    window.location.reload()
  }

  const handleUpdateImages = async (updatedImages: ProductImage[]) => {
    setIsPending(true)
    setError(null)

    // Optimistic UI update
    setImages(updatedImages)

    try {
      const payload = updatedImages.map((img) => ({
        image_id: img.id,
        sort_order: img.sort_order,
        is_primary: img.is_primary,
        alt_text: img.alt_text || null,
      }))

      const result = await updateProductImagesAction(
        productId,
        expectedUpdatedAt,
        payload,
        crypto.randomUUID(),
      )

      if (result.success && result.updatedAt) {
        setExpectedUpdatedAt(result.updatedAt)
        onUpdatedAtChange(result.updatedAt)
      } else {
        throw new Error(result.error || 'Failed to update images')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred updating images')
      // Revert optimism by reloading
      window.location.reload()
    } finally {
      setIsPending(false)
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    setIsPending(true)
    setError(null)

    // Optimistic UI
    const originalImages = [...images]
    setImages(images.filter((img) => img.id !== imageId))

    try {
      const result = await deleteProductImageAction(imageId, crypto.randomUUID())
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete image')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred deleting image')
      setImages(originalImages)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-md border border-red-200">{error}</div>
      )}

      <ImageUploader
        productId={productId}
        expectedUpdatedAt={expectedUpdatedAt}
        onUploadSuccess={handleUploadSuccess}
      />

      <div className="mt-8">
        <h3 className="text-sm font-medium text-ink mb-4">Manage Images</h3>
        <ImageReorderList
          images={images}
          onUpdateImages={handleUpdateImages}
          onDeleteImage={handleDeleteImage}
          disabled={isPending}
        />
      </div>
    </div>
  )
}
