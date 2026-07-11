# Future Shiprocket Integration (Phase 2 Reference)

This document exists so the Phase 1 `services/shipping/shiprocket` stub is
implemented consistently when Phase 2 begins — it is reference material,
not a Phase 1 task list (see `docs/phases/PHASE_2_PLAN.md` for the plan).

## Interface to satisfy

```typescript
interface ShippingProvider {
  checkServiceability(input: ServiceabilityInput): Promise<ServiceabilityResult>;
  calculateRate(input: ShippingRateInput): Promise<ShippingRateResult>;
  createShipment(input: CreateShipmentInput): Promise<ShipmentResult>;
  cancelShipment(shipmentId: string): Promise<void>;
  trackShipment(trackingId: string): Promise<TrackingResult>;
}
```

`services/shipping/manual` already implements the subset Phase 1 needs.
`services/shipping/shiprocket` will implement the full interface against
Shiprocket's actual API.

## Mapping (indicative — confirm against current Shiprocket API docs when
implementing, do not assume this is exhaustive or unchanged)

| Interface method | Shiprocket API area |
|---|---|
| `checkServiceability` | Courier Serviceability endpoint (pincode, weight, COD flag) |
| `calculateRate` | Same serviceability response typically includes rate estimates per courier |
| `createShipment` | Order creation + AWB assignment endpoints |
| `cancelShipment` | Cancel order/shipment endpoint |
| `trackShipment` | Tracking endpoint (by AWB or order id) |

## Data model implications

- `shipments.provider = 'shiprocket'` for orders using this provider;
  `'manual'` remains available as a fallback (e.g. hyperlocal deliveries
  the shop handles itself).
- Additional Shiprocket-specific identifiers (AWB code, courier id,
  Shiprocket order id) should be stored in a `provider_metadata jsonb`
  column on `shipments` rather than adding many provider-specific columns
  to the shared table — keeps the schema provider-agnostic.
- Webhook handling for shipment status updates follows the same pattern as
  `/api/webhooks/razorpay`: raw body signature verification, an
  idempotency table (or reuse `webhook_events` with `provider = 'shiprocket'`),
  then a state transition.

## Explicit constraints carried over from Phase 1 principles

- No shipping-provider-specific assumptions leak into `features/checkout`,
  `features/orders`, or any `app/` page — everything routes through
  `services/shipping/index.ts`'s `getActiveShippingProvider()`.
- Switching the active provider is a `store_settings` change, not a code
  deploy, wherever practical.
- COD serviceability (does Shiprocket support COD to this pincode) must be
  checked before allowing COD as a payment option at checkout once this
  integration is live — Phase 1's flat-rate COD has no such check, which
  is an acceptable Phase 1 limitation to resolve here.
