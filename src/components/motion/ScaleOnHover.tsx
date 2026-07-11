'use client'

import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { duration, ease } from '@/components/motion/motion-config'

type ScaleOnHoverProps = {
  children: ReactNode
  className?: string
  scale?: number
}

/**
 * Subtle scale on hover/press for cards and image tiles. Reduced motion
 * disables the scale entirely (no hover/tap transform).
 */
export function ScaleOnHover({ children, className, scale = 1.02 }: ScaleOnHoverProps) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      whileHover={reduce ? undefined : { scale }}
      whileTap={reduce ? undefined : { scale: 0.99 }}
      transition={{ duration: duration.fast, ease: ease.standard }}
    >
      {children}
    </motion.div>
  )
}
