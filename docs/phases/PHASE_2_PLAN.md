# Phase 2 — Shipping & Operational Automation (Design Only, Not Implemented)

Status: **Design/interface reserved in Phase 1. Do not implement the items
below until Phase 2 is greenlit.**

## Preconditions from Phase 1 (already in place)

- `ShippingProvider` interface defined in `services/shipping/`
- `services/shipping/manual` fully working
- `services/shipping/shiprocket` folder + stub exists, throws
  `NotImplementedError` for each method, but satisfies the interface shape
- `shipments` table already has a `provider` column (`'manual' | 'shiprocket'`)
- `store_settings` already has an `active_shipping_provider` key

## What Phase 2 adds

1. **Real Shiprocket implementation** in `services/shipping/shiprocket/`:
   - `checkServiceability` — pincode serviceability check at checkout
   - `calculateRate` — live courier rate comparison (replaces/augments the
     flat rate for eligible orders)
   - `createShipment` — creates the shipment + AWB in Shiprocket after
     order confirmation
   - `cancelShipment` — cancel before pickup
   - `trackShipment` — pull live tracking status
2. **Webhook endpoint** `/api/webhooks/shiprocket` — same idempotency
   pattern as `/api/webhooks/razorpay` (verify signature, dedupe by event
   id, transition `shipments.status`)
3. **Label & pickup scheduling** admin UI (replaces manual courier/tracking
   text fields when Shiprocket is the active provider — manual entry stays
   available as a fallback provider)
4. **Tracking synchronization** — webhook-first, with a periodic
   reconciliation job as backup
5. **Reverse shipment foundation** — pickup request support, feeding into
   the Phase 4 returns portal
6. **Enhanced order tracking UI** — animated shipment timeline (richer
   motion than Phase 1's static status list), live status badges

## Explicit non-goals for Phase 2

- Does not touch payments, inventory, or catalogue code.
- Does not require new customer-facing routes beyond enhancing the
  existing `/order/[id]/track` page.
- Does not require a schema rewrite — only additive columns/tables if a
  genuine gap is found (e.g. `shipment_events` audit table), never a
  breaking change to `orders`/`order_items`.

## Open questions to resolve before implementation

- Shiprocket API credential/account setup owner
- Pickup location(s) configuration
- Whether COD remittance reconciliation is in scope for Phase 2 or deferred
