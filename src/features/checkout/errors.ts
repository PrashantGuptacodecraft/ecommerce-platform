export type CheckoutErrorCode =
  | 'CART_EMPTY'
  | 'CART_NOT_FOUND'
  | 'PRODUCT_INACTIVE'
  | 'VARIANT_INACTIVE'
  | 'OUT_OF_STOCK'
  | 'INSUFFICIENT_STOCK'
  | 'PRICE_CHANGED'
  | 'INVALID_ADDRESS'
  | 'INVALID_CUSTOMER'
  | 'INVALID_QUANTITY'
  | 'IDEMPOTENCY_CONFLICT'
  | 'ORDER_CREATION_FAILED'
  | 'CONCURRENCY_CONFLICT'
  | 'UNAUTHORIZED'
  | 'INVALID_PAYMENT_METHOD'
  | 'SYSTEM_ERROR'
  | 'INITIALIZATION_FAILED'
  | 'INITIALIZATION_AMBIGUOUS'
  | 'INITIALIZATION_AMBIGUOUS_RETRY'
  | 'FAILED_TO_ATTACH'
  | 'INVALID_SIGNATURE'
  | 'CONFIRMATION_FAILED'
  | 'LATE_CAPTURE_REQUIRES_REVIEW'
  | 'UNKNOWN_ERROR'

export const CHECKOUT_ERROR_MESSAGES: Record<CheckoutErrorCode, string> = {
  CART_EMPTY: 'Your cart is empty. Please add items before checking out.',
  CART_NOT_FOUND: 'Your checkout session has expired. Please return to your cart.',
  PRODUCT_INACTIVE: 'A product in your cart is no longer available.',
  VARIANT_INACTIVE: 'An item variant in your cart is no longer available.',
  OUT_OF_STOCK: 'An item in your cart is out of stock.',
  INSUFFICIENT_STOCK: 'There is insufficient stock for an item in your cart.',
  PRICE_CHANGED: 'Prices have been updated. Please review your cart.',
  INVALID_ADDRESS: 'The provided address is invalid.',
  INVALID_CUSTOMER: 'Invalid customer details provided.',
  INVALID_QUANTITY: 'Invalid quantity in cart.',
  IDEMPOTENCY_CONFLICT: 'This order is already being processed.',
  ORDER_CREATION_FAILED: 'We could not create your order. Please try again.',
  CONCURRENCY_CONFLICT: 'The system is busy processing another request. Please try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  INVALID_PAYMENT_METHOD: 'The selected payment method is not supported.',
  SYSTEM_ERROR: 'A system error occurred. Please try again later.',
  INITIALIZATION_FAILED: 'Payment initialization failed. Please try again.',
  INITIALIZATION_AMBIGUOUS: 'Payment initialization returned an unclear response. Please retry.',
  INITIALIZATION_AMBIGUOUS_RETRY:
    'Payment could not be confirmed after retry. Please start a new checkout.',
  FAILED_TO_ATTACH: 'Failed to link your payment to the order. Please try again.',
  INVALID_SIGNATURE: 'Payment verification failed. Please contact support if you were charged.',
  CONFIRMATION_FAILED: 'We could not confirm your payment. Please contact support.',
  LATE_CAPTURE_REQUIRES_REVIEW: 'Your payment requires manual review. We will update you shortly.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
}

export function getCheckoutErrorMessage(code: string | undefined): string {
  if (!code) return CHECKOUT_ERROR_MESSAGES.UNKNOWN_ERROR
  return CHECKOUT_ERROR_MESSAGES[code as CheckoutErrorCode] || CHECKOUT_ERROR_MESSAGES.UNKNOWN_ERROR
}
