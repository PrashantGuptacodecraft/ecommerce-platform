/**
 * Supabase Storage public-URL builder for product images.
 *
 * SECURITY: This helper constructs URLs from user-stored `storage_path` values.
 * It validates the path before concatenation so that:
 *   - Path-traversal (`..`) is rejected.
 *   - Absolute URLs / protocol prefixes are rejected.
 *   - Query strings and fragments are rejected.
 *   - Service-role credentials are never exposed (we only use the public URL).
 *
 * If `NEXT_PUBLIC_SUPABASE_URL` is not configured the helper returns `null`
 * rather than constructing a broken URL.
 */

/** The Supabase Storage bucket name used for product images. */
export const PRODUCT_IMAGE_BUCKET = 'product-images' as const

/**
 * Build the public URL for a product image stored in Supabase Storage.
 *
 * @param storagePath - Relative path inside the `product-images` bucket,
 *   e.g. `"products/abc-123/image.webp"`. Null / undefined / blank values
 *   safely return `null`.
 * @returns The full public URL string, or `null` when the input is invalid or
 *   the Supabase base URL env var is missing.
 */
export function getProductImageUrl(storagePath: string | null | undefined): string | null {
  // Handle null, undefined, empty, or whitespace-only paths.
  if (!storagePath || storagePath.trim().length === 0) return null

  const trimmed = storagePath.trim()

  // Reject path-traversal attempts.
  if (trimmed.includes('..')) return null

  // Reject absolute URLs or protocol prefixes (e.g. "https://evil.com/x").
  if (/^[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(trimmed)) return null

  // Reject paths that start with "//" (protocol-relative URLs).
  if (trimmed.startsWith('//')) return null

  // Reject query strings or fragment identifiers.
  if (trimmed.includes('?') || trimmed.includes('#')) return null

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return null

  // Strip any trailing slash from the base URL to avoid double-slashes.
  const base = supabaseUrl.replace(/\/+$/, '')

  return `${base}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/${trimmed}`
}
