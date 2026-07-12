# Phase Roadmap

Each phase is additive. No phase requires restructuring the database,
service boundaries, or route structure established in Phase 1 — only new
tables, new provider implementations, and new UI are added.

## Phase 1 — Secure Premium Commerce MVP (₹20,000 level) — BUILD NOW

| Area | Scope |
|---|---|
| Storefront | Full premium storefront, all pages listed in `PHASE_1_SCOPE.md` |
| Motion | Full reusable motion system, tasteful use across storefront + admin |
| Catalogue | Products, categories, true size/colour variants, ≤20 seed products |
| Cart & Checkout | Guest cart, server-validated checkout, address form |
| Payments | Razorpay (test mode) + Cash on Delivery, full signature + webhook verification |
| Shipping | Flat rate + free-shipping threshold, manual courier/tracking entry |
| Inventory | Variant-level stock, transactional reservation, inventory_transactions ledger |
| Admin | Custom secure admin panel: M5A/M5B (transactional mutations + image uploads), M5C (secure React UI) |
| Email | Order placed / payment success / COD received / cancelled / shipped |
| Security | RLS everywhere, security headers, rate limiting, audit log, strict auth |
| SEO | Metadata, sitemap, robots, structured data, canonical URLs |
| Testing | Vitest unit/integration + Playwright critical-path e2e |
| Deployment | Vercel-ready, documented env vars, migrations, seed |

**Explicitly not built in Phase 1** (interfaces reserved only):
customer accounts, wishlists, coupons, automated shipping (Shiprocket),
WhatsApp automation, refunds/returns portal, staff roles, advanced
analytics, AI photography, virtual try-on.

**Sequencing note (2026-07-11):** functional **administrator authentication +
authorization** was moved earlier — from Milestone 10 to **Milestone 3** — and
implemented alongside the security-header foundation. Rationale: no privileged
admin functionality (product/order/inventory management, uploads, dashboard
data) may be built behind a merely-cosmetic "shell"; the real auth boundary
(`requireAdmin()`, active-`admin_profiles` check, session verification,
generic errors, open-redirect-safe return paths, rate-limited login, logout)
must exist before any of it. Milestone 10 in
`PHASE_1_IMPLEMENTATION_CHECKLIST.md` is therefore already satisfied as of
Milestone 3; remaining M10-adjacent items (per-mutation `admin_audit_logs`
writes, distributed production rate-limit store) are folded into the milestones
that introduce those mutations. See `SECURITY_MODEL.md` §6 and
`DECISIONS.md` (#34).

## Phase 2 — Shipping & Operational Automation

Depends on: Phase 1 `ShippingProvider` interface and `shipments` table.

- `services/shipping/shiprocket` real implementation (serviceability check,
  courier rate comparison, shipment creation, AWB assignment, label
  generation, pickup scheduling).
- Shiprocket webhook endpoint (`/api/webhooks/shiprocket`) mirroring the
  idempotency pattern already used for Razorpay webhooks.
- Tracking synchronization job (polling or webhook-driven) updating
  `shipments.status`.
- Reverse shipment foundation (return pickup requests) — table groundwork
  only, full flow may land with Phase 4 returns portal.
- Enhanced tracking timeline UI + richer motion (animated shipment
  timeline, live status transitions) on the order tracking page.
- Admin: replace "manual courier name/tracking" free-text with a
  Shiprocket-driven picker, while keeping the manual provider available as
  a fallback (interface already supports both, selectable in
  `store_settings`).

## Phase 3 — Premium Customer Experience

Depends on: Phase 1 nullable `customer_id` columns, guest order data model.

- `customer_accounts` (Supabase Auth for customers, separate from admin),
  linking historical guest orders by verified phone/email.
- My Orders, saved addresses, wishlist (`wishlists`, `wishlist_items`).
- Advanced search & filters (facets, better relevance) — still no paid
  external search service unless explicitly approved then.
- Coupons (`coupons`, `coupon_redemptions`) — the discount placeholder
  architecture from Phase 1 checkout (an already-present `discount_paise`
  column) is filled in here, not invented from scratch.
- Related products, recently viewed.
- Premium editorial transitions, shared-layout product image transitions
  (`layoutId` based), richer collection page storytelling.
- Invoice PDF download for orders.
- Reviews (`reviews`) — only if/when moderation policy is approved.

## Phase 4 — Advanced Business & Admin System

Depends on: Phase 1 `admin_audit_logs`, `inventory_transactions`, order
status enum, notification abstraction.

- Advanced dashboard: sales reports, profit reporting, low-stock alerts,
  cohort/repeat-customer views.
- Return & exchange portal (`return_requests`, `return_items`, `refunds`),
  Razorpay refund API integration (separate, carefully-scoped payment
  security review — see `SECURITY_MODEL.md` §5).
- WhatsApp Business API integration, added as a second implementation of
  the Phase 1 `NotificationChannel` interface (email is the first).
- Staff roles & permissions (`staff_roles`, `staff_permissions`) extending
  `admin_profiles.role` from a single admin to multiple scoped roles.
- Customer management, abandoned cart automation (`abandoned_carts`),
  promotional campaigns.
- Operational analytics, monitoring/alerting (e.g. Sentry) wired into the
  `lib/observability` slot reserved in Phase 1, backup automation.

## Cross-phase rule

Every phase should **increase visual polish and animation sophistication**
while holding performance and accessibility steady or improving them — a
later phase must never make the storefront feel slower or less accessible
than the one before it.
