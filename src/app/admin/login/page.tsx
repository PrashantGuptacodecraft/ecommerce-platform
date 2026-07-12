import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { AdminLoginForm } from '@/features/auth/components/AdminLoginForm'
import { getAdminContext } from '@/lib/security/auth'
import { safeNextPath } from '@/lib/security/auth-core'
import { brand } from '@/config/brand'

export const metadata: Metadata = {
  title: 'Admin sign in',
  robots: { index: false, follow: false },
}

type AdminLoginPageProps = {
  searchParams: Promise<{ next?: string | string[] }>
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  // Already an active admin? Skip the form.
  const { isAdmin } = await getAdminContext()

  const { next } = await searchParams
  const nextParam = typeof next === 'string' ? next : undefined
  const safeNext = safeNextPath(nextParam)

  if (isAdmin) {
    redirect(safeNext)
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-lg font-semibold tracking-[0.2em] text-ink uppercase">{brand.name}</p>
          <p className="mt-1 text-sm text-slate">Store administration</p>
        </div>
        <Card padding="lg">
          <AdminLoginForm next={nextParam} />
        </Card>
        <p className="mt-6 text-center text-xs text-mist">
          Authorized personnel only. Access is monitored.
        </p>
      </div>
    </div>
  )
}
