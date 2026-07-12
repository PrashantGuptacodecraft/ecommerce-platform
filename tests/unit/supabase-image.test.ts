import { describe, it, expect, vi, beforeEach } from 'vitest'

// We mock the env var since the utility reads it directly.
const MOCK_SUPABASE_URL = 'https://test-project.supabase.co'

describe('getProductImageUrl', () => {
  let getProductImageUrl: typeof import('@/lib/utilities/supabase-image').getProductImageUrl

  beforeEach(async () => {
    vi.unstubAllEnvs()
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', MOCK_SUPABASE_URL)
    // Re-import to pick up fresh env
    const mod = await import('@/lib/utilities/supabase-image')
    getProductImageUrl = mod.getProductImageUrl
  })

  it('returns a valid public URL for a normal storage path', () => {
    const url = getProductImageUrl('products/abc-123/image.webp')
    expect(url).toBe(
      'https://test-project.supabase.co/storage/v1/object/public/product-images/products/abc-123/image.webp',
    )
  })

  it('returns null for null', () => {
    expect(getProductImageUrl(null)).toBeNull()
  })

  it('returns null for undefined', () => {
    expect(getProductImageUrl(undefined)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(getProductImageUrl('')).toBeNull()
  })

  it('returns null for whitespace-only string', () => {
    expect(getProductImageUrl('   ')).toBeNull()
  })

  it('rejects path traversal with ..', () => {
    expect(getProductImageUrl('../../../etc/passwd')).toBeNull()
    expect(getProductImageUrl('products/../../../secret')).toBeNull()
  })

  it('rejects absolute URLs', () => {
    expect(getProductImageUrl('https://evil.com/malware.jpg')).toBeNull()
    expect(getProductImageUrl('http://evil.com/x')).toBeNull()
    expect(getProductImageUrl('ftp://evil.com/x')).toBeNull()
  })

  it('rejects protocol-relative URLs', () => {
    expect(getProductImageUrl('//evil.com/x')).toBeNull()
  })

  it('rejects paths with query strings', () => {
    expect(getProductImageUrl('image.webp?token=secret')).toBeNull()
  })

  it('rejects paths with fragments', () => {
    expect(getProductImageUrl('image.webp#section')).toBeNull()
  })

  it('returns null when NEXT_PUBLIC_SUPABASE_URL is not set', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    const mod = await import('@/lib/utilities/supabase-image')
    expect(mod.getProductImageUrl('products/img.webp')).toBeNull()
  })

  it('trims whitespace from storage path', () => {
    const url = getProductImageUrl('  products/img.webp  ')
    expect(url).toBe(
      'https://test-project.supabase.co/storage/v1/object/public/product-images/products/img.webp',
    )
  })

  it('strips trailing slashes from base URL', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co/')
    // Force re-read of env
    const url = getProductImageUrl('img.webp')
    // The path portion (after protocol) should not contain double-slashes.
    const pathPortion = url?.replace(/^https?:\/\//, '') ?? ''
    expect(pathPortion).not.toContain('//')
    expect(url?.startsWith('https://test')).toBe(true)
  })
})
