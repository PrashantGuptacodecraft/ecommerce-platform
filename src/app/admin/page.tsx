import type { Metadata } from 'next'
import { AdminShell } from '@/components/admin/AdminShell'
import { Card } from '@/components/ui/Card'
import { requireAdmin } from '@/lib/security/auth'

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
}

// Placeholder dashboard. Real metrics arrive in Milestone 12; this page exposes
// no live data. requireAdmin() is called here as well (belt-and-braces with the
// layout guard) — every protected admin page/action must call it.
const placeholderStats = [
  { label: 'Products', hint: 'Milestone 12' },
  { label: 'New orders', hint: 'Milestone 12' },
  { label: 'Low stock', hint: 'Milestone 12' },
  { label: 'Revenue', hint: 'Milestone 12' },
]

export default async function AdminDashboardPage() {
  const admin = await requireAdmin()

  return (
    <AdminShell title="Dashboard">
      <p className="mb-6 text-sm text-slate">
        Signed in as <span className="text-ink">{admin.email ?? 'admin'}</span>.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {placeholderStats.map((stat) => (
          <Card key={stat.label}>
            <p className="text-sm text-slate">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold text-mist">—</p>
            <p className="mt-1 text-xs text-mist">{stat.hint}</p>
          </Card>
        ))}
      </div>
      <p className="mt-8 max-w-2xl text-sm text-slate">
        This is the admin shell foundation. Product/category/order management, inventory, and
        settings (Milestones 11–13) populate this area next. Every admin page and mutation is
        verified server-side via <code>requireAdmin()</code>.
      </p>
    </AdminShell>
  )
}
