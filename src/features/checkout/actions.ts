'use server'

import { revalidatePath } from 'next/cache'
import { getExistingCartSessionId } from '@/features/cart/cart-session.server'
import { checkoutRepository } from './checkout-repository.server'
import { checkoutFormSchema } from './validation'

export type CheckoutActionResult = {
  success: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
  orderNumber?: string
}

export async function submitCheckoutAction(
  prevState: CheckoutActionResult,
  formData: FormData,
): Promise<CheckoutActionResult> {
  try {
    const rawData = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      addressLine1: formData.get('addressLine1'),
      addressLine2: formData.get('addressLine2') || undefined,
      landmark: formData.get('landmark') || undefined,
      city: formData.get('city'),
      state: formData.get('state'),
      postalCode: formData.get('postalCode'),
      notes: formData.get('notes') || undefined,
      paymentMethod: formData.get('paymentMethod'),
      idempotencyKey: formData.get('idempotencyKey'),
      payloadHash: formData.get('payloadHash'),
    }

    const parsed = checkoutFormSchema.safeParse(rawData)
    if (!parsed.success) {
      return { success: false, fieldErrors: parsed.error.flatten().fieldErrors }
    }

    const sessionToken = await getExistingCartSessionId()
    if (!sessionToken) {
      return { success: false, error: 'CART_NOT_FOUND' }
    }

    const {
      name,
      email,
      phone,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      postalCode,
      notes,
      idempotencyKey,
      payloadHash,
    } = parsed.data

    const result = await checkoutRepository.createCodOrderAtomic({
      sessionToken,
      idempotencyKey,
      payloadHash,
      name,
      email,
      phone,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      postalCode,
      notes,
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    revalidatePath('/', 'layout')
    return { success: true, orderNumber: result.orderNumber }
  } catch (error: any) {
    console.error('Submit checkout error:', error)
    return { success: false, error: 'ORDER_CREATION_FAILED' }
  }
}
