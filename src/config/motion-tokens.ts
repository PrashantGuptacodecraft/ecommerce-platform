/**
 * Motion tokens — durations, easings and stagger timing for `motion/react`.
 *
 * Motion is a Phase 1 requirement, not later polish, but must stay tasteful,
 * performant, and respect `prefers-reduced-motion` (docs/PROJECT_BRIEF.md).
 * The motion primitives built in Milestone 2
 * (`src/components/motion/*`) consume these tokens via a shared
 * `useReducedMotion` gate so timing is consistent and centrally tunable.
 *
 * Durations are in SECONDS to match the `motion/react` API. Easings are
 * cubic-bézier control-point tuples `[x1, y1, x2, y2]`.
 */
export const motionTokens = {
  duration: {
    fast: 0.15, // micro-interactions: hovers, small toggles
    standard: 0.3, // most enter/exit transitions
    slowEditorial: 0.6, // hero / editorial reveals
  },

  easing: {
    /** Material-ish standard ease for general UI. */
    standard: [0.4, 0, 0.2, 1],
    /** Expressive ease-out for premium editorial reveals. */
    premium: [0.16, 1, 0.3, 1],
  },

  stagger: {
    delay: 0.06, // per-item delay in StaggerContainer/StaggerItem
  },
} as const

export type MotionTokens = typeof motionTokens
