'use client'

import { useEffect, useSyncExternalStore } from 'react'

const noopSubscribe = () => () => {}

/**
 * True only on the client (after mount) — gate `createPortal` so overlays don't
 * touch `document` during SSR. Uses `useSyncExternalStore` (server snapshot
 * `false`, client snapshot `true`) so there is no setState-in-effect and no
 * hydration mismatch.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  )
}

/**
 * While `open`, close on Escape and lock body scroll. Restores on close/unmount.
 * (Full focus-trapping is a Milestone 15 accessibility-pass concern; this
 * covers dismissal + scroll containment.)
 */
export function useOverlayDismiss(open: boolean, onClose: () => void): void {
  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])
}
