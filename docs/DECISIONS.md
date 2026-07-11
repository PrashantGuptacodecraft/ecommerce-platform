# Decisions Log

Record every assumption or placeholder made in the absence of real brand/
business input. Update this file whenever a new assumption is introduced;
never silently assume.

| # | Date | Decision | Reason | Reversible? |
|---|---|---|---|---|
| 1 | Scaffold | Placeholder brand name "STUDIO NOIR", refined neutral palette + one restrained accent colour | Real brand assets not yet supplied | Yes — lives entirely in `src/config/brand.ts` + `store_settings`, no component hardcodes brand values |
| 2 | Scaffold | UUID v4 as the identifier strategy for all tables | Simplicity, Supabase default, avoids sequential-ID enumeration concerns | No (would require migration if changed later, but no reason to) |
| 3 | Scaffold | Monetary values stored as integer paise (`*_paise` columns) | Avoids floating-point rounding errors in money math | No (correct by design) |
| 4 | Scaffold | Guest checkout only in Phase 1; `customer_id` nullable everywhere | Matches Phase 1 commercial boundary; avoids blocking Phase 3 accounts | Yes — additive in Phase 3 |
| 5 | Scaffold | Flat-rate + threshold shipping in Phase 1, Shiprocket deferred to Phase 2 | Matches stated scope; `ShippingProvider` interface keeps it swappable | Yes |
| 6 | Scaffold | Email (Resend/SMTP) as the only Phase 1 notification channel; WhatsApp deferred | Matches stated scope; `NotificationChannel` interface keeps it extensible | Yes |
| 7 | Scaffold | Max 20 seed products at launch | Explicit commercial boundary in the brief | N/A (content decision, not technical) |
| 8 | Scaffold | Single admin role in Phase 1 (`admin_profiles.role = 'admin'`), `staff_roles` reserved for Phase 4 | Matches stated scope | Yes |
| 9 | Scaffold | Country field on addresses defaults to `'IN'`, no multi-currency in Phase 1 | Matches "one currency: INR" boundary | Yes if internationalization is ever needed |
| 10 | 2026-07-11 (M0) | Framework stack pinned to current stable majors: Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS 4 (CSS-first `@theme`), Zod 4, Vitest 4 | Latest stable at project init; matches the documented stack in `ARCHITECTURE.md`/`README.md` | Yes — caret ranges, upgradable |
| 11 | 2026-07-11 (M0) | TypeScript pinned to `^5.9` rather than the newer `7.0` native compiler | TS 7 (Go-based) is very new; `typescript-eslint` and Next's TS plugin do not yet guarantee support, and a broken `lint`/`type-check` would fail the milestone exit criteria | Yes — bump to 7.x once the lint/type toolchain officially supports it |
| 12 | 2026-07-11 (M0) | `overrides.postcss = ^8.5.10` in `package.json` | Closes advisory GHSA-qx2v-qp2m-jg93 (moderate) in Next's transitive `postcss`; same-major, backward-compatible. Avoids `npm audit fix --force`, which would destructively downgrade Next to 9.x | Yes — remove once Next bumps its bundled postcss |
| 13 | 2026-07-11 (M0) | Temporary root `src/app/page.tsx` placeholder (renders brand name/tagline) | Lets the app build and serve from M0; the real homepage is built in Milestone 4 inside the `(storefront)` route group and this file is relocated/removed then | Yes — superseded in M4 |
| 14 | 2026-07-11 (M0) | ESLint via `eslint-config-next` v16's native flat-config export (not `FlatCompat`) | Next 16 ships a flat-config array directly; the `FlatCompat` shim triggers a circular-ref crash under ESLint 9.39 | Yes |

## How to use this file during implementation

- Any time a brand asset, business rule, or numeric threshold (shipping
  rate, free-shipping threshold, low-stock cutoff, etc.) is not explicitly
  specified, choose a sensible placeholder, implement it as **configurable**
  (not hardcoded), and add a row here.
- Do not block implementation waiting for real brand input unless the
  missing input is a genuine external secret (Supabase/Razorpay/email
  credentials, production domain, deployment access).
