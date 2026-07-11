# Phase 4 — Advanced Business & Admin System (Design Only, Not Implemented)

Status: **Design/extension points reserved in Phase 1. Do not implement
below until Phase 4 is greenlit.**

## Preconditions from Phase 1 (already in place)

- `admin_audit_logs` already capturing every privileged mutation — advanced
  audit UI is a read layer on existing data, not a new logging system
- `inventory_transactions` ledger already append-only and reason-coded —
  sales/profit reporting reads from this plus `order_items` snapshots
  rather than needing new tracking
- Order status enum already includes `RETURN_REQUESTED`/`RETURNED` —
  the returns portal implements workflow UI around states that already
  exist in the schema
- `admin_profiles.role` is a plain text/enum column specifically so
  `staff_roles`/`staff_permissions` can extend it later without changing
  every `requireAdmin()` call site
- Notification abstraction (`features/notifications`) already
  provider-agnostic — WhatsApp becomes a second implementation of the same
  interface email uses in Phase 1

## What Phase 4 adds

1. **Advanced dashboard** — sales reports, profit reporting, low-stock
   alerts, repeat-customer/cohort views
2. **Return & exchange portal** — `return_requests`, `return_items`,
   `refunds`; Razorpay refund API integration (treated as its own scoped
   payment-security review, not a bolt-on to Phase 1's payment code)
3. **WhatsApp Business API integration** — second `NotificationChannel`
   implementation
4. **Staff roles & permissions** — `staff_roles`, `staff_permissions`,
   extending beyond the single Phase 1 admin role
5. **Customer management** admin views
6. **Abandoned cart automation** (`abandoned_carts`)
7. **Promotional campaigns**
8. **Operational analytics**, monitoring/alerting (e.g. Sentry) wired into
   the `lib/observability` slot reserved in Phase 1, backup automation

## Explicit non-goals for Phase 4

- Does not replace the Phase 1 order/payment state machine — extends it
  with return/refund states that were already reserved.
- Does not require re-keying historical orders — reporting reads existing
  snapshots.

## Open questions to resolve before implementation

- Refund policy specifics (partial refunds, restocking fees)
- Staff role definitions (e.g. "packer" vs "support" vs "manager")
- Monitoring provider choice and budget
