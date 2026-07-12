# Progress Log

Update this file after every milestone from
`docs/phases/PHASE_1_IMPLEMENTATION_CHECKLIST.md`. Do not mark a milestone
complete unless it has actually been implemented and verified — no
speculative completion.

Template for each entry:

```
## Milestone <N> — <name> — <date>

### Completed
-

### Verification performed
- Commands run:
- Manual checks:
- Tests added/passing:

### Known limitations
-

### Remaining Phase 1 tasks
-
```

---

## Milestone 0 — Project init — 2026-07-11

Built inside the existing scaffold — no folders under `src/`, `supabase/`,
`tests/`, or `docs/` were moved or removed; all pre-existing `_PURPOSE.md`
notes and `.gitkeep` files are untouched.

### Completed
- **Next.js app initialised manually** inside the existing tree (App Router,
  TypeScript strict, Tailwind, ESLint). Manual scaffold rather than
  `create-next-app`, which refuses to run in a populated directory and would
  have risked overwriting the docs/scaffold. Files added at repo root:
  `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`,
  `eslint.config.mjs`, `.prettierrc.json`, `.prettierignore`, `next-env.d.ts`.
- **App shell:** `src/app/layout.tsx` (root layout, metadata + viewport from
  brand config), `src/app/page.tsx` (temporary placeholder — see Decision
  #13; real homepage is M4 in the `(storefront)` group), `src/app/globals.css`
  (Tailwind 4 `@import`, reduced-motion safety net).
- **`tsconfig.json` path alias** `@/* → ./src/*`, plus stricter-than-default
  flags (`noUncheckedIndexedAccess`, `noImplicitOverride`,
  `verbatimModuleSyntax`) in the spirit of the security model's "strict, no
  `any`, no shortcuts" rule. (Next.js auto-set `jsx: react-jsx` and added its
  `.next/*/types` include globs during build — kept as-is.)
- **Runtime dependencies installed:** `zod`, `react-hook-form`,
  `@hookform/resolvers`, `@supabase/ssr`, `@supabase/supabase-js`, `motion`,
  `razorpay` (plus `next`, `react`, `react-dom`).
- **Dev dependencies installed:** `vitest` (+ `@vitejs/plugin-react`, `jsdom`,
  `@testing-library/react`, `@testing-library/jest-dom`),
  `@playwright/test`, `prettier`, `eslint` + `eslint-config-next`,
  `typescript`, `@types/*`, `tailwindcss` + `@tailwindcss/postcss`.
- **`package-lock.json` generated** and present at repo root (see Known
  limitations re: committing it).
