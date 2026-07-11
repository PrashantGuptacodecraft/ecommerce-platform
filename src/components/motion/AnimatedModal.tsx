'use client'

import type { ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { duration, ease } from '@/components/motion/motion-config'

type AnimatedModalProps = {
  open: boolean
  children: ReactNode
  className?: string
}

/**
 * Low-level animated presence shell for a centred modal panel (fade + subtle
 * scale). Backdrop, focus handling, and portal live in `ui/Dialog`, which
 * composes this. Reduced motion → fade only, no scale.
 */
export function AnimatedModal({ open, children, className }: AnimatedModalProps) {
  const reduce = useReducedMotion()
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className={className}
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
          transition={{ duration: duration.fast, ease: ease.standard }}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
