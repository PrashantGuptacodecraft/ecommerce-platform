'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
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
  let orderNumber: string | undefined

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
      expectedTotalPaise: formData.get('expectedTotalPaise'),
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
      expectedTotalPaise,
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
      expectedTotalPaise,
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    orderNumber = result.orderNumber
  } catch (error: any) {
    console.error('Submit checkout error:', error)
    return { success: false, error: 'ORDER_CREATION_FAILED' }
  }

  // Next.js redirect must be called outside try/catch to avoid catching the NEXT_REDIRECT error
  if (orderNumber) {
    // Only revalidate if we are redirecting away, or wait, redirecting inherently takes user away.
    // If we revalidate '/' layout here, we don't trigger the /cart redirect for the user because we send them to /order/success.
    revalidatePath('/', 'layout')
    redirect(`/checkout/success/${orderNumber}`)
  }

  return { success: false, error: 'ORDER_CREATION_FAILED' }
}
