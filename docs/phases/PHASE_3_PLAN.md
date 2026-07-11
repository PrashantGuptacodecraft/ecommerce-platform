# Phase 3 — Premium Customer Experience (Design Only, Not Implemented)

Status: **Design/extension points reserved in Phase 1. Do not implement
below until Phase 3 is greenlit.**

## Preconditions from Phase 1 (already in place)

- `orders.customer_id`, `carts.customer_id`, `addresses.customer_id` are
  already nullable FKs pointing at `customers`
- Guest checkout stores full contact/address info directly, so historical
  orders can be retroactively linked once accounts exist
- `discount_paise` column already present on `orders` (unused/zero in
  Phase 1) — coupons fill this in rather than adding a new column
- Product image transitions use stable, predictable DOM structure so a
  `layoutId`-based shared transition can be added later without
  restructuring `ProductCard`/`ProductGallery`

## What Phase 3 adds

1. **`customer_accounts`** — Supabase Auth for shoppers (separate
   audience from `admin_profiles`), with a migration step to link existing
   guest orders by verified phone/email match
2. **My Orders** page, **saved addresses**
3. **Wishlist** (`wishlists`, `wishlist_items`)
4. **Advanced search & filters** (facets, relevance tuning) — still no
   paid external search service unless separately approved
5. **Coupons** (`coupons`, `coupon_redemptions`) wired into the existing
   `discount_paise` checkout total field
6. **Related products, recently viewed**
7. **Premium editorial transitions** — shared-layout product image
   transitions, richer collection page storytelling, deeper scroll-driven
   reveals (still respecting `prefers-reduced-motion`)
8. **Invoice PDF download**
9. **Reviews** (`reviews`) — only once a moderation policy is approved;
   never fabricated/seeded fake reviews

## Explicit non-goals for Phase 3

- Does not remove guest checkout — accounts are additive, not mandatory.
- Does not change the order/payment state machine from Phase 1.
- Does not require re-architecting the cart — the cart's `customer_id`
  nullable column already anticipates logged-in cart merging.

## Open questions to resolve before implementation

- Review moderation policy (manual approval vs automated)
- Coupon stacking rules (single-use vs combinable)
- Whether wishlist requires an account or supports a guest/local variant
