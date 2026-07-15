'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { createUploadIntentAction, finalizeImageUploadAction } from '../actions'
import { site } from '@/config/site'
import { CameraIcon, UploadIcon } from '@/components/ui/icons'

type UploadState = 'idle' | 'selected' | 'uploading' | 'verifying' | 'completed' | 'failed'
type CameraState = 'idle' | 'requesting' | 'ready' | 'denied' | 'unavailable' | 'captured'

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
  const [mode, setMode] = useState<'file' | 'camera' | null>(null)

  // Shared state
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<UploadState>('idle')
  const [error, setError] = useState<string | null>(null)

  // Camera specific state
  const [cameraState, setCameraState] = useState<CameraState>('idle')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fallbackInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Cleanup MediaStream tracks when closing camera mode or unmounting
  useEffect(() => {
    return () => {
      stopCamera()
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const handleModeChange = (newMode: 'file' | 'camera' | null) => {
    stopCamera()
    setMode(newMode)
    setFile(null)
    setStatus('idle')
    setError(null)
    setCameraState('idle')
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (fallbackInputRef.current) fallbackInputRef.current.value = ''
  }

  const startCamera = async () => {
    setCameraState('requesting')
    setError(null)
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('NotSupported')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        // Wait for video to be ready to play
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.error)
          setCameraState('ready')
        }
      } else {
        // If ref is not attached for some reason, clean up
        stream.getTracks().forEach((t) => t.stop())
        setCameraState('unavailable')
      }
    } catch (err: any) {
      console.error('Camera error:', err)
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraState('denied')
      } else {
        setCameraState('unavailable')
      }
    }
  }

  const capturePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setError('Failed to capture photo (context missing)')
      return
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError('Failed to capture photo (blob creation failed)')
          return
        }

        const filename = `camera-${Date.now()}.jpg`
        const newFile = new File([blob], filename, { type: 'image/jpeg' })

        if (newFile.size > site.upload.maxBytes) {
          setError('Captured image exceeds the 5MB limit. Please retake.')
          return
        }

        stopCamera()
        setCameraState('captured')
        setFile(newFile)
        setPreviewUrl(URL.createObjectURL(blob))
        setStatus('selected')
        setError(null)
      },
      'image/jpeg',
      0.9,
    )
  }

  const retakePhoto = () => {
    setFile(null)
    setStatus('idle')
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setCameraState('idle')
    startCamera()
  }

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

    // Create preview
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(selectedFile))
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
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
      if (fileInputRef.current) fileInputRef.current.value = ''
      if (fallbackInputRef.current) fallbackInputRef.current.value = ''

      onUploadSuccess(finalizeResult.imageId, finalizeResult.updatedAt)

      // Reset after a brief moment
      setTimeout(() => {
        handleModeChange(null)
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred during upload')
      setStatus('failed')
    }
  }

  // Initial selection view
  if (mode === null) {
    return (
      <div className="border border-fog rounded-lg p-6 bg-paper/50 flex flex-col items-center justify-center text-center gap-4">
        <h3 className="text-sm font-medium text-ink">Add Product Image</h3>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button
            onClick={() => handleModeChange('file')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <UploadIcon className="size-4" />
            Upload File
          </Button>
          <Button
            onClick={() => handleModeChange('camera')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <CameraIcon className="size-4" />
            Take Photo
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-fog rounded-lg p-4 bg-paper/50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-ink flex items-center gap-2">
          {mode === 'camera' ? (
            <CameraIcon className="size-4" />
          ) : (
            <UploadIcon className="size-4" />
          )}
          {mode === 'camera' ? 'Camera Capture' : 'File Upload'}
        </h3>
        <button
          onClick={() => handleModeChange(null)}
          className="text-xs text-mist hover:text-ink transition-colors underline"
          disabled={status === 'uploading' || status === 'verifying'}
        >
          Cancel
        </button>
      </div>

      <div className="space-y-4">
        {mode === 'file' && (
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
        )}

        {mode === 'camera' && (
          <div className="flex flex-col gap-4">
            {cameraState === 'idle' && (
              <div className="flex flex-col items-center p-6 border-2 border-dashed border-fog rounded-md bg-white">
                <CameraIcon className="size-8 text-mist mb-3" />
                <p className="text-sm text-slate mb-4 text-center">
                  Take a live photo of the product
                </p>
                <Button onClick={startCamera}>Open Camera</Button>
              </div>
            )}

            {cameraState === 'requesting' && (
              <div className="flex justify-center p-8 bg-white border border-fog rounded-md">
                <p className="text-sm text-mist animate-pulse">Requesting camera access...</p>
              </div>
            )}

            {(cameraState === 'denied' || cameraState === 'unavailable') && (
              <div className="flex flex-col items-center p-6 border border-fog rounded-md bg-white">
                <p className="text-sm text-red-600 mb-4 text-center">
                  {cameraState === 'denied'
                    ? 'Camera access was denied. Please allow camera permissions in your browser.'
                    : 'Camera is unavailable or not supported on this device.'}
                </p>
                <div className="relative">
                  <Button variant="outline" className="flex items-center gap-2">
                    <UploadIcon className="size-4" />
                    Fallback: Use Native Camera / File
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    ref={fallbackInputRef}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Video Preview */}
            <div
              className={
                cameraState === 'ready'
                  ? 'relative w-full aspect-[4/5] bg-black rounded-md overflow-hidden max-h-[60vh] flex items-center justify-center'
                  : 'hidden'
              }
            >
              <video ref={videoRef} className="w-full h-full object-contain" playsInline muted />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <Button
                  onClick={capturePhoto}
                  className="shadow-lg rounded-full px-6 bg-white text-ink hover:bg-fog"
                >
                  Capture Photo
                </Button>
              </div>
            </div>

            {/* Hidden canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {/* Selected / Preview State (Shared) */}
        {status !== 'idle' && status !== 'completed' && file && previewUrl && (
          <div className="flex flex-col gap-4 mt-4 p-4 bg-white border border-fog rounded-md">
            <div className="flex gap-4">
              <div className="w-20 h-24 shrink-0 bg-paper rounded-md overflow-hidden flex items-center justify-center border border-fog">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col flex-1 justify-center">
                <span className="text-sm font-medium text-ink truncate max-w-[200px]">
                  {file.name}
                </span>
                <span className="text-xs text-slate mt-1">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-accent mt-2">
                  {status}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-end pt-2 border-t border-fog/50">
              {status === 'selected' && mode === 'camera' && (
                <Button onClick={retakePhoto} size="sm" variant="outline">
                  Retake
                </Button>
              )}

              {status === 'selected' && (
                <Button onClick={handleUpload} size="sm" className="min-w-[100px]">
                  {mode === 'camera' ? 'Use Photo' : 'Upload'}
                </Button>
              )}

              {status === 'failed' && (
                <Button onClick={handleUpload} size="sm" variant="outline">
                  Retry Upload
                </Button>
              )}
            </div>
          </div>
        )}

        {status === 'completed' && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md text-center">
            <p className="text-sm font-medium text-green-800">Upload completed successfully!</p>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200 shadow-sm mt-4">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
