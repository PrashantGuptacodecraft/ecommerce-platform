import { brand } from '@/config/brand'

/**
 * Site-wide constants that are neither pure brand values nor visual tokens:
 * operational limits and defaults referenced across the app.
 *
 * Values the admin must change at runtime (flat shipping rate, free-shipping
 * threshold, COD toggle, active shipping provider) live in `store_settings`,
 * NOT here — these are compile-time constants only.
 */
export const site = {
  name: brand.name,

  /**
   * Public base URL. Overridden per environment; the localhost default keeps
   * local dev working without env wiring. A production build sets the real
   * value. (Kept non-secret and non-`NEXT_PUBLIC_` here since it is a static
   * constant, not read from the client env.)
   */
  defaultUrl: 'http://localhost:3000',

  /** Explicit commercial boundary — max seed products at launch (brief). */
  seedProductCap: 20,

  /** Product imagery is enforced to a 4:5 portrait ratio at upload time. */
  productImageAspectRatio: 4 / 5,

  /** Secure upload constraints (enforced server-side in the admin uploader). */
  upload: {
    maxBytes: 5 * 1024 * 1024, // 5 MB
    acceptedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    acceptedImageExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  },

  /** Below this per-variant stock level the admin UI shows a low-stock flag. */
  lowStockThreshold: 5,

  pagination: {
    storefrontPageSize: 12,
    adminPageSize: 20,
  },
} as const

export type Site = typeof site
