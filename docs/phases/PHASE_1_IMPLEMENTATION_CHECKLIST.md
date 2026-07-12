# Phase 1 — Implementation Checklist (milestone order)

Use this as the literal build order in VS Code. Each milestone should end
with a working `npm run lint && npm run type-check && npm run test && npm run build`
and an update to `docs/PROGRESS.md`. Do not start a milestone's UI before
its underlying data/service layer exists.

---

## Milestone 0 — Project init

- [ ] `create-next-app` (App Router, TypeScript strict, Tailwind, ESLint)
      inside this existing folder structure (do not let it overwrite
      `docs/`, `supabase/`, or the pre-made folder tree)
- [ ] Configure `tsconfig.json` path aliases matching `src/*`
- [ ] Install: `zod`, `react-hook-form`, `@hookform/resolvers`,
      `@supabase/ssr`, `@supabase/supabase-js`, `motion`, `razorpay`
- [ ] Install dev deps: `vitest`, `@testing-library/react`,
      `@playwright/test`, `prettier`
- [ ] Commit `package-lock.json`
- [ ] Wire up `src/config/design-tokens.ts` and `src/config/motion-tokens.ts`
      (see `docs/ARCHITECTURE.md` and design token list in the brief)
- [ ] `.env.example` filled with variable names only (already scaffolded —
      verify it matches what code actually references as you go)

## Milestone 1 — Supabase foundation

- [ ] Create Supabase project (external step — see `SUPABASE_SETUP.md`)
- [ ] Write migrations in `supabase/migrations/` implementing every table
      in `DATABASE_SCHEMA.md`, in dependency order (categories → products →
      product_images/options/variants → carts → orders → payments →
      shipments → store_settings → admin_profiles → admin_audit_logs →
      webhook_events)
- [ ] Enable RLS on every table in the same migration that creates it
- [ ] Write the `reserve_variant_stock` (or equivalent) `SECURITY DEFINER`
      function for atomic stock checks
- [ ] `src/lib/supabase/client.ts` (browser), `server.ts` (server component/
      action, cookie-based), `admin.ts` (service-role, server-only —
      import-guarded so it cannot be pulled into a Client Component)
- [ ] Generate `src/types/database.ts` from the Supabase schema
- [ ] Seed script (`supabase/seed/seed.ts`): categories, ≤20 products with
      variants, `store_settings` defaults (flat shipping rate, free-shipping
      threshold, COD enabled, active shipping provider = 'manual')
- [ ] Admin creation script (`supabase/seed/create-admin.ts`) — run manually,
      never as a public route

## Milestone 2 — Motion & design system foundation

- [ ] Design tokens wired into Tailwind config (colours, type scale,
      spacing, radii, shadows, container widths, z-index layers)
- [ ] Motion tokens (`fast`, `standard`, `slow-editorial` durations;
      `standard`, `premium` easings; stagger delay)
- [ ] Build motion primitives in `src/components/motion/`: `FadeIn`,
      `SlideUp`, `StaggerContainer`, `StaggerItem`, `ScaleOnHover`,
      `PageTransition`, `AnimatedDrawer`, `AnimatedModal`,
      `AnimatedCartItem`, `AnimatedCounter`, `RevealOnScroll` — each
      respecting `prefers-reduced-motion` via a shared hook
      (`useReducedMotion` from `motion/react`)
- [ ] Core `ui/` primitives: `Button`, `Input`, `Select`, `Textarea`,
      `Badge`, `Price` (paise → ₹ formatter), `Skeleton`, `Dialog`,
      `Drawer`, `Toast`

## Milestone 3 — Storefront shell

- [ ] `layout.tsx` for `(storefront)`: `AnnouncementBar`, `Header`,
      `MobileDrawerNav`, `Footer`
- [ ] Global error boundary + `not-found.tsx` (404) + `error.tsx`
- [ ] Central security headers wired in `next.config.ts` / middleware
- [ ] Rate limiter utility in `lib/security/rate-limit.ts` (used later by
      login, checkout, upload routes)

## Milestone 4 — Product catalogue (read path)

- [ ] `features/products/actions`: server-side product/category fetchers
      (with pagination, active-only filtering)
- [ ] Homepage sections built against real seeded data (not mock JSON)
- [ ] Shop page with filters (category, price, size, colour) + sort
- [ ] Category page
- [ ] Product detail page: gallery (swipe-friendly), variant selector
      (size + colour, disables unavailable combinations), sticky mobile
      add-to-cart bar, size chart, stock badge (low-stock/out-of-stock)
- [ ] Search results page
- [ ] SEO metadata (per-page `generateMetadata`), sitemap, robots.txt,
      product/breadcrumb structured data (JSON-LD)

## Milestone 5 — Admin: products, images, variants, categories

- [ ] Product list/create/edit forms (React Hook Form + Zod)
- [ ] Image uploader: multi-file, progress, reorder, delete, primary
      selection, MIME + signature validation, size limit, safe generated
      filenames, uploads restricted to authenticated admins
- [ ] Variant builder: size/colour option values → generated variant grid
      with SKU, stock, price adjustment, active toggle
- [ ] Category CRUD
- [ ] Inventory view: stock levels, low-stock flag, manual adjustment
      (writes `inventory_transactions` with `manual_adjustment` reason)

## Milestone 6 — Cart

