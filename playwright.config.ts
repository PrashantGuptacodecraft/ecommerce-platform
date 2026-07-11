import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright e2e configuration.
 *
 * Critical-path specs (browse → cart → COD checkout, admin product CRUD,
 * out-of-stock guard, …) are authored in Milestone 14 under `tests/e2e/`.
 * This config is the Milestone 0 scaffold: no specs exist yet, and browsers
 * are not installed as part of project init (`npx playwright install` is a
 * deployment/CI step). Mobile-first: the default project is a small viewport.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: process.env.SITE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
