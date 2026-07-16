import { requireCustomer } from '@/features/auth/server-customer'

export const metadata = {
  title: 'Account Summary | Studio Noir',
}

export default async function AccountPage() {
  const { customer } = await requireCustomer()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-ink">Account Summary</h1>
        <p className="mt-1 text-sm text-charcoal-400">
          Manage your personal information and preferences.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-charcoal-200 bg-paper">
        <div className="px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-charcoal-500">Full Name</dt>
              <dd className="mt-1 text-sm text-ink">{customer.full_name || 'Not provided'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-charcoal-500">Email Address</dt>
              <dd className="mt-1 text-sm text-ink">{customer.email || 'Not provided'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-charcoal-500">Phone Number</dt>
              <dd className="mt-1 text-sm text-ink">{customer.phone || 'Not provided'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-charcoal-500">Member Since</dt>
              <dd className="mt-1 text-sm text-ink">
                {new Date(customer.created_at).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