- [ ] `features/cart`: client cart store (variant id, qty) persisted
      client-side, plus `POST /api/cart/validate` that re-fetches
      authoritative price/stock from the server
- [ ] Cart drawer (mobile) + cart page, `AnimatedCartItem` for qty changes
- [ ] Prevent adding an inactive/out-of-stock variant client-side (defense
      in depth — server re-validates regardless)

## Milestone 7 — Checkout & order creation

- [ ] Address form (React Hook Form + Zod), large touch-friendly mobile
      fields, minimal-distraction layout
- [ ] `POST /api/checkout`: revalidate cart → compute authoritative
      totals in paise → create `orders` + `order_items` (snapshotted) +
      `addresses` row inside a transaction → reserve stock
      (`inventory_transactions` reason = `order_reservation`)
- [ ] Duplicate-submit protection (idempotency key or disable-on-submit +
      server-side check)
- [ ] Order success page, basic order tracking page (order number + phone/
      email lookup, no raw table exposure)

## Milestone 8 — Razorpay payment

- [ ] `lib/razorpay`: server-only client wrapper
- [ ] `POST /api/payments/razorpay/order`: create Razorpay order using the
      **already-persisted** server-calculated order total
- [ ] Client-side Razorpay Checkout widget integration (isolated Client
      Component)
- [ ] `POST /api/payments/razorpay/verify`: signature verification
- [ ] `POST /api/webhooks/razorpay`: raw-body signature verification,
      `webhook_events` idempotency check, authoritative status transition,
      inventory commit/release (`order_completed` / `order_cancellation`
      reasons)
- [ ] Payment result page (success/failure/pending) with recovery path if
      the client redirect is interrupted (webhook still resolves the order)
- [ ] Payment state-transition logging (no secrets, no raw signatures)

## Milestone 8 — Cash on Delivery

- [ ] COD branch in `services/orders` fully separate from Razorpay branch
- [ ] Order status starts at `PENDING_CONFIRMATION`
- [ ] Admin manual-confirm action moves it to `CONFIRMED`

## Milestone 9 — Email notifications

- [ ] `lib/email`: `sendTransactionalEmail()` wrapping Resend/SMTP,
      failures caught + logged, never thrown into the order transaction
- [ ] Templates: order placed, payment successful, COD received, order
      cancelled, order shipped (triggered when admin adds tracking info)

## Milestone 10 — Admin authentication

- [ ] `/admin/login` page, rate-limited, generic error messages
- [ ] `requireAdmin()` helper (`lib/security/auth.ts`) used in every admin
      layout/page and every admin server action/route
- [ ] Session verified server-side on every protected request
- [ ] Redirect-after-login allow-list (no open redirect)
- [ ] `admin_audit_logs` write on every privileged mutation


## Milestone 12 — Admin: orders, inventory, settings, dashboard

- [ ] Order list (filter by status/payment method), order detail (customer/
      address, items, payment status, fulfilment status stepper, courier
      name + tracking number fields, internal note, cancel action, printable
      summary view)
- [ ] Inventory view: stock levels, low-stock flag, manual adjustment
      (writes `inventory_transactions` with `manual_adjustment` reason)
- [ ] Settings: flat shipping rate, free-shipping threshold, COD toggle,
      store contact info, active shipping provider
- [ ] Dashboard: total products, active products, low-stock variants, new
      orders, pending COD orders, paid orders, basic revenue summary,
      recent orders — no advanced analytics beyond this

## Milestone 13 — Shipping & tracking (manual)

- [ ] `services/shipping/manual` implementing `calculateRate`,
      `createShipment` (stores courier/tracking), `trackShipment`
      (returns the stored status) against the `ShippingProvider` interface
- [ ] `services/shipping/shiprocket` stub present, interface-compliant,
      not called anywhere yet
- [ ] Checkout shipping calculation reads flat rate + threshold from
      `store_settings` through the manual provider — not hardcoded inline

## Milestone 14 — Testing

- [ ] Vitest unit tests: price calculation, shipping charge calculation,
      free-shipping threshold, Razorpay signature verification, webhook
      idempotency, input validation schemas, authorization helper
- [ ] Vitest integration tests: variant availability, stock adjustment,
      order total generation
- [ ] Playwright e2e: browse product → select variant → add to cart →
      change quantity → COD checkout completes → out-of-stock variant
      cannot be purchased → admin login → admin creates/edits a product →
      admin updates an order status
- [ ] All payment tests use mocked Razorpay responses/fixtures — no real
      payment calls in automated tests

## Milestone 15 — Accessibility, performance, polish pass

- [ ] Keyboard navigation through nav, drawers, modals, forms
- [ ] Focus management on drawer/modal open+close
- [ ] Contrast check against design tokens
- [ ] `prefers-reduced-motion` verified across all motion primitives
- [ ] Lighthouse pass (mobile) — address serious issues, don't chase 100
- [ ] No horizontal overflow at 360px width
- [ ] Image loading/skeleton states reviewed

## Milestone 16 — Deployment readiness

- [ ] `npm run lint && npm run type-check && npm run test && npm run build`
      all green
- [ ] Playwright suite green
- [ ] `npm audit` reviewed
- [ ] `docs/DEPLOYMENT.md` followed end-to-end on a real Vercel project once
- [ ] `docs/PROGRESS.md` updated with final Phase 1 completion status
      against the `PHASE_1_SCOPE.md` checklist
