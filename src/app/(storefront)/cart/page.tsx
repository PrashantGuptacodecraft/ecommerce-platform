import type { Metadata } from 'next'
import Link from 'next/link'
import { getCart } from '@/features/cart/queries'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { formatPaise } from '@/lib/utilities/money'
import { CartLineItem } from '@/features/cart/components/CartLineItem'

export const metadata: Metadata = {
  title: 'Your Cart',
}

export default async function CartPage() {
  const cart = await getCart()
  const isEmpty = !cart || cart.items.length === 0

  return (
    <Container className="py-12 md:py-24 max-w-4xl min-h-[60vh]">
      <h1 className="text-3xl font-bold text-ink mb-8 tracking-tight">Your Cart</h1>

      {isEmpty ? (
        <div className="text-center py-24 space-y-6">
          <p className="text-slate text-lg">Your cart is currently empty.</p>
          <Link href="/shop" passHref legacyBehavior>
            <Button size="lg" className="w-full sm:w-auto">
              Continue Shopping
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-2">
            {cart.items.map((item) => (
              <CartLineItem key={item.id} item={item} />
            ))}
          </div>

          <div className="lg:col-span-4">
            <div className="bg-paper p-6 rounded-lg sticky top-24 border border-fog">
              <h2 className="text-lg font-semibold text-ink mb-4 tracking-tight">Order Summary</h2>

              <div className="space-y-3 text-sm mb-6 border-b border-fog pb-6">
                <div className="flex justify-between text-slate">
                  <span>Subtotal</span>
                  <span className="text-ink font-medium">{formatPaise(cart.subtotalPaise)}</span>
                </div>
                <div className="flex justify-between text-slate">
                  <span>Shipping</span>
                  <span className="text-mist">Calculated at checkout</span>
                </div>
              </div>

              <div className="flex justify-between text-base font-semibold text-ink mb-6">
                <span>Total</span>
                <span>{formatPaise(cart.subtotalPaise)}</span>
              </div>

              <p className="text-xs text-mist text-center mb-6 px-4">
                Items in your cart are not reserved until checkout.
              </p>

              <Link href="/checkout">
                <Button className="w-full h-14 text-base">Proceed to Checkout</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </Container>
  )
}
