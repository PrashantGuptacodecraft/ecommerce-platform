import { test, expect, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

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

async function setupDeterministicProduct() {
  if (!supabaseServiceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY not set')

  const workerId = crypto.randomUUID().split('-')[0]
  TEST_CATEGORY_SLUG = `e2e-cat-chk-${workerId}`
  TEST_PRODUCT_SLUG = `e2e-prod-chk-${workerId}`

  const { data: cat } = await supabase.from('categories').insert({
    name: `E2E Cat ${workerId}`,
    slug: TEST_CATEGORY_SLUG,
    description: 'Test',
    is_active: true,
  }).select('id').single()
  categoryId = cat!.id

  const { data: prod } = await supabase.from('products').insert({
    category_id: categoryId,
    name: `E2E Prod Checkout ${workerId}`,
    slug: TEST_PRODUCT_SLUG,
    description: 'Test',
    base_price_paise: 100000,
    is_active: true,
  }).select('id').single()
  productId = prod!.id

  const { data: opt1 } = await supabase.from('product_options').insert({ product_id: productId, name: 'Size', sort_order: 1 }).select('id').single()
  const { data: opt2 } = await supabase.from('product_options').insert({ product_id: productId, name: 'Color', sort_order: 2 }).select('id').single()
  optionSizeId = opt1!.id
  optionColorId = opt2!.id

  const { data: val1 } = await supabase.from('product_option_values').insert({ product_option_id: optionSizeId, value: 'L', sort_order: 1 }).select('id').single()
  const { data: val2 } = await supabase.from('product_option_values').insert({ product_option_id: optionColorId, value: 'Red', sort_order: 1 }).select('id').single()
  sizeLId = val1!.id
  colorRedId = val2!.id

  const uniqueSku = 'E2E-CHK-' + crypto.randomUUID().split('-')[0]
  const { data: vrnt } = await supabase.from('product_variants').insert({
    product_id: productId,
    sku: uniqueSku,
    price_adjustment_paise: 0,
    stock_quantity: 50,
    is_active: true,
  }).select('id').single()
  variantId = vrnt!.id

  await supabase.from('variant_option_values').insert([
    { variant_id: variantId, option_value_id: sizeLId },
    { variant_id: variantId, option_value_id: colorRedId },
  ])
}

async function cleanupDeterministicProduct() {
  if (!supabaseServiceKey) return
  await supabase.from('products').delete().eq('slug', TEST_PRODUCT_SLUG)
  await supabase.from('categories').delete().eq('slug', TEST_CATEGORY_SLUG)
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

test.describe('Checkout Flow', () => {
  test.beforeAll(async () => {
    await setupDeterministicProduct()
  })

  test.afterAll(async () => {
    await cleanupDeterministicProduct()
  })

  test('Complete Guest COD Checkout', async ({ page }) => {
    // 1. Add item to cart
    await page.goto(`/product/${TEST_PRODUCT_SLUG}`)
    await selectFullVariant(page)
    const addBtn = page.getByTestId('add-to-cart-button')
    await expect(addBtn).toBeEnabled()
    await addBtn.click()
    await expect(addBtn).toHaveText('Add to Cart', { timeout: 15000 })

    // 2. Go to checkout
    await page.goto('/checkout')

    // 3. Fill form
    await page.fill('input[name="name"]', 'Playwright Tester')
    await page.fill('input[name="email"]', 'tester@example.com')
    await page.fill('input[name="phone"]', '9876543210')
    await page.fill('input[name="addressLine1"]', '123 Automation Lane')
    await page.fill('input[name="city"]', 'Testing City')
    await page.fill('input[name="state"]', 'TS')
    await page.fill('input[name="postalCode"]', '123456')

    // Select COD (should be default)
    await page.locator('input[value="cod"]').check()

    // 4. Submit order
    await page.getByRole('button', { name: /Place Order/i }).click()

    // 5. Should redirect to success page
    await expect(page).toHaveURL(/\/order\/success\/SN-\d{4}/, { timeout: 15000 })
    await expect(page.getByText('Thank you for your order')).toBeVisible()
    await expect(page.getByText('Total Paid (COD)')).toBeVisible()
  })
})
