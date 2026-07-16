import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GoogleLoginButton } from '@/features/auth/components/GoogleLoginButton'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const params = await searchParams
  let next = params.next ?? '/account'

  if (
    next.startsWith('http://') || 
    next.startsWith('https://') || 
    next.startsWith('//') || 
    !next.startsWith('/')
  ) {
    next = '/account'
  }

  // If already logged in, redirect to intended destination safely
  if (user) {
    redirect(next)
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-medium tracking-tight text-ink">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-charcoal-400">
            Sign in to your account to securely complete your purchase and track orders.
          </p>
        </div>

        {params.error === 'auth_failed' && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            Authentication failed. Please try again.
          </div>
        )}

        <div className="mt-8">
          <GoogleLoginButton nextPath={next} />
        </div>
      </div>
    </div>
  )
}
