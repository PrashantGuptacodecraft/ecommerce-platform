import { SpinnerIcon } from '@/components/ui/icons'

// Admin loading fallback — shown while the server-side auth check resolves.
export default function AdminLoading() {
  return (
    <div
      className="flex min-h-dvh items-center justify-center bg-paper"
      role="status"
      aria-label="Loading"
    >
      <SpinnerIcon className="size-6 animate-spin text-mist" />
    </div>
  )
}
