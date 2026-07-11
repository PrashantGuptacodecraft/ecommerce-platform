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
| 15 | 2026-07-11 (M1) | `src/types/database.ts` hand-authored to match the migrations, not generated | The Supabase project is an external setup step and does not exist yet, so `supabase gen types` cannot run. Regenerate via `npm run db:types` once the project is linked | Yes — regenerated from live DB later |
| 16 | 2026-07-11 (M1) | Carts/cart_items server-managed (service-role) rather than anon-RLS-scoped by `session_token` | The anon key carries no per-guest claim, so a guest's session token cannot be bound into an RLS predicate safely; server code enforces cart ownership instead. Matches "no cross-session read" intent in `DATABASE_SCHEMA.md` §3 | Yes |
| 17 | 2026-07-11 (M1) | `public_store_settings` view exposes only keys `('shipping','cod','contact')` to anon/authenticated; full table admin-only | Implements the "public-safe subset via a view" rule (`DATABASE_SCHEMA.md` §3); internal keys like `shipping_provider` stay private | Yes — adjust the key allow-list as settings evolve |
| 18 | 2026-07-11 (M1) | Order numbers via a Postgres `sequence` + `SN-0000` default (`SN-` + 4-digit pad) | Race-free human-readable numbering without app-layer coordination; padding widens naturally past 9999 | Yes |
| 19 | 2026-07-11 (M1) | Placeholder store defaults: ₹79 flat shipping (`7900` paise), free over ₹1,999 (`199900` paise), COD enabled, provider `manual`, low-stock threshold 5 | No real business figures supplied; all admin-editable via `store_settings` (rate/threshold/COD/provider) or `src/config/site.ts` (low-stock) | Yes — admin-editable |
| 20 | 2026-07-11 (M1) | Standalone scripts (`seed.ts`, `create-admin.ts`) build their own service-role client instead of importing `src/lib/supabase/admin.ts` | `admin.ts` carries a `server-only` import guard that intentionally throws outside the Next.js bundler; CLI scripts run under `tsx` and need a direct client. Both still require `SUPABASE_SERVICE_ROLE_KEY` | No — correct by design |
| 21 | 2026-07-11 (M1) | 8 seed products (each Size × Colour → variants), well under the 20-product cap; seed asserts the cap at runtime | Enough realistic catalogue depth to build/test the storefront without approaching the commercial boundary | Yes — content decision |
| 22 | 2026-07-11 (M1) | `product-images` Storage bucket + its `storage.objects` RLS policies are managed by migration `0009_product_image_storage.sql`, not a manual dashboard step | Keeps Storage reproducible/version-controlled like the rest of the schema; supersedes the "dashboard/CLI step" note from the M1 log. Policies reuse the existing zero-arg `public.is_active_admin()` and are bucket-scoped | Yes |
| 23 | 2026-07-11 (M1) | Bucket `allowed_mime_types` includes `image/avif` in addition to `jpeg/png/webp` | AVIF is a modern, well-supported raster format worth accepting at the storage backstop. NOTE: `src/config/site.ts` `upload.acceptedImageTypes` still lists only `jpeg/png/webp` — the app-layer uploader (Milestone 11) is the primary gate and can stay stricter, or add AVIF then; the bucket list is intentionally the looser backstop | Yes — reconcile the two lists in M11 if AVIF uploads are desired app-side |
| 24 | 2026-07-11 (M1) | Idempotent Storage migration via bucket upsert + `drop policy if exists` / `create policy` per named policy | Postgres has no `CREATE POLICY IF NOT EXISTS`; dropping only the four policies this migration owns before recreating them makes re-runs safe without weakening any other RLS | No — standard idempotency pattern |
| 25 | 2026-07-11 (M2) | System font stacks (`--font-sans`, `--font-serif`) instead of `next/font` web fonts | Keeps builds hermetic (no build-time font fetch) and fast; premium feel comes from type scale/spacing/colour. Swappable to `next/font` later without touching components | Yes |
| 26 | 2026-07-11 (M2) | Design tokens duplicated between `design-tokens.ts` (TS) and `globals.css` `@theme` (Tailwind v4 CSS-first) | Tailwind v4 requires theme values in CSS to generate utilities; TS object serves non-Tailwind consumers. Documented "keep in sync" rule in `DESIGN_SYSTEM.md` | Yes |
| 27 | 2026-07-11 (M2) | z-index as CSS variables (`--z-*`) used via `z-[var(--z-modal)]`, not a Tailwind scale | Tailwind v4 has no z-index theme namespace; CSS vars keep the strict layer ordering centralized | Yes |
| 28 | 2026-07-11 (M2) | Added `clsx` + `tailwind-merge` (via `cn()`) | Standard, tiny class-merge utility that resolves conflicting Tailwind classes; used by every primitive | Yes |
| 29 | 2026-07-11 (M2) | Inline SVG icon set (`components/ui/icons.tsx`) instead of an icon library | Avoids a dependency for the handful of icons Phase 1 needs; tree-shake-free | Yes — adopt a library later if icon needs grow |
| 30 | 2026-07-11 (M2) | Admin login is a **secure UI shell**; auth not wired yet | The checklist schedules admin authentication (session verify, `requireAdmin`, rate-limit, audit, redirect allow-list) for Milestone 10. `signInAdmin` validates input server-side and documents the exact M10 integration point; `/admin` shell exposes no live data/mutations | Yes — completed in M10 |
| 31 | 2026-07-11 (M2) | Temporary root `src/app/page.tsx` removed; homepage now `app/(storefront)/page.tsx` | The storefront route group now owns `/` with full chrome (header/footer). Supersedes Decision #13 | No — intended structure |
| 32 | 2026-07-11 (M2) | Newsletter signup is UI-only (toast ack, no backend) | No email-list provider in Phase 1 scope; foundation in place to wire later | Yes |
| 33 | 2026-07-11 (M2) | `useMounted` via `useSyncExternalStore` (not setState-in-effect) | Portal SSR gate without a hydration mismatch; satisfies the `react-hooks/set-state-in-effect` lint rule | No — correct pattern |

## How to use this file during implementation

- Any time a brand asset, business rule, or numeric threshold (shipping
  rate, free-shipping threshold, low-stock cutoff, etc.) is not explicitly
  specified, choose a sensible placeholder, implement it as **configurable**
  (not hardcoded), and add a row here.
- Do not block implementation waiting for real brand input unless the
  missing input is a genuine external secret (Supabase/Razorpay/email
  credentials, production domain, deployment access).
