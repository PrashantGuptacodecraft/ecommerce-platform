'use client'

import type { ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { duration, ease } from '@/components/motion/motion-config'

type AnimatedDrawerProps = {
  open: boolean
  children: ReactNode
  className?: string
  side?: 'left' | 'right'
}

/**
 * Low-level animated presence shell for an edge drawer panel (slide in/out).
 * Backdrop, focus handling, scroll lock, and portal live in `ui/Drawer`, which
 * composes this. Reduced motion → fade instead of slide.
 */
export function AnimatedDrawer({ open, children, className, side = 'right' }: AnimatedDrawerProps) {
  const reduce = useReducedMotion()
  const offscreen = side === 'right' ? '100%' : '-100%'
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className={className}
          initial={reduce ? { opacity: 0 } : { x: offscreen }}
          animate={reduce ? { opacity: 1 } : { x: 0 }}
          exit={reduce ? { opacity: 0 } : { x: offscreen }}
          transition={{ duration: duration.standard, ease: ease.premium }}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
