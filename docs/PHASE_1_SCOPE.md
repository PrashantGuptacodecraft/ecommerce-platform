# Phase 1 Scope — Exact Boundary

## Commercial boundaries

- One storefront, one store, one currency (INR).
- One administrator role (no staff permission levels yet).
- Guest checkout only (no forced customer registration).
- Payment methods: Razorpay (test mode first) + Cash on Delivery.
- Shipping: flat charge + configurable free-shipping threshold, **manual**
  courier name/tracking entry by admin.
- Maximum **20** seed/sample products at launch (schema has no hard limit —
  this is a content/commercial boundary, not a technical one).
- Basic transactional email only (order placed, payment success, COD
  received, cancelled, shipped).
- Basic admin dashboard numbers only — no advanced analytics.

## Public storefront pages (all required)

Homepage · Shop · Category · Product detail · Search results · Cart ·
Checkout · Payment result · Order success · Order tracking (basic) ·
Contact · About · Shipping policy · Return & exchange policy · Privacy
policy · Terms & conditions · 404 · Error state pages.

## Homepage sections (all required)

Announcement bar · Responsive nav + mobile drawer · Hero campaign ·
Shop by category · New arrivals · Featured collection · Best sellers ·
Promotional editorial banner · Brand value section · Customer reassurance
section · Newsletter/WhatsApp CTA · Premium footer.

## Admin routes (all required)

`/admin/login` · `/admin` (dashboard) · `/admin/products` (+ `/new`, `/[id]`)
· `/admin/categories` · `/admin/orders` (+ `/[id]`) · `/admin/inventory` ·
`/admin/settings`.

## Explicitly excluded from Phase 1

Do not quietly implement any of the following — if attempted, stop and
flag it instead of building it silently:

- Native mobile applications
- Multi-vendor features
- Multiple warehouses
- Loyalty points
- Customer accounts / login for shoppers
- Automated returns or automated refunds
- WhatsApp API automation (a WhatsApp *link* CTA is fine; API automation is not)
- Shiprocket API automation (manual entry only; interface reserved)
- AI-generated model photography
- Virtual try-on
- Advanced ERP / GST-accounting software integration
- Unlimited product catalogue tooling beyond what 20 products need
- Multiple staff permission levels
- Advanced analytics / BI dashboards

## Definition of done for Phase 1

Copied from the project brief's completion checklist — treat this as the
literal exit criteria, verified and recorded in `PROGRESS.md` before Phase 1
is declared complete:

- [ ] Storefront polished on mobile (~360px+) and desktop
- [ ] Motion smooth, accessible, respects `prefers-reduced-motion`
- [ ] Products served from the real Supabase database (not mock JSON)
- [ ] Variant stock enforced correctly, cannot go negative
- [ ] Admin can fully manage products, images, variants, categories
- [ ] Product images upload securely (type/size/signature validated)
- [ ] Cart works, persists, validates against server on checkout
- [ ] Server-side totals are authoritative (never trust client amount)
- [ ] COD checkout works end-to-end
- [ ] Razorpay test-mode checkout works end-to-end
- [ ] Razorpay payment signature verified server-side
- [ ] Razorpay webhook received, signature-verified, idempotent
- [ ] Orders stored correctly with immutable line-item snapshots
- [ ] Admin routes and mutations protected server-side (not just hidden UI)
- [ ] RLS policies present on every table and exercised by tests
- [ ] No secret (service-role key, Razorpay secret, SMTP creds) reachable
      from the browser bundle, logs, or git history
- [ ] Core transactional emails implemented and failure-isolated
- [ ] Manual shipping status/tracking manageable by admin
- [ ] Error and empty states exist across storefront and admin
- [ ] `npm run lint && npm run type-check && npm run test && npm run build` pass
- [ ] Playwright critical-path tests pass
- [ ] Deployment instructions complete and followed successfully once
- [ ] Phase 2–4 features can be added without touching Phase 1 foundations
