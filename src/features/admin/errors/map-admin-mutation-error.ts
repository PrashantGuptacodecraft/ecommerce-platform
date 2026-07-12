export type SafeAdminError =
  | 'CONCURRENCY_CONFLICT'
  | 'IDEMPOTENCY_CONFLICT'
  | 'DUPLICATE_PRODUCT_SLUG'
  | 'DUPLICATE_CATEGORY_SLUG'
  | 'DUPLICATE_SKU'
  | 'DUPLICATE_VARIANT_COMBINATION'
  | 'CATEGORY_IN_USE'
  | 'VARIANT_HAS_STOCK'
  | 'IMAGE_INTENT_EXPIRED'
  | 'VALIDATION_FAILED'
  | 'UNAUTHORIZED'
  | 'UNKNOWN_ERROR'

export function mapAdminMutationError(error: any): SafeAdminError {
  if (!error) return 'UNKNOWN_ERROR'

  const msg = error.message || ''

  // Custom business logic exceptions thrown by our RPCs
  if (msg.includes('CONCURRENCY_CONFLICT')) return 'CONCURRENCY_CONFLICT'
  if (msg.includes('IDEMPOTENCY_CONFLICT')) return 'IDEMPOTENCY_CONFLICT'
  if (msg.includes('CATEGORY_IN_USE')) return 'CATEGORY_IN_USE'
  if (msg.includes('VARIANT_HAS_STOCK') || msg.includes('NEGATIVE_STOCK_PREVENTED'))
    return 'VARIANT_HAS_STOCK'
  if (msg.includes('IMAGE_INTENT_EXPIRED')) return 'IMAGE_INTENT_EXPIRED'
  if (msg.includes('DUPLICATE_VARIANT_COMBINATION')) return 'DUPLICATE_VARIANT_COMBINATION'

  // Postgres constraint violations (mapped safely by constraint name or context in message)
  // unique_violation is 23505
  if (error.code === '23505') {
    // We check for constraint names which are typically included in the error message
    if (
      msg.includes('products_slug_key') ||
      msg.includes('duplicate key value violates unique constraint "products_slug_key"')
    ) {
      return 'DUPLICATE_PRODUCT_SLUG'
    }
    if (
      msg.includes('categories_slug_key') ||
      msg.includes('duplicate key value violates unique constraint "categories_slug_key"')
    ) {
      return 'DUPLICATE_CATEGORY_SLUG'
    }
    if (
      msg.includes('product_variants_sku_key') ||
      msg.includes('duplicate key value violates unique constraint "product_variants_sku_key"')
    ) {
      return 'DUPLICATE_SKU'
    }
  }

  return 'UNKNOWN_ERROR'
}

export function getSafeErrorMessage(errorType: SafeAdminError): string {
  switch (errorType) {
    case 'CONCURRENCY_CONFLICT':
      return 'Another administrator has modified this record. Please refresh to see the latest changes.'
    case 'IDEMPOTENCY_CONFLICT':
      return 'This exact action was already performed. Please refresh.'
    case 'DUPLICATE_PRODUCT_SLUG':
      return 'The product URL slug is already in use. Slugs must be unique.'
    case 'DUPLICATE_CATEGORY_SLUG':
      return 'The category URL slug is already in use. Slugs must be unique.'
    case 'DUPLICATE_SKU':
      return 'The SKU is already in use by another variant. SKUs must be unique.'
    case 'DUPLICATE_VARIANT_COMBINATION':
      return 'A variant with these exact options already exists.'
    case 'CATEGORY_IN_USE':
      return 'This category cannot be deactivated or deleted because it is still referenced by active products.'
    case 'VARIANT_HAS_STOCK':
      return 'This variant cannot be deleted because it currently holds stock in the inventory ledger.'
    case 'IMAGE_INTENT_EXPIRED':
      return 'The image upload session has expired. Please try uploading again.'
    case 'VALIDATION_FAILED':
      return 'Please check the form for errors.'
    case 'UNAUTHORIZED':
      return 'You do not have permission to perform this action.'
    default:
      return 'An unexpected error occurred. Please try again.'
  }
}
