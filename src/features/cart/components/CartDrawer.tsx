'use client'

import { useTransition } from 'react'
import { Drawer } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { formatPaise } from '@/lib/utilities/money'
import { CartLineItem } from './CartLineItem'
import type { CartDetail } from '../queries'

type CartDrawerProps = {
  cart: CartDetail | null
  isOpen: boolean
  onClose: () => void
}

export function CartDrawer({ cart, isOpen, onClose }: CartDrawerProps) {
  const [isPending, startTransition] = useTransition()

  const isEmpty = !cart || cart.items.length === 0

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      title={`Your Cart ${cart?.totalItems ? `(${cart.totalItems})` : ''}`}
      side="right"
      footer={
        !isEmpty && (
          <div className="space-y-4 w-full pt-4">
            <div className="flex items-center justify-between font-medium text-ink">
              <span>Subtotal</span>
              <span>{formatPaise(cart.subtotalPaise)}</span>
            </div>
            <p className="text-xs text-mist text-center">
              Items in your cart are not reserved until checkout.
            </p>
            <Button className="w-full" disabled>
              Checkout (Coming Soon)
            </Button>
          </div>
        )
      }
    >
      <div className="p-4 flex flex-col h-full overflow-y-auto">
        {isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
            <p className="text-slate">Your cart is empty.</p>
            <Button variant="outline" onClick={onClose}>
              Continue Shopping
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {cart.items.map((item) => (
              <CartLineItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </Drawer>
  )
}
