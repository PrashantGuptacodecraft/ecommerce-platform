'use client'

import type { ReactNode } from 'react'
import { motion, useReducedMotion, type Variants } from 'motion/react'
import { duration, ease, staggerDelay } from '@/components/motion/motion-config'

type StaggerProps = {
  children: ReactNode
  className?: string
}

/**
 * Orchestrates a staggered reveal of its `StaggerItem` children as the group
 * scrolls into view. Reduced motion collapses the stagger to an instant show.
 */
export function StaggerContainer({ children, className }: StaggerProps) {
  const reduce = useReducedMotion()
  const container: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduce ? 0 : staggerDelay },
    },
  }
  return (
    <motion.div
      className={className}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
    >
      {children}
    </motion.div>
  )
}

type StaggerItemProps = {
  children: ReactNode
  className?: string
  distance?: number
}

export function StaggerItem({ children, className, distance = 16 }: StaggerItemProps) {
  const reduce = useReducedMotion()
  const item: Variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: distance },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: duration.standard, ease: ease.premium },
    },
  }
  return (
    <motion.div className={className} variants={item}>
      {children}
    </motion.div>
  )
}
