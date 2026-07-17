import { requireCustomer } from '@/features/auth/server-customer'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatPaise } from '@/lib/utilities/money'
import Link from 'next/link'

export const metadata = {
  title: 'Order Details | RK VASTRAM',
}

export default async function OrderDetailPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  await requireCustomer()
  const supabase = await createClient()
  const { orderNumber } = await params

  // Secure fetch: RLS ensures we only get it if it belongs to the authenticated customer
  const { data: order } = await supabase
    .from('orders')
    .select(`
      id, order_number, status, payment_method, 
      subtotal_paise, shipping_paise, discount_paise, total_paise, notes, created_at,
      addresses (full_name, phone, email, address_line1, address_line2, landmark, city, state, postal_code),
      order_items (id, product_name_snapshot, sku_snapshot, size_snapshot, colour_snapshot, unit_price_paise_snapshot, quantity, line_total_paise, product_image_snapshot)
    `)
    .eq('order_number', orderNumber)
    .single()

  if (!order) {
    notFound()
  }

  const address = order.addresses

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-ink">Order #{order.order_number}</h1>
          <p className="mt-1 text-sm text-charcoal-400">
            Placed on {new Date(order.created_at).toLocaleDateString()}
          </p>
        </div>
        <Link
          href="/account/orders"
          className="text-sm font-medium text-charcoal-600 hover:text-ink"
        >
          &larr; Back to Orders
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-charcoal-200 bg-paper">
        <div className="border-b border-charcoal-200 px-4 py-5 sm:px-6">
          <h3 className="text-base font-medium leading-6 text-ink">Order Status</h3>
          <p className="mt-1 max-w-2xl text-sm text-charcoal-500">{order.status}</p>
        </div>
        
        <div className="px-4 py-5 sm:p-6">
          <ul role="list" className="divide-y divide-charcoal-200">
            {order.order_items.map((item: any) => (
              <li key={item.id} className="flex py-6">
                <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-charcoal-200 bg-charcoal-50">
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
                      <p className="ml-4">{formatPaise(item.line_total_paise)}</p>
                    </div>
                    <p className="mt-1 text-sm text-charcoal-500">{item.colour_snapshot} | {item.size_snapshot}</p>
                  </div>
                  <div className="flex flex-1 items-end justify-between text-sm">
                    <p className="text-charcoal-500">Qty {item.quantity}</p>
                    <p className="text-charcoal-500">{formatPaise(item.unit_price_paise_snapshot)} each</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-charcoal-50 px-4 py-6 sm:px-6">
          <div className="sm:flex sm:items-start sm:justify-between">
            <div className="mb-6 sm:mb-0 sm:w-1/2">
              <h4 className="text-sm font-medium text-ink">Shipping Address</h4>
              {address && (
                <address className="mt-2 text-sm not-italic text-charcoal-600">
                  <span className="block">{address.full_name}</span>
                  <span className="block">{address.address_line1}</span>
                  {address.address_line2 && <span className="block">{address.address_line2}</span>}
                  <span className="block">{address.city}, {address.state} {address.postal_code}</span>
                  <span className="block mt-2 font-medium">Phone: {address.phone}</span>
                </address>
              )}
            </div>

            <div className="sm:w-1/2 sm:max-w-xs">
              <h4 className="text-sm font-medium text-ink">Order Summary</h4>
              <dl className="mt-4 space-y-4 text-sm text-charcoal-600">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd className="text-ink">{formatPaise(order.subtotal_paise)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Shipping</dt>
                  <dd className="text-ink">{formatPaise(order.shipping_paise)}</dd>
                </div>
                {order.discount_paise > 0 && (
                  <div className="flex justify-between">
                    <dt>Discount</dt>
                    <dd className="text-green-600">-{formatPaise(order.discount_paise)}</dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-charcoal-200 pt-4 font-medium">
                  <dt className="text-base text-ink">Total</dt>
                  <dd className="text-base text-ink">{formatPaise(order.total_paise)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
