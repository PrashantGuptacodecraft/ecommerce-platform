import { cn } from '@/lib/utilities/cn'
import { AlertIcon } from '@/components/ui/icons'

type FormErrorProps = {
  /** When absent/empty, nothing renders. */
  children?: string | null
  className?: string
  id?: string
}

/**
 * Inline field/form error. `role="alert"` so screen readers announce it when it
 * appears. Render with the field's `aria-describedby` pointing at its `id`.
 */
export function FormError({ children, className, id }: FormErrorProps) {
  if (!children) return null
  return (
    <p
      id={id}
      role="alert"
      className={cn('flex items-center gap-1.5 text-sm text-danger', className)}
    >
      <AlertIcon className="size-4 shrink-0" />
      {children}
    </p>
  )
}
