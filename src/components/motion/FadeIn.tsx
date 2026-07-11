'use client'

import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { duration, ease } from '@/components/motion/motion-config'

type FadeInProps = {
  children: ReactNode
  className?: string
  delay?: number
  durationSeconds?: number
}

/**
 * Fades content in on mount. Under `prefers-reduced-motion` it renders fully
 * visible with no transition (initial === animate).
 */
export function FadeIn({
  children,
  className,
  delay = 0,
  durationSeconds = duration.standard,
}: FadeInProps) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: durationSeconds, delay, ease: ease.standard }}
    >
      {children}
    </motion.div>
  )
}
