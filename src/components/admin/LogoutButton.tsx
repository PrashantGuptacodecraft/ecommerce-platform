'use client'

import { signOutAdmin } from '@/features/auth/actions/sign-out'
import { cn } from '@/lib/utilities/cn'

type LogoutButtonProps = {
  className?: string
}

/**
 * Admin logout. A form posting to the `signOutAdmin` server action. Client
 * component so it can live inside the client `AdminSidebar`; the server action
 * clears the session cookies and redirects.
 */
export function LogoutButton({ className }: LogoutButtonProps) {
  return (
    <form action={signOutAdmin}>
      <button
        type="submit"
        className={cn(
          'w-full rounded-md px-3 py-2 text-left text-sm text-slate transition-colors hover:bg-ink/5 hover:text-ink',
          className,
        )}
      >
        Sign out
      </button>
    </form>
  )
}
