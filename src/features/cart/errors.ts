export const mapCartError = (error: string): string => {
  switch (error) {
    case 'OUT_OF_STOCK':
      return 'This item is currently out of stock.'
    case 'INSUFFICIENT_STOCK':
      return 'Not enough items in stock to fulfill this quantity.'
    case 'PRODUCT_INACTIVE':
      return 'This item is no longer available.'
    case 'CART_NOT_FOUND':
      return 'Cart not found. Please refresh the page.'
    case 'CART_ITEM_NOT_FOUND':
      return 'Item not in cart.'
    case 'CONCURRENCY_CONFLICT':
      return 'Cart was updated elsewhere. Please refresh.'
    default:
      return error || 'Unable to update cart at this time.'
  }
}
