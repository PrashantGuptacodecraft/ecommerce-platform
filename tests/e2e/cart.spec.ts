import { test, expect, type Page } from '@playwright/test'

// Note: Ensure your local dev server is running before executing this.
// Uses deterministic dummy data setup in the beforeAll/beforeEach if necessary,
// or relies on the seed data.

async function selectFullVariant(page: Page) {
  // Wait for the radiogroups to be attached/visible instead of networkidle
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
  test.beforeEach(async ({ page }) => {
    // Navigate to a seeded product page.
    await page.goto('/product/essential-crew-tee')
  })

  test('adds to cart and displays in drawer', async ({ page }) => {
    await selectFullVariant(page)

    const addBtn = page.getByRole('button', { name: /Add to Cart/i })

    // Click Add to Cart
    await addBtn.click()

    // Assuming we have a cart badge we can click, or the drawer opens automatically.
    // The requirement is to open the cart drawer:
    const cartBadge = page.getByLabel('View Cart')
    await cartBadge.click()

    // Verify drawer is open
    const drawerTitle = page.getByRole('heading', { name: /Your Cart/i })
    await expect(drawerTitle).toBeVisible()

    // Verify item is inside
    const itemName = page.getByText('Essential Crew Tee').first()
    await expect(itemName).toBeVisible()

    // Verify subtotal exists
    const subtotal = page.getByText(/Subtotal/i)
    await expect(subtotal).toBeVisible()
  })

  test('updates quantity and removes item in cart drawer', async ({ page }) => {
    await selectFullVariant(page)
    await page.getByRole('button', { name: /Add to Cart/i }).click()

    // Open drawer
    await page.getByLabel('View Cart').click()

    // Increase quantity
    const increaseBtn = page.getByLabel('Increase quantity')
    await increaseBtn.click()

    // Quantity should be 2
    const qtySpan = page.locator('span').filter({ hasText: /^2$/ })
    await expect(qtySpan).toBeVisible()

    // Remove item
    const removeBtn = page.getByLabel('Remove item')
    await removeBtn.click()

    // Cart should be empty
    await expect(page.getByText(/Your cart is empty/i)).toBeVisible()
  })

  test('cart persists securely across page refresh', async ({ page }) => {
    await selectFullVariant(page)
    await page.getByRole('button', { name: /Add to Cart/i }).click()

    // Reload page
    await page.reload()

    // Open cart
    await page.getByLabel('View Cart').click()

    // Item should still be there
    await expect(page.getByText('Essential Crew Tee').first()).toBeVisible()
  })

  test('separate browser sessions have isolated carts', async ({ browser }) => {
    // Context 1
    const context1 = await browser.newContext()
    const page1 = await context1.newPage()
    await page1.goto('/product/essential-crew-tee')

    await selectFullVariant(page1)
    await page1.getByRole('button', { name: /Add to Cart/i }).click()

    // Context 2
    const context2 = await browser.newContext()
    const page2 = await context2.newPage()
    await page2.goto('/cart')

    // Context 2 cart should be empty
    await expect(page2.getByText(/Your cart is currently empty/i)).toBeVisible()

    await context1.close()
    await context2.close()
  })
})
