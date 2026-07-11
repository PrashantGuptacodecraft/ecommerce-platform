/**
 * Placeholder brand configuration — "STUDIO NOIR".
 *
 * Real brand assets (name, logo, copy, exact palette, contact details) are
 * NOT yet supplied. Everything brand-specific lives here (and, for values the
 * admin must edit at runtime, in the `store_settings` table) so that swapping
 * in real branding later touches configuration, not components.
 *
 * See docs/PROJECT_BRIEF.md §"Brand details" and docs/DECISIONS.md (#1).
 */
export const brand = {
  name: 'STUDIO NOIR',
  shortName: 'Studio Noir',
  tagline: 'Considered essentials, quietly premium.',
  description:
    'A refined, mobile-first clothing store — modern silhouettes in a restrained neutral palette.',

  /**
   * Placeholder contact details. Values the store admin needs to change without
   * a deploy are additionally surfaced from `store_settings`; these constants
   * are the compile-time fallback / default.
   */
  contact: {
    email: 'hello@studionoir.example',
    supportEmail: 'orders@studionoir.example',
    phone: '+91 00000 00000',
    whatsappNumber: '+910000000000',
    addressLine: 'India',
  },

  social: {
    instagram: 'https://instagram.com/',
    facebook: 'https://facebook.com/',
  },

  /** One store, one currency in Phase 1 (docs/PHASE_1_SCOPE.md). */
  currency: 'INR',
  currencySymbol: '₹',
  locale: 'en-IN',
} as const

export type Brand = typeof brand