- **Config tokens wired up** (`src/config/`): `design-tokens.ts` (colours,
  type scale, spacing, radii, shadows, container widths, z-index layers,
  breakpoints), `motion-tokens.ts` (`fast`/`standard`/`slowEditorial`
  durations; `standard`/`premium` cubic-bézier easings; stagger delay),
  plus `brand.ts` (STUDIO NOIR placeholder — Decision #1) and `site.ts`
  (upload limits, seed-product cap, low-stock threshold, pagination). All
  typed with `as const`, no `any`.
- **Test tooling scaffolded:** `vitest.config.ts` (jsdom, `@/*` alias,
  unit+integration globs), `tests/setup.ts` (jest-dom matchers),
  `playwright.config.ts` (mobile-first + desktop projects, e2e specs deferred
  to M14). One real sanity test (`tests/unit/config.test.ts`, 5 assertions)
  proving the toolchain + path alias resolve and guarding config invariants.
- **Security housekeeping:** the single `npm audit` finding
  (transitive `postcss` < 8.5.10, GHSA-qx2v-qp2m-jg93, moderate) was triaged
  and fixed with a same-major `overrides` pin instead of the destructive
  `audit fix --force` Next downgrade — see Decision #12. `npm audit` now
  reports **0 vulnerabilities**.
- **`.env.example` verified** against what code references so far — no
  changes needed. M0 code references no secrets; `playwright.config.ts` reads
  only `SITE_URL`/`CI`, both already present. Brand/site config are compile-
  time constants, not env-derived, so no client-exposed secrets exist yet.

### Verification performed
- Commands run (all exit 0):
  - `npm install` → 481 packages, **0 vulnerabilities** (after postcss override)
  - `npm run lint` → clean (ESLint 9 flat config via `eslint-config-next` v16)
  - `npm run type-check` → `tsc --noEmit`, no errors
  - `npm run test` → Vitest: 1 file, **5 tests passed**
  - `npm run build` → `next build` succeeded; `/` and `/_not-found`
    prerendered as static; TypeScript validation passed
  - `npm run format:check` → all owned files conform to Prettier
- Manual runtime smoke test: served the production build (`next start`),
  `GET /` → **200** with rendered brand content ("STUDIO NOIR", tagline,
  "Milestone 0"); unknown route → **404**. Server stopped afterward.

### Known limitations
- **`package-lock.json` not committed to Git.** This workspace is not a Git
  repository (no `.git`), so the checklist's "commit `package-lock.json`"
  step cannot be performed literally. The lockfile is generated and ready;
  it should be committed as part of the first commit once the repo is
  initialised. Flagged rather than silently skipped.
- No Next.js app **logic** beyond a placeholder home page — routes, data,
  auth, payments all belong to later milestones.
- Supabase project not yet created; Razorpay account not yet configured
  (both external steps, Milestone 1+).
- Playwright browsers not installed and no e2e specs yet (`npx playwright
  install` + specs are Milestone 14 / CI).
- Central security headers, rate limiter, and `(storefront)` route-group
  layout intentionally **not** present yet (Milestone 3).

### Remaining Phase 1 tasks
- Milestone 1 (Supabase foundation) next: migrations for every table in
  `DATABASE_SCHEMA.md` with RLS enabled per-table, the
  `reserve_variant_stock` `SECURITY DEFINER` function, Supabase client
  wrappers (`client`/`server`/`admin`), generated DB types, seed script,
  and the manual admin-creation script.
- Milestones 2–16 per `docs/phases/PHASE_1_IMPLEMENTATION_CHECKLIST.md`.
- **Awaiting user go-ahead before starting Milestone 1.**

---

## Milestone 1 — Supabase foundation — 2026-07-11

Built inside the existing scaffold (`supabase/migrations`, `supabase/seed`,
`src/lib/supabase`, `src/types`). No folders moved; `_PURPOSE.md` notes intact.

### Completed
- **8 numbered SQL migrations** in `supabase/migrations/`, implementing every
  table in `DATABASE_SCHEMA.md` in dependency order:
  - `0001_foundation.sql` — enum types (`order_status`, `payment_method`,
    `payment_status`, `inventory_reason`, `shipment_provider`) + the shared
    `set_updated_at()` trigger function. UUID v4 via `gen_random_uuid()`
    (core Postgres 13+, no pgcrypto needed).
  - `0002_admin_identity.sql` — `admin_profiles` (1:1 with `auth.users`, role
    NOT from client metadata) + `is_active_admin()` — a `STABLE SECURITY
    DEFINER`, `search_path`-pinned predicate reused by every admin RLS policy.
  - `0003_catalogue.sql` — `categories`, `products`, `product_images`,
    `product_options`, `product_option_values`, `product_variants`,
    `variant_option_values`, with all indexes and constraints from the spec
    (unique slugs/SKUs, one-primary-image partial index, `compare_at >
    base` check, `stock_quantity >= 0` check).
  - `0004_inventory.sql` — append-only `inventory_transactions` ledger +
    **`reserve_variant_stock()`** and **`release_variant_stock()`**
    (`SECURITY DEFINER`, `SELECT … FOR UPDATE` row lock, atomic
    decrement/increment + ledger write; raise `INSUFFICIENT_STOCK` /
    `VARIANT_INACTIVE` / `VARIANT_NOT_FOUND`). Execute granted to
    `service_role` only.
  - `0005_customers_carts.sql` — `customers`, `addresses`, `carts`,
    `cart_items`.
  - `0006_store_settings.sql` — `store_settings` (admin-only) + the
    `public_store_settings` view exposing only the safe key subset.
  - `0007_webhooks_audit.sql` — `webhook_events` (unique `event_id`
    idempotency guard) + `admin_audit_logs`.
  - `0008_orders_payments_shipments.sql` — `orders` (race-free `SN-0001`
    numbers via a sequence default), immutable `order_items` snapshots,
    `payments` (partial-unique `razorpay_payment_id`), `shipments`. FKs use
    `ON DELETE RESTRICT` for anything referenced by historical
    orders/payments; `CASCADE`/`SET NULL` only for genuinely dependent rows.
- **RLS enabled on every table in the same migration that creates it** —
  static audit confirms **20 tables ↔ 20 `enable row level security`**
  (1:1), 27 policies. Public/anon: read-only, `is_active = true` catalogue +
  the public settings view. Orders/payments/addresses/carts: no direct
  anon/authenticated SELECT (server/service-role only); active-admin SELECT
  for support. Admin CRUD gated on `is_active_admin()` (defense in depth
  alongside the TypeScript service layer).
- **Supabase client wrappers** (`src/lib/supabase/`): `config.ts` (validated
  public connection values), `client.ts` (browser/anon), `server.ts`
  (cookie-bound server client), `admin.ts` (service-role, **`import
  'server-only'` build guard** so it can never enter a client bundle;
  `persistSession:false`). All typed with the `Database` generic.
- **`src/types/database.ts`** — full typed schema (tables Row/Insert/Update,
  the view, the three functions' Args/Returns, all enums) hand-authored to
  match the migrations, plus `Tables`/`TablesInsert`/`TablesUpdate`/`Enums`
  helper generics. Regenerate via `npm run db:types` once the project is
  linked (see Decision #15).
- **Seed script** (`supabase/seed/seed.ts`, `npm run seed`): idempotent
  upserts of default `store_settings` (₹79 flat / free over ₹1,999 / COD on /
  provider `manual`), 4 categories, and **8 products** (each Size × Colour →
  variants; well under the 20 cap, which the script also asserts at runtime).
- **Admin creation script** (`supabase/seed/create-admin.ts`,
  `npm run create-admin -- --email …`): service-role creation of the auth
  user + `admin_profiles` row, **password prompted interactively and masked**
  (never a CLI arg), 12-char minimum enforced.
- **Tooling**: added `seed` / `create-admin` / `db:types` npm scripts and
  deps `server-only`, `dotenv`, `tsx` (dev). `npm audit` → 0 vulnerabilities.

### Verification performed
- Commands run (all exit 0): `npm install` (0 vulns), `npm run lint`,
  `npm run type-check` (`tsc --noEmit`), `npm run test` (5 passed),
  `npm run build` (`/` + `/_not-found` prerendered), `npm run format:check`.
- **Static SQL audit** (no local Postgres/Docker available to apply live):
  20 `create table` ↔ 20 `enable row level security` (1:1), 27 policies,
  balanced `$$` dollar-quoting across the 4 functions.
- `.env.example` verified — the only vars M1 code references
  (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`) are all already declared. No changes needed.

### Known limitations
- **Migrations not applied to a live database.** Creating the Supabase
  project, `supabase db push`, creating the `product-images` Storage bucket
  (+ its admin-only write policy), running the seed/admin scripts, and
  regenerating `database.ts` from the live schema are all **external steps**
  requiring real credentials — see `docs/SUPABASE_SETUP.md`. No Postgres
  engine is available in this environment to apply/validate SQL at runtime,
  so validation was static only.
- `database.ts` is hand-authored (Decision #15); it must be regenerated with
  `npm run db:types` after the project is linked and re-checked against these
  migrations.
- Storage bucket RLS policy — **now resolved:** the `product-images` bucket and
  its `storage.objects` policies are managed by migration `0009` (see the M1
  addendum below), no longer a manual dashboard step.
- No application logic consumes the DB yet (product fetchers, cart validation,
  order creation) — those are Milestones 4+.

### Remaining Phase 1 tasks
- **External Supabase setup** (owner action, per `SUPABASE_SETUP.md`): create
  project → set env vars in `.env.local` → `supabase db push` (now also creates
  the Storage bucket + policies via migration 0009) → `npm run db:types` →
  `npm run seed` → `npm run create-admin`.
- Milestone 2 (motion & design-system foundation) next in code: wire design
  tokens into the Tailwind theme, motion tokens, motion primitives, and the
  core `ui/` primitives.
- Milestones 3–16 per `docs/phases/PHASE_1_IMPLEMENTATION_CHECKLIST.md`.
- **Awaiting user go-ahead before starting Milestone 2.**

---

## Milestone 1 (addendum) — Product image Storage migration (0009) — 2026-07-11

Migrations 0001–0008 confirmed applied to the live database by the owner. The
`product-images` Storage bucket was found to be unmanaged by the repo, so it is
now brought under version control **without modifying 0001–0008**.

### Completed
- **`supabase/migrations/0009_product_image_storage.sql`** (new; 0001–0008
  untouched):
  - Upserts the `product-images` bucket: `public = true`, `file_size_limit`
    5 MB (`5242880`), `allowed_mime_types`
    `{image/jpeg, image/png, image/webp, image/avif}`. Bucket upsert
    (`on conflict (id) do update`) is idempotent and also corrects limits if
    the bucket was pre-created in the dashboard.
  - Four RLS policies on `storage.objects`, each idempotent via
    `drop policy if exists "<name>" … / create policy "<name>" …` (Postgres has
    no `CREATE POLICY IF NOT EXISTS`), touching only the four policies this
    migration owns:
    - `product_images_public_read` — `SELECT` to `public`,
      `using (bucket_id = 'product-images')`.
    - `product_images_admin_insert` — `INSERT` to `authenticated`,
      `with check (bucket_id = 'product-images' and public.is_active_admin())`.
    - `product_images_admin_update` — `UPDATE` to `authenticated`, bucket +
      admin check in **both** `using` and `with check`.
    - `product_images_admin_delete` — `DELETE` to `authenticated`,
      `using (bucket_id = 'product-images' and public.is_active_admin())`.
  - Reuses the **existing** helper from 0002 — signature reconfirmed before
    writing: `public.is_active_admin()` is **zero-argument**, `returns boolean`,
    `stable security definer`, called here with no arguments.
- **Safety properties:** RLS on `storage.objects` is never disabled; no existing
  policy is dropped or weakened (only the four named policies are managed); no
  unauthenticated INSERT/UPDATE/DELETE path; the service-role key is never
  referenced (service_role bypasses RLS at the connection level).
- **Docs updated:** `SUPABASE_SETUP.md` §3 (bucket now migration-managed, no
  dashboard step), `SECURITY_MODEL.md` §3 (storage bullet reflects
  `is_active_admin()` + bucket scope + MIME/size backstop), `DECISIONS.md`
  (#22 migration-managed bucket, #23 AVIF-vs-`site.ts` MIME note, #24
  idempotency pattern), and this addendum.

### Verification performed
- Commands run (all exit 0): `npm run lint`, `npm run type-check`,
  `npm run test` (5 passed), `npm run build`, `npm run format:check`.
- Static review of the SQL: policy names unique within the migration; bucket
  upsert idempotent; `is_active_admin()` called with the confirmed zero-arg
  signature; INSERT/UPDATE both validate `bucket_id = 'product-images'`. No
  local Postgres engine available, so no live apply in this environment — the
  owner applies it against the linked project.

### Known limitations
- `image/avif` is accepted at the bucket level but `src/config/site.ts`
  `upload.acceptedImageTypes` still lists only `jpeg/png/webp`; reconcile in
  Milestone 11 if AVIF uploads are wanted app-side (Decision #23). App-layer
  validation remains the primary upload gate.

---

## Milestone 1 — External Supabase setup — VERIFIED LIVE — 2026-07-11

The owner completed and verified the external setup against the linked Supabase
project. Confirmed:

- **Migrations 0001–0009 applied successfully** to the live database.
- **`product-images` bucket exists**; its **four `storage.objects` policies are
  active** (public read + admin insert/update/delete).
- **Live database types generated** — `src/types/database.ts` is now the
  official `supabase gen types` output (replaces the hand-authored stand-in
  from Decision #15). `tsc --noEmit` passes against it; the file is now
  Prettier-ignored as generated/tool-owned (source of truth = migrations, DB;
  regenerate via `npm run db:types`).
- **Seed completed** — 8 products with variants + default `store_settings`.
- **Admin created** — Supabase Auth user + verified `admin_profiles` record.
- **App state:** homepage still shows the Milestone 0 placeholder;
  `/admin/login` returns 404 (route not implemented yet — expected pre-M2).

Milestone 1 is now complete **and confirmed live**. Nothing further required
here; foundations are ready for Milestone 2.

---

## Milestone 2 — Motion & design-system foundation — 2026-07-11

Built inside the existing scaffold; migrations, `_PURPOSE.md` files, security
model, and architecture untouched. Full design docs in `docs/DESIGN_SYSTEM.md`.

### Completed
- **Design tokens → Tailwind v4 theme.** `src/app/globals.css` `@theme` projects
  `src/config/design-tokens.ts`: colour palette, `font-sans`/`font-serif`,
  radii, shadows. Plus z-index CSS variables (`--z-*`), base styles, a global
  `:focus-visible` ring, and a reduced-motion backstop. Token categories
  covered: typography, spacing, colours, radii, shadows, container widths,
  z-index (per requirement).
- **Utilities:** `lib/utilities/cn.ts` (clsx + tailwind-merge) and
  `lib/utilities/money.ts` (`formatPaise` paise→₹ with lakh grouping,
  `discountPercent`), each unit-tested.
- **Motion primitives** (`src/components/motion/`, all `motion/react`, all
  reduced-motion aware via `useReducedMotion`): `FadeIn`, `SlideUp`,
  `RevealOnScroll`, `StaggerContainer`/`StaggerItem`, `ScaleOnHover`,
  `PageTransition`, `AnimatedCounter`, `AnimatedModal`, `AnimatedDrawer`,
  `AnimatedCartItem` + a shared `motion-config` and barrel `index.ts`.
- **UI primitives** (`src/components/ui/`): `Button` (5 variants/3 sizes,
  loading), `Badge`, `Price`, `Card`, `Container`, `Skeleton`, `Label`,
  `Input`, `Textarea`, `Select` (ref-forwarded, `invalid` states), `FormError`
  (`role="alert"`), `EmptyState`, `Dialog`, `Drawer` (portalled,
  backdrop/Escape dismiss, scroll-lock, focus-to-panel), `ToastProvider` +
  `useToast`, an inline `icons` set, and a barrel `index.ts`.
- **Storefront layout foundation:** `AnnouncementBar`, `Header` (+
  `MobileDrawerNav`), `Footer` (+ `NewsletterForm` foundation), composed in
  `app/(storefront)/layout.tsx` (also hosts `ToastProvider`); nav in
  `src/config/navigation.ts`.
- **Homepage replaced:** removed the temporary root `src/app/page.tsx`; new
  `app/(storefront)/page.tsx` is a refined foundation (hero, shop-by-category
  tiles, reassurance strip, editorial band) using tokens + motion. No mock
  product data — real catalogue is Milestone 4.
- **Admin shell + login:** `app/admin/layout.tsx` (route-group shell with the
  `requireAdmin()` M10 integration point documented in-file), `AdminShell` +
  `AdminSidebar` chrome, `app/admin` placeholder dashboard, and
  `app/admin/login` — a **complete secure login UI shell** (`AdminLoginForm`,
  react-hook-form + shared Zod schema, generic errors, disable-on-submit,
  12-char rule, `aria` wiring). Auth is intentionally **not** wired: the
  `signInAdmin` server action validates input server-side and documents the
  exact Milestone 10 integration steps (Supabase Auth + `requireAdmin` +
  rate-limit + audit + redirect allow-list). `/admin/login` now returns 200
  (previously 404).
- **Docs:** created `docs/DESIGN_SYSTEM.md`; recorded Decisions #25–33.

### Verification performed
- Commands (all exit 0): `npm run lint`, `npm run type-check`,
  `npm run test` (**3 files, 15 tests** — config + money + cn),
  `npm run build`, `npm run format:check`.
- Runtime smoke test (`next start`): `GET /` → **200** (hero "Quietly
  premium", "Shop by category" rendered), `GET /admin/login` → **200**
  (form: "Store administration", "Password", "Sign in"), `GET /admin` → **200**
  (shell). Server stopped afterward.
- One lint finding fixed mid-milestone: `react-hooks/set-state-in-effect` on the
  portal mount gate → rewrote `useMounted` with `useSyncExternalStore`
  (Decision #33).

### Known limitations / deferred (by design)
- **Admin auth not functional** — secure shell only; wired in Milestone 10
  (Decision #30). `/admin` shell is reachable without auth but exposes no live
  data or mutations.
- Global `not-found.tsx` / `error.tsx`, security headers, and the rate limiter
  are **Milestone 3** (not in M2 scope).
- Newsletter signup is UI-only (toast ack, no backend — Decision #32).
- Full focus-trapping, keyboard-nav audit, and contrast verification are the
  **Milestone 15** accessibility pass; M2 primitives are built to accept it.
- Category/other storefront links resolve to routes built in later milestones
  (they 404 until then — expected).

### Remaining Phase 1 tasks
- Milestone 3 (storefront shell hardening): `(storefront)` error boundary +
  `not-found.tsx` + `error.tsx`, central security headers in
  `next.config.ts`/middleware, and `lib/security/rate-limit.ts`.
- Milestones 4–16 per `docs/phases/PHASE_1_IMPLEMENTATION_CHECKLIST.md`.
- **Awaiting user go-ahead before starting Milestone 3.**

---

## Milestone 3 — Security foundation + functional admin auth — 2026-07-11

**Re-sequencing:** functional administrator authentication was moved from
Milestone 10 into Milestone 3 (owner directive) so the auth boundary exists
before any privileged admin functionality — see `PHASE_ROADMAP.md`,
`SECURITY_MODEL.md` §6, `DECISIONS.md` #34. RLS, migrations, `_PURPOSE.md`
files, and the design system were preserved.

### Completed
- **Error / route-state foundation:** `app/not-found.tsx` (on-brand 404),
  `app/error.tsx` (generic message + `digest` ref, no stack trace),
  `app/global-error.tsx`, `app/loading.tsx`, `app/admin/loading.tsx` — all
  design-consistent and reduced-motion aware.
- **Central security headers** (`lib/security/headers.ts`, applied per-request
  by `src/middleware.ts`): nonce CSP allow-listing Supabase (+wss) and Razorpay,
  HSTS (prod), `nosniff`, `Referrer-Policy`, `Permissions-Policy`,
  `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'`. **No `unsafe-eval` in
  prod.** Risk-based CSP split: strict nonce (no `unsafe-inline`) on dynamic
  `/admin/*`; `unsafe-inline` (no nonce) on static storefront pages (documented,
  Decision #35).
- **Functional admin authentication:** `/admin/login` → Supabase Auth via
  `features/auth/actions/sign-in.ts` (shared Zod schema, generic errors,
  active-`admin_profiles` check, sign-out-on-non-admin, IP rate limit,
  open-redirect-safe `next`). `requireAdmin()` (`lib/security/auth.ts`,
  `server-only`) gates the admin layout + dashboard page. Middleware coarse-
  redirects unauthenticated `/admin/*` → login and active admins away from
  login. Logout via `features/auth/actions/sign-out.ts` + `LogoutButton` in the
  shell. `admin_profiles` role is server-verified; client metadata never
  trusted; service-role key never referenced; RLS unchanged.
- **Session handling:** `lib/supabase/middleware.ts` refreshes the session per
  the current `@supabase/ssr` pattern; server/client modules kept separate
  (`server-only` on `auth.ts`); no passwords/tokens/cookies/keys logged.
- **Rate-limiting foundation:** `lib/security/rate-limit.ts` — `RateLimiter`
  interface + in-memory sliding-window impl (5/15min on login by IP), with a
  loud PRODUCTION requirement to swap in a shared store for horizontal scale
  (Decision #37).
- **Docs:** `SECURITY_MODEL.md` §6, `ARCHITECTURE.md` §9, `PHASE_ROADMAP.md`
  sequencing note, `DESIGN_SYSTEM.md` §5, Decisions #34–39 (#30 superseded).

### Verification performed
- Quality gates (all pass): `lint` 0, `type-check` 0, `test` **7 files / 53
  tests**, `build` 0, `format:check` 0, `npm audit` **0 vulnerabilities**.
- New tests: `headers.test.ts` (strict vs static CSP, HSTS, no unsafe-eval,
  origins), `auth-core.test.ts` (`resolveAdminAccess`; `safeNextPath`
  open-redirect/CRLF/backslash cases), `rate-limit.test.ts` (window + keys),
  `sign-in.test.ts` (invalid input, generic auth failure, non-admin +
  inactive-admin rejection with sign-out, active-admin redirect, safe/unsafe
  `next`, rate-limited).
- **Runtime (prod `next start`):** `/` → 200, `/admin/login` → 200, unknown →
  404; logged-out `/admin` → **307 → `/admin/login?next=%2Fadmin`**; all
  security headers present and correct (verified via curl); CSP split confirmed
  (storefront `unsafe-inline`, admin `nonce`).
- **Browser (Playwright chromium) at 360/375/390/430/768/1280:** **no
  horizontal overflow** on `/`, `/admin/login`, 404; **zero console/CSP errors**
  after the CSP fix; mobile nav drawer opens on tap and closes on Escape; header
  touch targets bumped to 44px.
- **Bug caught & fixed during verification:** the initial strict nonce CSP
  blocked inline hydration scripts on statically-prerendered storefront pages
  (drawer wouldn't open) → resolved with the risk-based hybrid CSP (Decision
  #35), re-verified green.

### Known limitations
- **Live authenticated e2e not run by me:** login→`/admin`, logout→`/admin/login`,
  and non-admin denial are covered by unit tests (mocked Supabase) and the gate
  logic, but a live browser run of the *authenticated* flow needs the admin
  password (not available to me). Recommend the owner run it, or provide a
  throwaway credential / approve creating a temporary admin.
- **In-memory rate limiter** is dev/single-instance only — production needs a
  shared store (Decision #37).
- **`unsafe-inline` in `script-src` on static storefront pages** (Decision #35)
  and `style-src` (Decision #36) — documented, low-risk, tightenable later.
- **`admin_audit_logs` writes** are wired per-mutation as privileged mutations
  are introduced (M11–13), not in M3 (login has no mutation surface yet beyond
  session).
- Playwright browser installed locally for verification; no committed e2e specs
  yet (that suite is Milestone 14).

### Remaining Phase 1 tasks
- Milestone 4 (product catalogue read path) next: server-side product/category
  fetchers, homepage/shop/category/product/search pages against real seeded
  data, SEO metadata/sitemap/robots/JSON-LD.
- Milestones 5–16 per `docs/phases/PHASE_1_IMPLEMENTATION_CHECKLIST.md`.
- **Stopping after Milestone 3; awaiting go-ahead for Milestone 4.**
