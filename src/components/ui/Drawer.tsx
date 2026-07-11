'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utilities/cn'
import { CloseIcon } from '@/components/ui/icons'
import { useMounted, useOverlayDismiss } from '@/components/ui/use-overlay'
import { duration, ease } from '@/components/motion/motion-config'

type DrawerProps = {
  open: boolean
  onClose: () => void
  title?: string
  children?: ReactNode
  footer?: ReactNode
  side?: 'left' | 'right'
  className?: string
}

/**
 * Edge drawer (cart / mobile nav): portalled, backdrop + Escape dismiss, body
 * scroll lock, focus to panel on open. Reduced motion → fade instead of slide.
 */
export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  side = 'right',
  className,
}: DrawerProps) {
  const mounted = useMounted()
  const reduce = useReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)

  useOverlayDismiss(open, onClose)
  useEffect(() => {
    if (open) panelRef.current?.focus()
  }, [open])

  if (!mounted) return null

  const offscreen = side === 'right' ? '100%' : '-100%'

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[var(--z-drawer)]">
          <motion.div
            aria-hidden
            onClick={onClose}
            className="absolute inset-0 bg-ink/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.fast }}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            className={cn(
              'absolute top-0 bottom-0 flex w-full max-w-sm flex-col bg-paper shadow-lg outline-none',
              side === 'right' ? 'right-0' : 'left-0',
              className,
            )}
            initial={reduce ? { opacity: 0 } : { x: offscreen }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: offscreen }}
            transition={{ duration: duration.standard, ease: ease.premium }}
          >
            <div className="flex items-center justify-between border-b border-fog px-5 py-4">
              <h2 className="text-base font-medium text-ink">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="-m-1 rounded-md p-1 text-slate transition-colors hover:bg-ink/5"
              >
                <CloseIcon className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
            {footer ? <div className="border-t border-fog px-5 py-4">{footer}</div> : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
