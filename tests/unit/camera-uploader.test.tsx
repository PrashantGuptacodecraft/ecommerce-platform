import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ImageUploader } from '../../src/features/admin/images/components/ImageUploader'
import * as actions from '../../src/features/admin/images/actions'
import { site } from '../../src/config/site'

// Mock actions
vi.mock('../../src/features/admin/images/actions', () => ({
  createUploadIntentAction: vi.fn(),
  finalizeImageUploadAction: vi.fn(),
}))

describe('ImageUploader - Camera Integration', () => {
  const defaultProps = {
    productId: 'test-product',
    expectedUpdatedAt: '2024-01-01',
    onUploadSuccess: vi.fn(),
  }

  let originalMediaDevices: any
  let originalCreateObjectURL: any
  let originalRevokeObjectURL: any

  beforeEach(() => {
    vi.clearAllMocks()
    originalMediaDevices = navigator.mediaDevices
    originalCreateObjectURL = URL.createObjectURL
    originalRevokeObjectURL = URL.revokeObjectURL

    URL.createObjectURL = vi.fn(() => 'blob:test')
    URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: originalMediaDevices,
      configurable: true,
    })
    URL.createObjectURL = originalCreateObjectURL
    URL.revokeObjectURL = originalRevokeObjectURL
  })

  it('unsupported getUserMedia fallback', async () => {
    // Remove mediaDevices
    Object.defineProperty(navigator, 'mediaDevices', {
      value: undefined,
      configurable: true,
    })

    render(<ImageUploader {...defaultProps} />)

    // Click Take Photo
    fireEvent.click(screen.getByText('Take Photo'))

    // Click Open Camera
    fireEvent.click(screen.getByText('Open Camera'))

    // Should show fallback
    await waitFor(() => {
      expect(screen.getByText(/Camera is unavailable or not supported/i)).toBeInTheDocument()
      expect(screen.getByText('Fallback: Use Native Camera / File')).toBeInTheDocument()
    })

    // The fallback input should have capture="environment"
    const fileInput = document.querySelector('input[capture="environment"]')
    expect(fileInput).toBeInTheDocument()
  })

  it('camera permission denial', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi
          .fn()
          .mockRejectedValue(new DOMException('Permission denied', 'NotAllowedError')),
      },
      configurable: true,
    })

    render(<ImageUploader {...defaultProps} />)

    fireEvent.click(screen.getByText('Take Photo'))
    fireEvent.click(screen.getByText('Open Camera'))

    await waitFor(() => {
      expect(screen.getByText(/Camera access was denied/i)).toBeInTheDocument()
    })
  })

  it('stream tracks stop on close/unmount', async () => {
    const mockTrack = { stop: vi.fn() }
    const mockStream = { getTracks: () => [mockTrack] }

    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
      configurable: true,
    })

    const { unmount } = render(<ImageUploader {...defaultProps} />)

    fireEvent.click(screen.getByText('Take Photo'))
    fireEvent.click(screen.getByText('Open Camera'))

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled()
    })

    // Simulate clicking cancel
    fireEvent.click(screen.getByText('Cancel'))
    expect(mockTrack.stop).toHaveBeenCalledTimes(1)

    // Test unmount
    fireEvent.click(screen.getByText('Take Photo'))
    fireEvent.click(screen.getByText('Open Camera'))
    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(2)
    })
    unmount()
    expect(mockTrack.stop).toHaveBeenCalledTimes(2)
  })

  it('standard file upload remains functional', async () => {
    render(<ImageUploader {...defaultProps} />)

    fireEvent.click(screen.getByText('Upload File'))

    const fileInput = document.querySelector(
      'input[type="file"]:not([capture])',
    ) as HTMLInputElement
    expect(fileInput).toBeInTheDocument()

    const file = new File(['dummy content'], 'test.png', { type: 'image/png' })
    fireEvent.change(fileInput, { target: { files: [file] } })

    expect(screen.getByText('test.png')).toBeInTheDocument()
    expect(screen.getByText('Upload')).toBeInTheDocument()
  })

  it('retake does not upload', async () => {
    const mockTrack = { stop: vi.fn() }
    const mockStream = { getTracks: () => [mockTrack] }

    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
      configurable: true,
    })

    render(<ImageUploader {...defaultProps} />)

    fireEvent.click(screen.getByText('Take Photo'))
    fireEvent.click(screen.getByText('Open Camera'))

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled()
    })

    // Mock canvas context
    const mockDrawImage = vi.fn()
    const mockToBlob = vi.fn((cb) => cb(new Blob(['test'], { type: 'image/jpeg' })))
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      drawImage: mockDrawImage,
    })) as any
    HTMLCanvasElement.prototype.toBlob = mockToBlob as any

    // Need to mock video width/height
    Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', { value: 640 })
    Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', { value: 480 })

    fireEvent.click(screen.getByText('Capture Photo'))

    await waitFor(() => {
      expect(screen.getByText('Retake')).toBeInTheDocument()
    })

    expect(actions.createUploadIntentAction).not.toHaveBeenCalled()

    fireEvent.click(screen.getByText('Retake'))

    await waitFor(() => {
      // It should restart the camera
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(2)
    })

    expect(actions.createUploadIntentAction).not.toHaveBeenCalled()
  })
})
