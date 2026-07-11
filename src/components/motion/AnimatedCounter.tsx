'use client'

import { useEffect } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { duration as durations, ease } from '@/components/motion/motion-config'

type AnimatedCounterProps = {
  value: number
  className?: string
  /** Formats the (rounded) intermediate value — e.g. cart count, quantity. */
  format?: (n: number) => string
}

/**
 * Animates a number to `value` when it changes (e.g. a cart-count badge).
 * Reduced motion → snaps to the final value with no tween.
 */
export function AnimatedCounter({
  value,
  className,
  format = (n) => String(Math.round(n)),
}: AnimatedCounterProps) {
  const reduce = useReducedMotion()
  const motionValue = useMotionValue(value)
  const rounded = useTransform(motionValue, (latest) => format(latest))

  useEffect(() => {
    if (reduce) {
      motionValue.set(value)
      return
    }
    const controls = animate(motionValue, value, {
      duration: durations.standard,
      ease: ease.standard,
    })
    return () => controls.stop()
  }, [value, reduce, motionValue])

  return <motion.span className={className}>{rounded}</motion.span>
}
