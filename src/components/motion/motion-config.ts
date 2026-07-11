import { motionTokens } from '@/config/motion-tokens'

/**
 * Motion config shared by every primitive in this folder. Cubic-bézier tuples
 * are copied into mutable arrays because `motion/react` types expect
 * `[number, number, number, number]`, not the readonly token tuples.
 */
export const ease = {
  standard: [...motionTokens.easing.standard] as [number, number, number, number],
  premium: [...motionTokens.easing.premium] as [number, number, number, number],
}

export const duration = motionTokens.duration
export const staggerDelay = motionTokens.stagger.delay
