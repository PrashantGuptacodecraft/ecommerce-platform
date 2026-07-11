'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utilities/cn'
import { AlertIcon, CheckIcon, CloseIcon } from '@/components/ui/icons'
import { duration, ease } from '@/components/motion/motion-config'

type ToastVariant = 'default' | 'success' | 'error'

type ToastInput = {
  title: string
  description?: string
  variant?: ToastVariant
  durationMs?: number
}

type ToastRecord = Required<Omit<ToastInput, 'durationMs'>> & { id: number }

type ToastContextValue = {
  toast: (input: ToastInput) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

/** Access the toast dispatcher. Must be used under `<ToastProvider>`. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a <ToastProvider>')
  return ctx
}

const VARIANT_STYLES: Record<ToastVariant, string> = {
  default: 'border-ink/10',
  success: 'border-success/30',
  error: 'border-danger/30',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion()
  const [toasts, setToasts] = useState<ToastRecord[]>([])
  const idRef = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    ({ title, description = '', variant = 'default', durationMs = 4000 }: ToastInput) => {
      const id = (idRef.current += 1)
      setToasts((current) => [...current, { id, title, description, variant }])
      // Deterministic id (ref counter) — no Math.random needed.
      window.setTimeout(() => dismiss(id), durationMs)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[var(--z-toast)] flex flex-col items-center gap-2 p-4"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout={!reduce}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
              transition={{ duration: duration.standard, ease: ease.standard }}
              className={cn(
                'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border bg-white px-4 py-3 shadow-md',
                VARIANT_STYLES[t.variant],
              )}
              role="status"
            >
              {t.variant === 'success' ? (
                <CheckIcon className="mt-0.5 size-4 shrink-0 text-success" />
              ) : t.variant === 'error' ? (
                <AlertIcon className="mt-0.5 size-4 shrink-0 text-danger" />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{t.title}</p>
                {t.description ? (
                  <p className="mt-0.5 text-sm text-slate">{t.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="-m-1 rounded p-1 text-mist transition-colors hover:text-ink"
              >
                <CloseIcon className="size-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
