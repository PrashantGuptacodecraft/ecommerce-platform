'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { createUploadIntentAction, finalizeImageUploadAction } from '../actions'
import { site } from '@/config/site'

type UploadState = 'idle' | 'selected' | 'uploading' | 'verifying' | 'completed' | 'failed'

type ImageUploaderProps = {
  productId: string
  expectedUpdatedAt: string
  onUploadSuccess: (imageId: string, newUpdatedAt: string) => void
}

export function ImageUploader({
  productId,
  expectedUpdatedAt,
  onUploadSuccess,
}: ImageUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<UploadState>('idle')
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) {
      setFile(null)
      setStatus('idle')
      return
    }

    if (!site.upload.acceptedImageTypes.includes(selectedFile.type as any)) {
      setError('Unsupported file type. Please upload a valid image.')
      setStatus('failed')
      return
    }

    if (selectedFile.size > site.upload.maxBytes) {
      setError('File size exceeds the 5MB limit.')
      setStatus('failed')
      return
    }

    setFile(selectedFile)
    setStatus('selected')
    setError(null)
  }

  const handleUpload = async () => {
    if (!file || status === 'uploading' || status === 'verifying') return

    setStatus('uploading')
    setError(null)
    const idempotencyKey = crypto.randomUUID()

    try {
      // 1. Initiate Intent
      const intentResult = await createUploadIntentAction(
        productId,
        { mimeType: file.type, sizeBytes: file.size },
        idempotencyKey,
      )

      if (!intentResult.success || !intentResult.intentId || !intentResult.signedUrl) {
        throw new Error(intentResult.error || 'Failed to initialize upload')
      }

      // 2. Upload to Signed URL
      const uploadResponse = await fetch(intentResult.signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image file to storage')
      }

      setStatus('verifying')

      // 3. Finalize
      const finalizeResult = await finalizeImageUploadAction(
        intentResult.intentId,
        expectedUpdatedAt,
        crypto.randomUUID(), // New idempotency key for finalization
      )

      if (!finalizeResult.success || !finalizeResult.updatedAt || !finalizeResult.imageId) {
        throw new Error(finalizeResult.error || 'Failed to verify and finalize image')
      }

      setStatus('completed')
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      onUploadSuccess(finalizeResult.imageId, finalizeResult.updatedAt)

      // Reset after a brief moment to allow another upload
      setTimeout(() => setStatus('idle'), 2000)
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred during upload')
      setStatus('failed')
    }
  }

  return (
    <div className="border border-fog rounded-md p-4 bg-paper/50">
      <h3 className="text-sm font-medium text-ink mb-4">Upload New Image</h3>

      <div className="space-y-4">
        <div>
          <input
            type="file"
            accept={site.upload.acceptedImageTypes.join(',')}
            onChange={handleFileChange}
            ref={fileInputRef}
            className="block w-full text-sm text-slate
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-ink file:text-paper
              hover:file:bg-charcoal cursor-pointer"
            disabled={status === 'uploading' || status === 'verifying'}
          />
          <p className="mt-2 text-xs text-mist">
            Supported: JPEG, PNG, WebP, AVIF up to 5MB. Aspect ratio: 4:5 recommended.
          </p>
        </div>

        {status !== 'idle' && (
          <div className="flex items-center justify-between mt-4 p-3 bg-paper border border-fog rounded-md">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-ink">{file?.name}</span>
              <span className="text-xs text-slate">
                Status: <span className="font-semibold uppercase tracking-wider">{status}</span>
              </span>
            </div>

            {status === 'selected' && (
              <Button onClick={handleUpload} size="sm">
                Start Upload
              </Button>
            )}

            {status === 'failed' && (
              <Button onClick={handleUpload} size="sm" variant="outline">
                Retry
              </Button>
            )}
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md border border-red-200">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
