import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  throw new Error('Missing Supabase environment variables')
}

const serviceClient = createClient(url, serviceKey)

describe('Checkout Integration', () => {
  const ts = Date.now()
  const sessionToken = `test-session-${ts}`
  let cartId: string
  let productId: string
  let variantId: string
  let categoryId: string
  let addressId: string | null = null

  beforeAll(async () => {
    // 1. Create a category
    categoryId = crypto.randomUUID()
    await serviceClient.from('categories').insert({
      id: categoryId,
      name: 'Test Category',
      slug: `test-cat-${ts}`,
      sort_order: 999,
    })

    // 2. Create a product
    productId = crypto.randomUUID()
    await serviceClient.from('products').insert({
      id: productId,
      name: 'Test Product',
      slug: `test-prod-${ts}`,
      category_id: categoryId,
      base_price_paise: 10000,
      description: 'Test',
      short_description: 'Test',
      fabric: 'Test',
      care_instructions: 'Test',
      fit_info: 'Test',
      is_active: true,
    })

    // 3. Create a variant
    variantId = crypto.randomUUID()
    await serviceClient.from('product_variants').insert({
      id: variantId,
      product_id: productId,
      sku: `TEST-SKU-${ts}`,
      stock_quantity: 10,
      price_adjustment_paise: 500, // Total = 10500
      is_active: true,
    })

    // 4. Create a cart
    const { data: cart } = await serviceClient
      .from('carts')
      .insert({ session_token: sessionToken })
      .select('id')
      .single()
    cartId = cart!.id
  }, 30000)

  afterAll(async () => {
    // Cleanup
    await serviceClient.from('carts').delete().eq('id', cartId)
    if (addressId) {
      await serviceClient.from('addresses').delete().eq('id', addressId)
    }
    await serviceClient.from('product_variants').delete().eq('id', variantId)
    await serviceClient.from('products').delete().eq('id', productId)
    await serviceClient.from('categories').delete().eq('id', categoryId)
  })

  it('rejects empty cart', async () => {
    const idempotencyKey = crypto.randomUUID()
    const { data, error } = await serviceClient.rpc('create_cod_order_atomic', {
      p_session_token: sessionToken,
      p_idempotency_key: idempotencyKey,
      p_payload_hash: 'hash1',
      p_name: 'Test',
      p_email: 'test@example.com',
      p_phone: '1234567890',
      p_address_line1: '123 Test St',
      p_address_line2: '',
      p_landmark: '',
      p_city: 'Test City',
      p_state: 'Test State',
      p_postal_code: '123456',
      p_notes: '',
      p_expected_total_paise: 0,
    })

    expect(error).toBeNull()
    expect(data.success).toBe(false)
    expect(data.error).toBe('CART_EMPTY')
  })

  it('successfully creates order and idempotently ignores duplicates', async () => {
    // Add item to cart
    await serviceClient.from('cart_items').insert({
      cart_id: cartId,
      variant_id: variantId,
      quantity: 2,
    })

    const idempotencyKey = crypto.randomUUID()

    // 1st request
    const { data: data1 } = await serviceClient.rpc('create_cod_order_atomic', {
      p_session_token: sessionToken,
      p_idempotency_key: idempotencyKey,
      p_payload_hash: 'hash2',
      p_name: 'John Doe',
      p_email: 'john@example.com',
      p_phone: '0987654321',
      p_address_line1: '456 Order St',
      p_address_line2: '',
      p_landmark: '',
      p_city: 'Order City',
      p_state: 'OS',
      p_postal_code: '654321',
      p_notes: '',
      p_expected_total_paise: 28900,
    })

    expect(data1.success).toBe(true)
    expect(data1.orderNumber).toBeDefined()
    expect(data1.subtotalPaise).toBe(21000) // (10000 + 500) * 2

    // Check stock was deducted (10 - 2 = 8)
    const { data: v } = await serviceClient
      .from('product_variants')
      .select('stock_quantity')
      .eq('id', variantId)
      .single()
    expect(v!.stock_quantity).toBe(8)

    // Check cart was cleared
    const { data: items } = await serviceClient.from('cart_items').select('*').eq('cart_id', cartId)
    expect(items?.length).toBe(0)

    // 2nd request with same key/payload (Idempotency)
    const { data: data2 } = await serviceClient.rpc('create_cod_order_atomic', {
      p_session_token: sessionToken,
      p_idempotency_key: idempotencyKey,
      p_payload_hash: 'hash2',
      p_name: 'John Doe',
      p_email: 'john@example.com',
      p_phone: '0987654321',
      p_address_line1: '456 Order St',
      p_address_line2: '',
      p_landmark: '',
      p_city: 'Order City',
      p_state: 'OS',
      p_postal_code: '654321',
      p_notes: '',
      p_expected_total_paise: 21000,
    })

    expect(data2.success).toBe(true)
    expect(data2.orderNumber).toBe(data1.orderNumber)

    // Check stock didn't double-deduct
    const { data: v2 } = await serviceClient
      .from('product_variants')
      .select('stock_quantity')
      .eq('id', variantId)
      .single()
    expect(v2!.stock_quantity).toBe(8)

    // 3rd request with same key, different payload
    const { data: data3 } = await serviceClient.rpc('create_cod_order_atomic', {
      p_session_token: sessionToken,
      p_idempotency_key: idempotencyKey,
      p_payload_hash: 'hash-different',
      p_name: 'Jane Doe',
      p_email: 'jane@example.com',
      p_phone: '0987654321',
      p_address_line1: '456 Order St',
      p_address_line2: '',
      p_landmark: '',
      p_city: 'Order City',
      p_state: 'OS',
      p_postal_code: '654321',
      p_notes: '',
      p_expected_total_paise: 21000,
    })

    expect(data3.success).toBe(false)
    expect(data3.error).toBe('IDEMPOTENCY_CONFLICT')
  })

  it('rolls back completely if a database error occurs after stock deduction', async () => {
    // Add item to cart for new order
    await serviceClient.from('cart_items').insert({
      cart_id: cartId,
      variant_id: variantId,
      quantity: 1,
    })

    const idempotencyKey = crypto.randomUUID()
    const currentStock = (
      await serviceClient
        .from('product_variants')
        .select('stock_quantity')
        .eq('id', variantId)
        .single()
    ).data!.stock_quantity

    // Request with null name to intentionally trigger NOT NULL constraint on addresses
    // This happens AFTER stock reservation loop
    const { data: data4 } = await serviceClient.rpc('create_cod_order_atomic', {
      p_session_token: sessionToken,
      p_idempotency_key: idempotencyKey,
      p_payload_hash: 'hash-fail',
      p_name: null as any, // INTENTIONAL FAILURE
      p_email: 'fail@example.com',
      p_phone: '0987654321',
      p_address_line1: '456 Fail St',
      p_address_line2: '',
      p_landmark: '',
      p_city: 'Fail City',
      p_state: 'FS',
      p_postal_code: '654321',
      p_notes: '',
      p_expected_total_paise: 18400, // 10500 + 7900
    })

    // Expect generic failure safely mapped
    expect(data4.success).toBe(false)
    expect(data4.error).toBe('ORDER_CREATION_FAILED')

    // 1. Verify no order remains
    const { data: orders } = await serviceClient
      .from('order_idempotency_keys')
      .select('*')
      .eq('idempotency_key', idempotencyKey)
    expect(orders?.length).toBe(0)

    // 2. Verify stock returns to original quantity
    const { data: v } = await serviceClient
      .from('product_variants')
      .select('stock_quantity')
      .eq('id', variantId)
      .single()
    expect(v!.stock_quantity).toBe(currentStock)

    // 3. Verify cart remains unchanged
    const { data: items } = await serviceClient.from('cart_items').select('*').eq('cart_id', cartId)
    expect(items?.length).toBe(1)

    // Clear cart manually to clean up
    await serviceClient.from('cart_items').delete().eq('cart_id', cartId)
  })
})
