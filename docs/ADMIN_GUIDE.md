# Admin Guide (Phase 1)

## Logging in

Go to `/admin/login`. Only a pre-created admin account (see
`SUPABASE_SETUP.md` §5) can sign in — there is no public admin signup.

## Managing products

`/admin/products`

1. **New product** (`/admin/products/new`): name, description, short
   description, category, base price, optional compare-at price, fabric,
   care instructions, fit info, size chart, SEO title/description.
2. **Images**: upload multiple photos (4:5 aspect ratio recommended),
   reorder by dragging, mark one as primary, delete unwanted images. Only
   image files under the configured size limit are accepted.
3. **Variants**: define option types (Size, Colour), then their values
   (S/M/L, Black/White/...). The system generates the variant grid — set
   SKU, stock quantity, and any price adjustment per variant, and toggle
   each variant active/inactive.
4. **Status**: toggle Active/Inactive (inactive products don't show in the
   storefront), Featured, New Arrival.

## Managing categories

`/admin/categories` — create/edit/reorder categories, each with its own
slug and SEO metadata.

## Managing orders

`/admin/orders`

- Filter by status and payment method.
- Open an order to see the customer's contact/address info, ordered
  items (with size/colour/SKU as they were **at time of purchase** — this
  does not change if you later edit the product), payment status, and
  fulfilment status.
- **Cash on Delivery orders** start as `PENDING_CONFIRMATION` — manually
  confirm once you've called/verified the customer, moving it to
  `CONFIRMED`.
- Update fulfilment status as the order moves through
  `PROCESSING → PACKED → SHIPPED → DELIVERED`.
- When marking `SHIPPED`, enter the courier name and tracking number —
  this triggers the "order shipped" email automatically.
- Add an internal note (visible only to admins) for anything worth
  recording.
- Cancel an order if needed — this releases reserved stock back to
  inventory automatically.
- Print a basic order summary for packing/dispatch.

## Managing inventory

`/admin/inventory` — view stock per variant, see low-stock/out-of-stock
flags, and make manual adjustments (e.g. correcting a stock count after a
physical audit). Every adjustment is recorded in the inventory ledger with
a reason, so stock history is always auditable.

## Settings

`/admin/settings` — flat shipping rate, free-shipping threshold, whether
Cash on Delivery is enabled, store contact details shown on the storefront.

## What the admin panel does **not** do in Phase 1

- No automated courier booking (Shiprocket) — courier name and tracking
  number are entered manually. Automation arrives in Phase 2.
- No coupon management — arrives in Phase 3.
- No refund automation — cancellations release inventory, but any monetary
  refund for a prepaid order must currently be processed manually in the
  Razorpay dashboard. Automated refunds arrive in Phase 4.
- No staff accounts — one administrator only in Phase 1.
- No advanced sales/profit reporting — the dashboard shows basic counts and
  a basic revenue summary only.
