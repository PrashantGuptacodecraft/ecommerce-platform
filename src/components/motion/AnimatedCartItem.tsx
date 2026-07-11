'use client'

import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { duration, ease } from '@/components/motion/motion-config'

type AnimatedCartItemProps = {
  children: ReactNode
  className?: string
}

/**
 * Animated wrapper for a cart line item: springs in on add and collapses out on
 * remove. Intended to be used as a direct child of `AnimatePresence` (with a
 * stable `key`) by the cart drawer/page in Milestone 5. Reduced motion → fade
 * with no height/scale movement.
 */
export function AnimatedCartItem({ children, className }: AnimatedCartItemProps) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      layout={!reduce}
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0, scale: 0.98 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, height: 'auto', scale: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0, scale: 0.98 }}
      transition={{ duration: duration.standard, ease: ease.standard }}
    >
      {children}
    </motion.div>
  )
}
