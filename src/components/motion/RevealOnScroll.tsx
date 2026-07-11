'use client'

import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { duration, ease } from '@/components/motion/motion-config'

type RevealOnScrollProps = {
  children: ReactNode
  className?: string
  delay?: number
  distance?: number
}

/**
 * Reveals content (fade + slight rise) as it scrolls into view, once. Reduced
 * motion → appears with no transform. Uses a viewport margin so the reveal
 * fires slightly before the element is fully on screen.
 */
export function RevealOnScroll({
  children,
  className,
  delay = 0,
  distance = 24,
}: RevealOnScrollProps) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0, y: 0 } : { opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: duration.slowEditorial, delay, ease: ease.premium }}
    >
      {children}
    </motion.div>
  )
}
