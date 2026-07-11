# Architecture

## 1. Principles

1. **Server Components by default.** Client Components only where
   interaction, browser APIs, or `motion/react` animation require it. Never
   wrap an entire page in `"use client"` just because one widget is
   interactive — isolate the interactive part.
2. **Business logic lives outside page components.** Pages (`src/app/**`)
   compose UI and call into `features/*/actions` or `services/*`. They do
   not contain pricing math, stock logic, or payment logic inline.
3. **Service boundaries are hard.** Payments, shipping, inventory, and
   presentation never share a file. Each `services/*` module exposes a
   narrow, typed interface; nothing outside it reaches into its internals.
4. **The browser is not a trusted pricing source.** Every price, stock
   check, and payable amount is recomputed server-side at checkout, order
   creation, and payment verification. Ever.
5. **Interfaces are designed for the phase after next.** Phase 1 implements
   the *manual* shipping provider behind a `ShippingProvider` interface so
   Phase 2's Shiprocket provider is a new file, not a rewrite. Same pattern
   for notifications (email now, WhatsApp later) and identity (guest orders
   now, customer accounts later via a nullable `customer_id`).

## 2. High-level module map

```
Storefront (public)          Admin (protected)             API / Services
──────────────────           ───────────────────           ────────────────────
(storefront)/ pages    ───▶  features/*/actions      ───▶  services/payments/razorpay
components/storefront        (server actions, Zod          services/shipping/manual
components/product           validated, auth-checked)       services/shipping/shiprocket (P2 stub)
components/cart                                             services/inventory
components/checkout          admin/ pages            ───▶   services/orders
components/motion            components/admin
                                                       lib/supabase (browser + server clients)
                                                       lib/razorpay (server-only)
                                                       lib/security (headers, rate limit, csrf)
                                                       lib/email (transactional email)
                                                       lib/validation (shared Zod schemas)
```

## 3. Annotated folder tree

```text
src/
  app/
    (storefront)/            # Public route group — no auth required
      shop/                  # Full catalogue with filters/sort
      category/[slug]/       # Category landing page
      product/[slug]/        # Product detail page (variants, gallery)
      search/                # Search results
      cart/                  # Cart page (mobile: also a drawer component)
      checkout/              # Guest checkout form
      order/success/         # Post-order confirmation
      order/[id]/track/      # Basic order tracking (order id + phone/email lookup)
      payment/result/        # Razorpay redirect landing (success/failure/pending)
      contact/  about/
      policies/shipping|returns|privacy|terms/
      layout.tsx             # Storefront chrome: announcement bar, nav, footer
    admin/                    # Protected route group — server-verified admin role
      login/
      products/  products/new/  products/[id]/
      categories/
      orders/  orders/[id]/
      inventory/
      settings/
      layout.tsx              # Admin chrome: sidebar, auth guard wrapper
    api/
      checkout/                # POST — validate cart+address, create pending order
      orders/  orders/[id]/    # Order read endpoints (scoped, no full order list to guests)
      payments/razorpay/order/   # POST — create Razorpay order server-side
      payments/razorpay/verify/  # POST — verify signature after client checkout completes
      webhooks/razorpay/         # POST — independent webhook signature verification
      admin/products/  admin/orders/  admin/upload/   # Admin mutations, all re-verify role server-side
      cart/                     # Cart validation endpoint (price/stock re-check)

  components/
    ui/            # Design-system primitives: Button, Input, Select, Badge, Price, etc.
    layout/        # AnnouncementBar, Header, MobileDrawerNav, Footer
    storefront/    # HomepageHero, CategoryGrid, NewArrivals, EditorialBanner, Newsletter
    product/       # ProductCard, VariantSelector, ProductGallery, SizeChart, StockBadge
    cart/          # CartDrawer, CartLineItem, CartSummary
    checkout/      # AddressForm, PaymentMethodSelector, OrderSummaryPanel
    admin/         # AdminSidebar, AdminTable, AdminStatCard, ImageUploader, OrderStatusStepper
    motion/        # FadeIn, SlideUp, StaggerContainer/Item, ScaleOnHover, PageTransition,
                    # AnimatedDrawer, AnimatedModal, AnimatedCartItem, AnimatedCounter, RevealOnScroll

  features/<domain>/
    components/    # Domain-specific client components (thin, presentation only)
    hooks/          # Client-side hooks (e.g. useCart, useCheckoutForm)
    actions/        # Server Actions / route handlers calling services/*, Zod-validated
    types/          # Domain types + Zod schemas

  lib/
    supabase/       # createBrowserClient(), createServerClient(), createAdminClient() (service-role, server-only)
    razorpay/        # Server-only SDK wrapper: createOrder(), verifySignature(), verifyWebhookSignature()
    validation/       # Shared Zod schemas (address, checkout payload, product, variant)
    security/         # Security headers config, rate limiter, CSRF/origin checks
    email/            # sendTransactionalEmail() abstraction over Resend/SMTP
    utilities/        # money (paise helpers), slug, formatting, pagination helpers

  services/
    payments/razorpay/     # Payment provider implementation (isolated from order logic)
    shipping/manual/       # Phase 1 ShippingProvider implementation
    shipping/shiprocket/   # Phase 2 stub — interface satisfied, methods throw "not implemented"
    inventory/              # reserveStock(), commitStock(), releaseStock(), recordMovement()
    orders/                  # createPendingOrder(), finalizeOrder(), cancelOrder() — the only
                              # place order state transitions happen

  types/            # Cross-cutting shared types (Database types generated from Supabase)
  config/           # brand.ts, navigation.ts, motion-tokens.ts, design-tokens.ts, site.ts

supabase/
  migrations/       # Numbered SQL migrations — schema + RLS, source of truth for DB
  seed/             # Seed script: ≤20 realistic products, categories, variants, store_settings

tests/
  unit/             # Price calc, shipping calc, signature verification, validation
  integration/      # Checkout flow, webhook idempotency, stock adjustment
  e2e/              # Playwright: browse→cart→COD checkout, admin product CRUD, etc.
  fixtures/         # Mock Razorpay payloads, test users, sample carts
```

