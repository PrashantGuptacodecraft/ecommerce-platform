'use client'

import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { duration, ease } from '@/components/motion/motion-config'

type PageTransitionProps = {
  children: ReactNode
  className?: string
}

/**
 * Wraps page content in a gentle fade/rise on mount. Reduced motion → no
 * transform, instant. (Kept transform-light to avoid layout jank on nav.)
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.standard, ease: ease.premium }}
    >
      {children}
    </motion.div>
  )
}
