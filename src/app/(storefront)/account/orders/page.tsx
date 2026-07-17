import { requireCustomer } from '@/features/auth/server-customer'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatPaise } from '@/lib/utilities/money'

export const metadata = {
  title: 'My Orders | RK VASTRAM',
}

export default async function OrdersPage() {
  await requireCustomer()
  const supabase = await createClient()

  // Due to RLS, this will securely fetch only the authenticated customer's orders
  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, status, total_paise, created_at, order_items(quantity, product_name_snapshot, product_image_snapshot)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-ink">My Orders</h1>
        <p className="mt-1 text-sm text-charcoal-400">
          Check the status of recent orders, manage returns, and discover similar products.
        </p>
      </div>

      <div className="space-y-8">
        {(!orders || orders.length === 0) ? (
          <div className="rounded-lg border border-charcoal-200 bg-paper p-12 text-center">
            <h3 className="text-sm font-medium text-ink">No orders found</h3>
            <p className="mt-1 text-sm text-charcoal-400">You haven't placed any orders yet.</p>
            <div className="mt-6">
              <Link
                href="/shop"
                className="inline-flex items-center rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-charcoal-800"
              >
                Start Shopping
              </Link>
            </div>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="overflow-hidden rounded-lg border border-charcoal-200 bg-paper shadow-sm">
              <div className="border-b border-charcoal-200 bg-charcoal-50 p-4 sm:flex sm:items-center sm:justify-between sm:px-6 sm:py-5">
                <dl className="grid flex-1 grid-cols-2 gap-x-6 text-sm sm:grid-cols-4">
                  <div>
                    <dt className="font-medium text-ink">Order number</dt>
                    <dd className="mt-1 text-charcoal-500">{order.order_number}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-ink">Date placed</dt>
                    <dd className="mt-1 text-charcoal-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-ink">Total amount</dt>
                    <dd className="mt-1 font-medium text-ink">
                      {formatPaise(order.total_paise)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-ink">Status</dt>
                    <dd className="mt-1 text-charcoal-500">{order.status}</dd>
                  </div>
                </dl>
                <div className="mt-4 sm:ml-6 sm:mt-0 sm:flex-shrink-0">
                  <Link
                    href={`/account/orders/${order.order_number}`}
                    className="flex items-center justify-center rounded-md border border-charcoal-200 bg-paper px-4 py-2 text-sm font-medium text-ink shadow-sm hover:bg-charcoal-50"
                  >
                    View Details
                  </Link>
                </div>
              </div>

              {/* Order Items Summary */}
              <div className="p-4 sm:px-6">
                <ul role="list" className="divide-y divide-charcoal-200">
                  {order.order_items.map((item, index) => (
                    <li key={index} className="flex py-4">
                      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-charcoal-200 bg-charcoal-50">
                        {item.product_image_snapshot ? (
                          <img
                            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/products/${item.product_image_snapshot}`}
                            alt={item.product_name_snapshot}
                            className="h-full w-full object-cover object-center"
                          />
                        ) : (
                          <div className="h-full w-full bg-charcoal-100" />
                        )}
                      </div>
                      <div className="ml-4 flex flex-1 flex-col">
                        <div>
                          <div className="flex justify-between text-base font-medium text-ink">
                            <h3>{item.product_name_snapshot}</h3>
                          </div>
                        </div>
                        <div className="flex flex-1 items-end justify-between text-sm">
                          <p className="text-charcoal-500">Qty {item.quantity}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