## 4. Request flow: checkout → payment (Phase 1)

```
1. Client: cart state (localStorage/client) → POST /api/cart/validate
   → server re-fetches variants, prices, stock → returns authoritative totals

2. Client: submits checkout form (address + payment method) → POST /api/checkout
   → Zod validation → services/orders.createPendingOrder()
     → services/inventory.reserveStock() inside a DB transaction/RPC
     → order status: PENDING_PAYMENT (Razorpay) or PENDING_CONFIRMATION (COD)

3a. COD path: order created, confirmation email queued, done.

3b. Razorpay path:
    → POST /api/payments/razorpay/order
      → services/payments/razorpay.createOrder(amountFromServerOrder)
      → Razorpay order_id returned to client
    → Client completes Razorpay Checkout widget
    → POST /api/payments/razorpay/verify
      → verify signature server-side (never trust client callback alone)
      → mark order tentatively paid ONLY if signature valid
    → POST /api/webhooks/razorpay (async, independent of client)
      → verify webhook signature using raw body + webhook secret
      → idempotency check against webhook_events table (event id)
      → authoritative payment state transition + inventory commit/release
```

The webhook — not the client redirect — is the **authoritative** source of
truth for payment completion. The client-side verify step exists for fast
UX feedback only.

## 5. Shipping abstraction (Phase 1 → Phase 2)

```ts
interface ShippingProvider {
  checkServiceability(input: ServiceabilityInput): Promise<ServiceabilityResult>;
  calculateRate(input: ShippingRateInput): Promise<ShippingRateResult>;
  createShipment(input: CreateShipmentInput): Promise<ShipmentResult>;
  cancelShipment(shipmentId: string): Promise<void>;
  trackShipment(trackingId: string): Promise<TrackingResult>;
}
```

- `services/shipping/manual` implements only what Phase 1 needs:
  `calculateRate` (flat rate + free-shipping threshold from `store_settings`)
  and a manual `createShipment`/`trackShipment` that just stores
  courier name + tracking number entered by the admin.
- `services/shipping/shiprocket` is stubbed now (folder + interface
  compliance, methods throw `NotImplementedError`) so Phase 2 fills in real
  API calls without touching `features/checkout` or `features/orders`.
- Nothing in `features/*` or `app/*` calls a shipping provider directly —
  always through `services/shipping/index.ts`'s `getActiveShippingProvider()`,
  which reads the active provider from `store_settings`.

## 6. Notifications abstraction

`lib/email` exposes `sendTransactionalEmail(type, payload)`. Email failure
is caught and logged, never thrown into the order transaction — an order
must not fail because an email failed. Phase 4 adds a WhatsApp channel by
adding a second implementation behind the same `NotificationChannel`
interface in `features/notifications`.

## 7. Identity abstraction (guest → accounts later)

`orders.customer_id` is **nullable** in Phase 1 (guest checkout). Guest
orders store contact info (name, phone, email) directly on the order/address
record. Phase 3 introduces `customer_accounts` and a migration path that
links historical guest orders to accounts by verified phone/email — no
schema rewrite, just a new nullable FK relationship already planned for in
`DATABASE_SCHEMA.md`.

## 8. Rendering & performance strategy

- Product listing/detail pages: Server Components, data fetched on the
  server, streamed with Suspense where beneficial.
- Interactive islands only: variant selector, gallery swipe, cart drawer,
  quantity steppers, admin forms — these are Client Components.
- Images: Next.js `<Image>` with responsive `sizes`, 4:5 aspect ratio
  enforced at upload time, served from Supabase Storage public bucket.
- Public catalogue data cached (ISR/revalidate); admin and cart/order data
  never cached at the CDN layer.
