import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { getExistingCartSessionId } from './cart-session.server'

export type CartItemState = 'available' | 'insufficient_stock' | 'out_of_stock' | 'unavailable'

export type CartItemDetail = {
  id: string
  cart_id: string
  variant_id: string
  quantity: number
  state: CartItemState
  unitPricePaise: number
  lineTotalPaise: number
  variant: {
    sku: string
    stock_quantity: number
    is_active: boolean
    image_url: string | null
    options: { name: string; value: string }[]
  }
  product: {
    id: string
    name: string
    slug: string
    is_active: boolean
  }
}

export type CartDetail = {
  id: string
  session_token: string
  items: CartItemDetail[]
  subtotalPaise: number
  totalItems: number
}

export async function getCart(): Promise<CartDetail | null> {
  const sessionToken = await getExistingCartSessionId()
  if (!sessionToken) return null

  const supabase = createAdminClient()

  // 1. Get the cart
  const { data: cart, error: cartError } = await supabase
    .from('carts')
    .select('id, session_token')
    .eq('session_token', sessionToken)
    .maybeSingle()

  if (cartError || !cart) return null

  // 2. Get the items with joined products & variants
  const { data: items, error: itemsError } = await supabase
    .from('cart_items')
    .select(
      `
      id,
      cart_id,
      variant_id,
      quantity,
      product_variants (
        id,
        sku,
        stock_quantity,
        is_active,
        price_adjustment_paise,
        product_images ( storage_path ),
        products (
          id,
          name,
          slug,
          is_active,
          base_price_paise
        ),
        variant_option_values (
          product_option_values (
            value,
            product_options ( name )
          )
        )
      )
    `,
    )
    .eq('cart_id', cart.id)
    .order('created_at', { ascending: true })

  if (itemsError || !items)
    return { id: cart.id, session_token: sessionToken, items: [], subtotalPaise: 0, totalItems: 0 }

  const enrichedItems: CartItemDetail[] = []
  let subtotalPaise = 0
  let totalItems = 0

  for (const item of items) {
    const variant = item.product_variants
    if (!variant || Array.isArray(variant)) continue // Should not happen with 1:1 relation

    const product = variant.products
    if (!product || Array.isArray(product)) continue

    const basePrice = product.base_price_paise || 0
    const adjustment = variant.price_adjustment_paise || 0
    const unitPricePaise = basePrice + adjustment

    const isActive = product.is_active && variant.is_active
    const stock = variant.stock_quantity

    let state: CartItemState = 'available'
    if (!isActive) {
      state = 'unavailable'
    } else if (stock === 0) {
      state = 'out_of_stock'
    } else if (item.quantity > stock) {
      state = 'insufficient_stock'
    }

    const lineTotalPaise =
      state === 'unavailable' || state === 'out_of_stock'
        ? 0
        : unitPricePaise * (state === 'insufficient_stock' ? stock : item.quantity)

    // Add to cart totals ONLY if the item can actually be purchased
    if (state === 'available' || state === 'insufficient_stock') {
      subtotalPaise += lineTotalPaise
      totalItems += state === 'insufficient_stock' ? stock : item.quantity
    }

    // Format options
    const optionValues = Array.isArray(variant.variant_option_values)
      ? variant.variant_option_values
      : []

    const options = optionValues
      .map((vov: any) => ({
        name: vov.product_option_values?.product_options?.name || '',
        value: vov.product_option_values?.value || '',
      }))
      .filter((o: any) => o.name && o.value)

    const images = Array.isArray(variant.product_images) ? variant.product_images : []
    const imageUrl = images.length > 0 ? images[0].storage_path : null

    enrichedItems.push({
      id: item.id,
      cart_id: item.cart_id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      state,
      unitPricePaise,
      lineTotalPaise,
      variant: {
        sku: variant.sku,
        stock_quantity: variant.stock_quantity,
        is_active: variant.is_active,
        image_url: imageUrl,
        options,
      },
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        is_active: product.is_active,
      },
    })
  }

  return {
    id: cart.id,
    session_token: sessionToken,
    items: enrichedItems,
    subtotalPaise,
    totalItems,
  }
}
