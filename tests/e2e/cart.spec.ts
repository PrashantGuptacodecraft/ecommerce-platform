import { test, expect, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Note: Ensure your local dev server is running before executing this.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
})

let TEST_CATEGORY_SLUG: string
let TEST_PRODUCT_SLUG: string
let categoryId: string
let productId: string
let optionSizeId: string
let optionColorId: string
let sizeLId: string
let colorRedId: string
let variantId: string

async function cleanupDeterministicProduct() {
  if (!supabaseServiceKey) return

  await supabase.from('products').delete().eq('slug', TEST_PRODUCT_SLUG)
  await supabase.from('categories').delete().eq('slug', TEST_CATEGORY_SLUG)

  const { data: emptyCarts } = await supabase.from('carts').select('id, cart_items(id)')
  const cartsToDelete = emptyCarts?.filter((c) => c.cart_items.length === 0).map((c) => c.id) || []
  if (cartsToDelete.length > 0) {
    await supabase.from('carts').delete().in('id', cartsToDelete)
  }
}

async function setupDeterministicProduct() {
  if (!supabaseServiceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY not set')

  const workerId = crypto.randomUUID().split('-')[0]
  TEST_CATEGORY_SLUG = `e2e-cat-${workerId}`
  TEST_PRODUCT_SLUG = `e2e-prod-${workerId}`

  const { data: cat, error: e1 } = await supabase
    .from('categories')
    .insert({
      name: `E2E Cat ${workerId}`,
      slug: TEST_CATEGORY_SLUG,
      description: 'Test',
      is_active: true,
    })
    .select('id')
    .single()
  if (e1) throw new Error(`Category insert failed: ${e1.message}`)
  categoryId = cat!.id

  const { data: prod, error: e2 } = await supabase
    .from('products')
    .insert({
      category_id: categoryId,
      name: `E2E Prod ${workerId}`,
      slug: TEST_PRODUCT_SLUG,
      description: 'Test',
      base_price_paise: 100000,
      is_active: false,
    })
    .select('id')
    .single()
  if (e2) throw new Error(`Product insert failed: ${e2.message}`)
  productId = prod!.id

  await supabase.from('products').update({ is_active: true }).eq('id', productId)

  const { data: opt1, error: e3 } = await supabase
    .from('product_options')
    .insert({ product_id: productId, name: 'Size', sort_order: 1 })
    .select('id')
    .single()
  const { data: opt2, error: e4 } = await supabase
    .from('product_options')
    .insert({ product_id: productId, name: 'Color', sort_order: 2 })
    .select('id')
    .single()
  if (e3) throw new Error(`Option 1 insert failed: ${e3.message}`)
  if (e4) throw new Error(`Option 2 insert failed: ${e4.message}`)
  optionSizeId = opt1!.id
  optionColorId = opt2!.id

  const { data: val1, error: e5 } = await supabase
    .from('product_option_values')
    .insert({ product_option_id: optionSizeId, value: 'L', sort_order: 1 })
    .select('id')
    .single()
  const { data: val2, error: e6 } = await supabase
    .from('product_option_values')
    .insert({ product_option_id: optionColorId, value: 'Red', sort_order: 1 })
    .select('id')
    .single()
  if (e5) throw new Error(`Value 1 insert failed: ${e5.message}`)
  if (e6) throw new Error(`Value 2 insert failed: ${e6.message}`)
  sizeLId = val1!.id
  colorRedId = val2!.id

  // 5. Create active variant
  const uniqueSku = 'E2E-CART-' + crypto.randomUUID().split('-')[0]
  const { data: vrnt, error: e7 } = await supabase
    .from('product_variants')
    .insert({
      product_id: productId,
      sku: uniqueSku,
      price_adjustment_paise: 0,
      stock_quantity: 50,
      is_active: true,
    })
    .select('id')
    .single()
  if (e7) throw new Error(`Variant insert failed: ${e7.message}`)
  variantId = vrnt!.id

  // 6. Link variant options
  const { error: e8 } = await supabase.from('variant_option_values').insert([
    { variant_id: variantId, option_value_id: sizeLId },
    { variant_id: variantId, option_value_id: colorRedId },
  ])
  if (e8) throw new Error(`Variant options link failed: ${e8.message}`)
}

async function selectFullVariant(page: Page) {
  const groups = page.getByRole('radiogroup')
  await groups.first().waitFor({ state: 'visible', timeout: 10000 })
  const count = await groups.count()
  for (let i = 0; i < count; i++) {
    const group = groups.nth(i)
    const radio = group.getByRole('radio').first()
    if (await radio.isVisible()) {
      await radio.click()
    }
  }
}

test.describe('Customer Cart E2E', () => {
  test.beforeAll(async () => {
    await setupDeterministicProduct()
  })

  test.afterAll(async () => {
    await cleanupDeterministicProduct()
  })

  test.beforeEach(async ({ page }) => {
    await page.goto(`/product/${TEST_PRODUCT_SLUG}`)
  })

  test('adds to cart and displays in drawer', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Select options/i })).toBeDisabled()

    await selectFullVariant(page)
    const addBtn = page.getByTestId('add-to-cart-button')
    await expect(addBtn).toBeEnabled()

    await addBtn.click()

    const cartBadge = page.getByLabel('View Cart')
    await cartBadge.click()

    const drawerTitle = page.getByRole('heading', { name: /Your Cart/i })
    await expect(drawerTitle).toBeVisible()

    const itemName = page.getByText(/E2E Prod/i).first()
    await expect(itemName).toBeVisible()

    const subtotal = page.getByText(/Subtotal/i)
    await expect(subtotal).toBeVisible()
  })

  test('updates quantity and removes item in cart drawer', async ({ page }) => {
    await selectFullVariant(page)
    await page.getByTestId('add-to-cart-button').click()
    await expect(page.getByTestId('add-to-cart-button')).toHaveText('Add to Cart', {
      timeout: 15000,
    })

    await page.getByLabel('View Cart').click()

    const increaseBtn = page.getByLabel('Increase quantity')
    await increaseBtn.click()

    const qtySpan = page.locator('span').filter({ hasText: /^2$/ })
    await expect(qtySpan).toBeVisible()

    const removeBtn = page.getByLabel('Remove item')
    await removeBtn.click()

    await expect(page.getByText(/Your cart is empty/i)).toBeVisible({ timeout: 15000 })
  })

  test('cart persists securely across page refresh', async ({ page }) => {
    await selectFullVariant(page)
    await page.getByTestId('add-to-cart-button').click()
    await expect(page.getByTestId('add-to-cart-button')).toHaveText('Add to Cart', {
      timeout: 15000,
    })

    await page.reload()

    await page.getByLabel('View Cart').click()

    await expect(page.getByText(/E2E Prod/i).first()).toBeVisible()
  })

  test('separate browser sessions have isolated carts', async ({ browser }) => {
    const context1 = await browser.newContext()
    const page1 = await context1.newPage()
    await page1.goto(`/product/${TEST_PRODUCT_SLUG}`)

    await selectFullVariant(page1)
    await page1.getByTestId('add-to-cart-button').click()
    await expect(page1.getByTestId('add-to-cart-button')).toHaveText('Add to Cart', {
      timeout: 15000,
    })

    const context2 = await browser.newContext()
    const page2 = await context2.newPage()
    await page2.goto('/cart')

    await expect(page2.getByText(/Your cart is currently empty/i)).toBeVisible()

    await context1.close()
    await context2.close()
  })
})
