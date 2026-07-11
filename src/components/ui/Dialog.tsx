'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utilities/cn'
import { CloseIcon } from '@/components/ui/icons'
import { useMounted, useOverlayDismiss } from '@/components/ui/use-overlay'
import { duration, ease } from '@/components/motion/motion-config'

type DialogProps = {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  className?: string
}

/**
 * Centred modal dialog: portalled, backdrop-dismiss, Escape-dismiss, body
 * scroll lock, focus moved to the panel on open. Reduced motion → fade only.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: DialogProps) {
  const mounted = useMounted()
  const reduce = useReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)

  useOverlayDismiss(open, onClose)
  useEffect(() => {
    if (open) panelRef.current?.focus()
  }, [open])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4">
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
              'relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-lg outline-none',
              className,
            )}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
            transition={{ duration: duration.fast, ease: ease.standard }}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="space-y-1">
                {title ? <h2 className="text-lg font-medium text-ink">{title}</h2> : null}
                {description ? <p className="text-sm text-slate">{description}</p> : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="-m-1 rounded-md p-1 text-slate transition-colors hover:bg-ink/5"
              >
                <CloseIcon className="size-5" />
              </button>
            </div>
            {children}
            {footer ? <div className="mt-6 flex justify-end gap-3">{footer}</div> : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
