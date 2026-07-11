'use client'

import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { duration, ease } from '@/components/motion/motion-config'

type SlideUpProps = {
  children: ReactNode
  className?: string
  delay?: number
  distance?: number
}

/**
 * Fades + slides content up on mount. Reduced motion → fade only, no travel.
 */
export function SlideUp({ children, className, delay = 0, distance = 16 }: SlideUpProps) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0, y: 0 } : { opacity: 0, y: distance }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.standard, delay, ease: ease.premium }}
    >
      {children}
    </motion.div>
  )
}
