'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { FadeIn } from '@/components/motion/FadeIn'
import { SlideUp } from '@/components/motion/SlideUp'
import { brand } from '@/config/brand'

/**
 * Route error boundary. Shows a generic, human message + an optional short
 * reference id (`error.digest`). Internal details/stack are logged server-side
 * by Next and never rendered to the client (docs/SECURITY_MODEL.md §4).
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Client-side breadcrumb only — no sensitive detail. Server logging is
    // handled by the framework.
    console.error('A client error boundary was triggered.')
  }, [error])

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <FadeIn>
        <span className="text-sm font-semibold tracking-[0.22em] text-slate uppercase">
          {brand.name}
        </span>
      </FadeIn>
      <SlideUp>
        <div className="space-y-3">
          <h1 className="font-serif text-3xl text-ink">Something went wrong</h1>
          <p className="mx-auto max-w-sm text-sm text-slate">
            An unexpected error occurred. Please try again — if it keeps happening, contact us.
          </p>
          {error.digest ? <p className="text-xs text-mist">Reference: {error.digest}</p> : null}
        </div>
      </SlideUp>
      <FadeIn delay={0.1}>
        <Button onClick={reset}>Try again</Button>
      </FadeIn>
    </main>
  )
}
