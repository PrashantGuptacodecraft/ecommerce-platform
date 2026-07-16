'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { logoutAction } from '@/features/auth/actions/auth-actions'

export function LogoutButton() {
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setIsPending(true)
    await logoutAction()
    // Force a hard refresh to clear any cached states
    window.location.href = '/'
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
    >
      {isPending ? 'Signing out...' : 'Sign out'}
    </button>
  )
}
