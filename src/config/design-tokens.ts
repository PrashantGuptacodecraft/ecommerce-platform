/**
 * Design tokens — the single source of truth for the visual system.
 *
 * Milestone 0 defines the token values; they are wired into the Tailwind
 * theme and consumed by the `ui/` primitives in Milestone 2
 * (docs/phases/PHASE_1_IMPLEMENTATION_CHECKLIST.md). Keeping them as a typed
 * object here means non-Tailwind consumers (inline styles, motion, canvas,
 * JSON-LD theming) read the same numbers as the utility classes.
 *
 * Palette: refined neutral fashion range ("STUDIO NOIR" placeholder) plus a
 * single restrained warm-taupe accent — see docs/DECISIONS.md (#1).
 */
export const designTokens = {
  /** Colours as hex strings (sRGB). Neutrals run ink → paper. */
  colors: {
    ink: '#141414', // primary text, near-black surfaces
    charcoal: '#2b2b2b',
    slate: '#5f5f5f', // secondary text
    mist: '#9a9a9a', // muted text, disabled
    fog: '#e4e1dc', // hairline borders, subtle fills
    paper: '#f7f6f3', // page background (off-white)
    white: '#ffffff',

    accent: '#8a6a4f', // single restrained accent (warm taupe)
    accentHover: '#75593f',
    accentContrast: '#ffffff', // text/icon on accent surfaces

    success: '#2f6f4f',
    warning: '#9a7b1f',
    danger: '#9a3324',
  },

  /** Modular type scale (rem), mobile-first. */
  typeScale: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.375rem', // 22px
    '2xl': '1.75rem', // 28px
    '3xl': '2.25rem', // 36px
    '4xl': '3rem', // 48px
    '5xl': '3.75rem', // 60px — editorial headings
  },

  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
  },

  /** Spacing scale (rem) — 4px base grid. */
  spacing: {
    px: '1px',
    xs: '0.25rem', // 4
    sm: '0.5rem', // 8
    md: '0.75rem', // 12
    lg: '1rem', // 16
    xl: '1.5rem', // 24
    '2xl': '2rem', // 32
    '3xl': '3rem', // 48
    '4xl': '4rem', // 64
    '5xl': '6rem', // 96
  },

  radius: {
    none: '0px',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },

  shadow: {
    none: 'none',
    sm: '0 1px 2px 0 rgb(20 20 20 / 0.05)',
    md: '0 4px 12px -2px rgb(20 20 20 / 0.08)',
    lg: '0 12px 32px -8px rgb(20 20 20 / 0.14)',
  },

  /** Max content widths (rem). */
  container: {
    sm: '40rem', // 640
    md: '48rem', // 768
    lg: '64rem', // 1024
    xl: '80rem', // 1280
  },

  /** Stacking order — keep strictly ascending so overlays never collide. */
  zIndex: {
    base: 0,
    dropdown: 100,
    header: 200,
    drawer: 300,
    overlay: 400,
    modal: 500,
    toast: 600,
  },

  /** Design/test breakpoints (px). Mobile-first from 360px up. */
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
} as const

export type DesignTokens = typeof designTokens
