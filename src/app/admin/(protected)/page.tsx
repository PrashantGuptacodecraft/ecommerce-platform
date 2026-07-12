import { getDashboardMetrics } from '@/features/admin/dashboard/queries'

export default async function AdminDashboardPage() {
  const metrics = await getDashboardMetrics()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Active Products" value={metrics.activeProducts} />
        <MetricCard title="Active Categories" value={metrics.activeCategories} />
        <MetricCard title="Active Variants" value={metrics.activeVariants} />

        <MetricCard
          title="Low Stock Variants"
          value={metrics.lowStockVariants}
          alert={metrics.lowStockVariants > 0}
        />
        <MetricCard
          title="Out of Stock Variants"
          value={metrics.outOfStockVariants}
          alert={metrics.outOfStockVariants > 0}
          critical={metrics.outOfStockVariants > 0}
        />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recently Updated Products</h2>
        <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
          <ul className="divide-y divide-gray-200">
            {metrics.recentProducts.map((p) => (
              <li key={p.id} className="p-4 hover:bg-gray-50 flex justify-between items-center">
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-gray-500">{p.slug}</div>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(p.updated_at).toLocaleDateString()}
                </div>
              </li>
            ))}
            {metrics.recentProducts.length === 0 && (
              <li className="p-4 text-gray-500 text-center">No products yet</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}

function MetricCard({
  title,
  value,
  alert,
  critical,
}: {
  title: string
  value: number
  alert?: boolean
  critical?: boolean
}) {
  return (
    <div
      className={`p-6 rounded-lg border ${critical ? 'border-red-300 bg-red-50 text-red-900' : alert ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-gray-200 bg-white'}`}
    >
      <h3 className="text-sm font-medium opacity-80">{title}</h3>
      <div className="mt-2 text-3xl font-bold">{value}</div>
    </div>
  )
}
