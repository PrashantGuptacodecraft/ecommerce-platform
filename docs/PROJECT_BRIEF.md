# Project Brief

## What we are building

A premium, mobile-first, single-store e-commerce platform for an Indian
clothing shop. The shop sells apparel with **size + colour variants**
(e.g. Black/M, White/L) and needs the store to be genuinely operable by staff
who are not developers.

This is **not** a demo, template, or static site. Phase 1 must be a real,
working store: real database, real inventory, real payments (Razorpay +
Cash on Delivery), real order management.

## Who uses it

- **Shoppers** (guests, no forced signup in Phase 1) — browse, pick
  size/colour, checkout via Razorpay or COD, track order status.
- **Store administrator** (one role in Phase 1) — manages products, images,
  variants, stock, and orders through a custom secure admin panel (not the
  raw Supabase dashboard).

## Commercial framing

Phase 1 is scoped and priced like a **₹20,000 MVP engagement**: tight,
focused, but professionally built — strong security, smooth motion, real
persistence, real payments. It must not look, feel, or behave like a
"cheap MVP." The **architecture**, however, is priced/designed like an
**₹80,000 system**: clean service boundaries so Phases 2–4 (Shiprocket
automation, customer accounts, coupons, wishlists, advanced admin analytics,
staff roles, refunds, WhatsApp) can be added incrementally without
rewriting Phase 1 foundations.

## Non-negotiable constraints

- Mobile-first (design/test from ~360px up).
- Motion is part of Phase 1, not a "later polish" item — but must be tasteful,
  performant, and respect `prefers-reduced-motion`.
- Server is the source of truth for price, stock, and payment amount —
  the browser is never trusted for money-related data.
- Row Level Security enabled and deliberately configured on every table.
- No secrets in the client bundle, logs, or git history.
- Maximum 20 seed products in Phase 1 (commercial boundary, not a technical
  limit — the schema supports far more).
- One store, one currency (INR), one admin role, guest checkout only.

## Explicitly out of scope for Phase 1

Native apps, multi-vendor, multiple warehouses, loyalty points, customer
accounts, automated returns/refunds, WhatsApp API automation, Shiprocket API
automation, AI model photography, virtual try-on, advanced ERP/GST software,
multiple staff permission levels, advanced analytics. These are documented
future upgrades — see `PHASE_ROADMAP.md`.

## Brand details

Brand name, exact palette, logo, and copy are **not yet supplied**. Phase 1
uses a configurable placeholder brand ("STUDIO NOIR" — refined neutral
fashion palette + one restrained accent colour) so implementation isn't
blocked. All brand values live in `src/config/brand.ts` and
`store_settings` (DB), so swapping real branding later touches
configuration, not components. Recorded as a decision in `DECISIONS.md`.
