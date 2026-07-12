import { SpinnerIcon } from '@/components/ui/icons'

// Global route loading fallback. The spin animation is tamed by the global
// reduced-motion rule in globals.css.
export default function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center" role="status" aria-label="Loading">
      <SpinnerIcon className="size-6 animate-spin text-mist" />
    </div>
  )
}
