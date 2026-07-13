import { getCart } from '@/features/cart/queries'
import { CheckoutForm } from '@/features/checkout/components/CheckoutForm'
import { CheckoutOrderSummary } from '@/features/checkout/components/CheckoutOrderSummary'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Checkout | STUDIO NOIR',
}

export default async function CheckoutPage() {
  const cart = await getCart()

  if (!cart || cart.items.length === 0) {
    redirect('/cart')
  }

  // Generate a fingerprint of the current cart state for the idempotency payload hash
  const cartFingerprint = cart.items
    .filter(i => i.state === 'available')
    .map(i => `${i.variant_id}:${i.quantity}`)
    .sort()
    .join('|')

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
      <h1 className="text-3xl font-light tracking-tight mb-8">Checkout</h1>
      
      <div className="grid lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-7">
          <CheckoutForm cartFingerprint={cartFingerprint} />
        </div>
        
        <div className="lg:col-span-5 sticky top-8">
          <CheckoutOrderSummary />
        </div>
      </div>
    </div>
  )
}
