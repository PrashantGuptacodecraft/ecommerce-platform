import { createAdminClient } from '@/lib/supabase/admin'
import { getExistingCartSessionId } from '@/features/cart/cart-session.server'
import { notFound } from 'next/navigation'
import { formatPaise } from '@/lib/utilities/money'

export const metadata = {
  title: 'Order Confirmation | STUDIO NOIR',
}

export default async function OrderSuccessPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>
}) {
  const { orderNumber } = await params
  const sessionToken = await getExistingCartSessionId()

  if (!sessionToken) {
    notFound()
  }

  const supabase = createAdminClient()

  // Verify ownership: the order must belong to this session via the idempotency record.
  // Since guest orders don't have accounts, the session_token is our only proof of ownership.
  const { data: idempotencyRecord } = await supabase
    .from('order_idempotency_keys')
    .select('order_id')
    .eq('session_token', sessionToken)
    .eq('order_number', orderNumber)
    .single()

  if (!idempotencyRecord) {
    notFound()
  }

  // Fetch the order details
  const { data: order } = await supabase
    .from('orders')
    .select('*, addresses(*), order_items(*)')
    .eq('order_number', orderNumber)
    .single()

  if (!order) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl text-center space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-light tracking-tight">Thank you for your order</h1>
        <p className="text-neutral-500">
          Your order number is <strong className="text-neutral-900">{order.order_number}</strong>
        </p>
      </div>

      <div className="p-6 bg-neutral-50 rounded-lg text-left space-y-6">
        <h2 className="text-lg font-medium">Order Details</h2>

        <div className="space-y-4 border-b pb-6">
          {order.order_items?.map((item: any) => (
            <div key={item.id} className="flex justify-between text-sm">
              <div>
                <p className="font-medium">{item.product_name_snapshot}</p>
                <p className="text-neutral-500">
                  {item.size_snapshot} / {item.colour_snapshot} &times; {item.quantity}
                </p>
              </div>
              <p className="font-medium">{formatPaise(item.line_total_paise)}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-between font-medium pt-2">
          <span>Total Paid (COD)</span>
          <span>{formatPaise(order.total_paise)}</span>
        </div>
      </div>

      <p className="text-sm text-neutral-500">
        We will send a confirmation email to {order.addresses?.email} shortly.
      </p>
    </div>
  )
}
