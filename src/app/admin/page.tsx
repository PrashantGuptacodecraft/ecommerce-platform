import type { Metadata } from 'next'
import { AdminShell } from '@/components/admin/AdminShell'
import { Card } from '@/components/ui/Card'

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
}

// Placeholder dashboard demonstrating the admin shell. Real metrics + the
// server-side requireAdmin guard arrive in Milestones 10/12; this page exposes
// no live data or mutations.
const placeholderStats = [
  { label: 'Products', hint: 'Milestone 12' },
  { label: 'New orders', hint: 'Milestone 12' },
  { label: 'Low stock', hint: 'Milestone 12' },
  { label: 'Revenue', hint: 'Milestone 12' },
]

export default function AdminDashboardPage() {
  return (
    <AdminShell title="Dashboard">
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
        This is the admin shell foundation. Authentication (Milestone 10), product/category/order
        management, inventory, and settings (Milestones 11–13) populate this area next. Every admin
        page and mutation will be verified server-side before it renders.
      </p>
    </AdminShell>
  )
}
