import type { Metadata } from 'next'
import { Card } from '@/components/ui/Card'
import { AdminLoginForm } from '@/features/auth/components/AdminLoginForm'
import { brand } from '@/config/brand'

export const metadata: Metadata = {
  title: 'Admin sign in',
  robots: { index: false, follow: false },
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-lg font-semibold tracking-[0.2em] text-ink uppercase">{brand.name}</p>
          <p className="mt-1 text-sm text-slate">Store administration</p>
        </div>
        <Card padding="lg">
          <AdminLoginForm />
        </Card>
        <p className="mt-6 text-center text-xs text-mist">
          Authorized personnel only. Access is monitored.
        </p>
      </div>
    </div>
  )
}
