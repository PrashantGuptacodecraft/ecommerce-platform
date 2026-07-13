'use client'

import { useState, useActionState, useEffect } from 'react'
import { adjustStockAction, type InventoryActionState } from '../actions'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { FormError } from '@/components/ui/FormError'

type StockAdjustmentDrawerProps = {
  isOpen: boolean
  onClose: () => void
  variant: any | null
}

const initialState: InventoryActionState = {
  success: false,
}

export function StockAdjustmentDrawer({ isOpen, onClose, variant }: StockAdjustmentDrawerProps) {
  const [state, formAction, isPending] = useActionState(adjustStockAction, initialState)
  const [idempotencyKey, setIdempotencyKey] = useState('')
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add')
  const [quantity, setQuantity] = useState('1')

  useEffect(() => {
    if (isOpen) {
      setIdempotencyKey(crypto.randomUUID())
      setAdjustmentType('add')
      setQuantity('1')
    }
  }, [isOpen])

  // React to success
  useEffect(() => {
    if (state.success && isOpen) {
      onClose()
    }
  }, [state.success, isOpen, onClose])

  if (!variant) return null

  const isAdding = adjustmentType === 'add'
  const actualQuantity = isAdding ? parseInt(quantity || '0', 10) : -parseInt(quantity || '0', 10)

  return (
    <Drawer open={isOpen} onClose={onClose} title="Adjust Stock">
      <div className="p-4">
        <div className="mb-6 p-3 bg-paper border border-fog rounded-md">
          <p className="text-sm font-medium text-ink">{variant.products?.name}</p>
          <p className="text-xs text-mist font-mono mt-1">SKU: {variant.sku}</p>
          <div className="mt-2 flex justify-between items-center text-sm">
            <span className="text-slate">Current Stock:</span>
            <span className="font-semibold text-ink">{variant.stock_quantity}</span>
          </div>
        </div>

        <form action={formAction} className="space-y-5">
          <input type="hidden" name="variant_id" value={variant.id} />
          <input type="hidden" name="idempotency_key" value={idempotencyKey} />
          {/* We must send the computed negative or positive value */}
          <input type="hidden" name="change_quantity" value={actualQuantity.toString()} />

          {state.error && <FormError>{state.error}</FormError>}

          <div className="space-y-3">
            <Label>Adjustment Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={isAdding ? 'primary' : 'outline'}
                onClick={() => setAdjustmentType('add')}
                className="flex-1"
                disabled={isPending}
              >
                Add Stock
              </Button>
              <Button
                type="button"
                variant={!isAdding ? 'primary' : 'outline'}
                onClick={() => setAdjustmentType('remove')}
                className="flex-1"
                disabled={isPending}
              >
                Remove Stock
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity to {isAdding ? 'Add' : 'Remove'}</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={isPending}
              invalid={!!state.fieldErrors?.change_quantity}
              required
            />
            {state.fieldErrors?.change_quantity && (
              <FormError>{state.fieldErrors.change_quantity[0]}</FormError>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Reason / Note</Label>
            <Input
              id="note"
              name="note"
              placeholder="e.g. Restock from supplier, Damaged item"
              disabled={isPending}
              invalid={!!state.fieldErrors?.note}
              required
            />
            {state.fieldErrors?.note && <FormError>{state.fieldErrors.note[0]}</FormError>}
            <p className="text-xs text-mist">A note is mandatory for the inventory ledger.</p>
          </div>

          <div className="pt-4 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? 'Saving...' : 'Confirm'}
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  )
}
