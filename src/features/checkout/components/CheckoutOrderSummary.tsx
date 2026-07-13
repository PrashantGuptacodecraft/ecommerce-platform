import { getCart } from '@/features/cart/queries'
import { getShippingSettings } from '@/features/checkout/queries'
import { formatPaise } from '@/lib/utilities/money'

export async function CheckoutOrderSummary() {
  const cart = await getCart()
  const shippingSettings = await getShippingSettings()

  if (!cart || cart.items.length === 0) {
    return <div className="p-6 bg-neutral-50 rounded-lg">Your cart is empty.</div>
  }

  const subtotal = cart.subtotalPaise
  const shipping =
    shippingSettings.freeThresholdPaise > 0 && subtotal >= shippingSettings.freeThresholdPaise
      ? 0
      : shippingSettings.flatRatePaise
  const total = subtotal + shipping

  return (
    <div className="p-6 bg-neutral-50 rounded-lg space-y-6">
      <h2 className="text-xl font-medium tracking-tight">Order Summary</h2>

      <ul className="space-y-4">
        {cart.items.map((item) => (
          <li key={item.id} className="flex justify-between text-sm">
            <div>
              <p className="font-medium">{item.product.name}</p>
              <p className="text-neutral-500">Qty: {item.quantity}</p>
              {item.state !== 'available' && (
                <p className="text-red-500 text-xs">
                  {item.state === 'insufficient_stock' ? 'Insufficient stock' : 'Unavailable'}
                </p>
              )}
            </div>
            <p className="font-medium">{formatPaise(item.lineTotalPaise)}</p>
          </li>
        ))}
      </ul>

      <div className="pt-4 border-t space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-600">Subtotal</span>
          <span>{formatPaise(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-600">Shipping</span>
          <span>{shipping === 0 ? 'Free' : formatPaise(shipping)}</span>
        </div>
      </div>

      <div className="pt-4 border-t flex justify-between font-medium text-lg">
        <span>Total</span>
        <span>{formatPaise(total)}</span>
      </div>
    </div>
  )
}
