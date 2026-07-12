# Security Model

## 1. Authentication & authorization

- Administrator auth uses **Supabase Auth** (email + password).
- **No public admin signup.** The only admin account in Phase 1 is created
  via a controlled setup script (`supabase/seed/create-admin.ts`, run once
  manually with service-role credentials, never exposed as a public route).
- Client-editable Supabase `user_metadata`/`app_metadata` is **never**
  trusted as a role source. The trusted role lives in `admin_profiles`
  (server-side table, RLS-protected, joined against `auth.uid()` on every
  privileged request).
- Every `/admin/*` page verifies the session **server-side** (in a layout
  or middleware) — client-side route guards are UX only, never the actual
  gate. Hiding a button is not authorization.
- Every admin mutation (server action / API route) independently re-checks
  `auth.uid()` → `admin_profiles.role = 'admin' AND is_active = true`
  before executing — it does not trust that "the page was protected."
- Password requirements: minimum 12 characters, enforced client + server.
- Password reset via Supabase Auth's standard flow (email link).
- Login error messages are generic ("Invalid email or password") — never
  reveal whether an email exists in the system.
- Redirect-after-login only allows same-origin, allow-listed paths
  (no open-redirect via `?next=`).
- Rate limiting on `/admin/login` and any password-reset trigger
  (`lib/security/rate-limit.ts` — IP + email keyed, sliding window).
- Every privileged mutation writes an `admin_audit_logs` row
  (who, what, when, entity).
- Designed for extension: `admin_profiles.role` is a text/enum column so
  Phase 4 can add `staff_roles`/`staff_permissions` without restructuring
  the auth check call sites — they already call a single
  `requireAdmin()` helper in `lib/security/auth.ts`.

## 2. Payment security (Razorpay)

Flow (see `ARCHITECTURE.md` §4 for full diagram):

1. Server validates cart + stock + address, computes authoritative total in
   **integer paise**.
2. Server creates a `PENDING_PAYMENT` order row.
3. Server calls Razorpay to create an order using the **server-calculated**
   amount — the amount never originates from the client request body.
4. Client completes the Razorpay Checkout widget.
5. Server verifies the returned signature using `RAZORPAY_KEY_SECRET`
   (HMAC-SHA256 over `order_id|payment_id`) before showing any success UI.
6. Razorpay sends an async **webhook**; the server independently verifies
   its signature using the **raw request body** and `RAZORPAY_WEBHOOK_SECRET`
   (framework body-parsing must be bypassed/preserved for this route).
7. Webhook processing is **idempotent**: the `webhook_events.event_id`
   unique constraint means a duplicate delivery is a no-op on second
   receipt, detected before any state mutation.
8. Inventory is committed (stock permanently decremented, reservation
   cleared) only on a confirmed `payment.captured` event; on
   `payment.failed` or an expired reservation, stock is released back.
9. `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` are **server-only**
   env vars, never referenced in any Client Component or public bundle.
10. Logs record payment **state transitions** (order id, old status, new
    status, event id) — never the secret, never the full signature, never
    full card/UPI details (Razorpay Checkout handles those; they never
    touch our server).

COD orders never touch the Razorpay code path at all — kept as a fully
separate branch in `services/orders` to avoid any cross-contamination of
state machines.

## 3. Row Level Security

Enabled on **every** table from the first migration that creates it — a
table is never created "temporarily without RLS." See
`DATABASE_SCHEMA.md` §3 for the per-table policy intent. General shape:

- Public/anon role: read-only, and only for `is_active = true` catalogue
  data and a public-safe subset of `store_settings`.
- Orders/payments/addresses: **no direct anon or authenticated SELECT** in
  Phase 1 — all access goes through server code using the service-role
  client, which itself re-checks authorization logic in TypeScript. Order
  tracking for guests uses a narrow, purpose-built lookup (order number +
  phone/email match) rather than exposing the orders table.
- Admin writes to catalogue/orders/inventory require the JWT's `auth.uid()`
  to resolve to an active `admin_profiles` row — enforced both in RLS
  policies (defense in depth) and in the TypeScript service layer
  (primary gate).
- Storage bucket for product images (`product-images`): public `SELECT`;
  `INSERT/UPDATE/DELETE` gated by the same admin check via Storage RLS policies
  on `storage.objects` calling `public.is_active_admin()` (which resolves
  `auth.uid()` → an active `admin_profiles` row) and scoped to
  `bucket_id = 'product-images'`. Defined and version-controlled in
  `supabase/migrations/0009_product_image_storage.sql`, not hand-created in the
  dashboard. The bucket also enforces a 5 MB `file_size_limit` and a MIME
  allow-list (`image/jpeg, image/png, image/webp, image/avif`) as a backstop;
  the primary upload gate remains the application-layer MIME + magic-byte +
  size validation in §4. RLS on `storage.objects` is never disabled.

## 4. Application security baseline

- TypeScript strict mode repo-wide; no `any` without a documented comment
  explaining why; no `@ts-ignore`.
- Zod validation at every trust boundary: form submission, API route
  input, webhook payload shape (post signature-verification), file upload
  metadata.
- Uploaded images: MIME type **and** file signature (magic bytes) checked
  server-side — the browser-reported MIME type and filename are never
  trusted alone. Filenames are regenerated (uuid + extension) before
  storage; original filename is not used as a storage path.
- Output escaping: React's default JSX escaping relied on; no
  `dangerouslySetInnerHTML` for any user- or admin-sourced content.
- No `eval`, no dynamic `Function()` construction.
- Errors shown to customers are generic, human-readable messages with an
  optional short **reference/correlation id**; stack traces and internal
  identifiers are logged server-side only, never rendered to the client.
- Central security headers (`lib/security/headers.ts`) applied via
  `next.config.ts` / middleware:
  - Content-Security-Policy — allow-lists Razorpay's checkout script/frame
    domains and the project's own Supabase Storage/API host; documented
    exceptions listed inline in the config with a one-line reason each.
  - Strict-Transport-Security (production only).
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY (except where Razorpay's checkout requires a
    controlled frame — scoped as narrowly as possible, documented).
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy: camera=(), microphone=(), geolocation=() (none
    needed in Phase 1).
- Secure, `httpOnly`, `SameSite=Lax` (or `Strict` where compatible with
  Razorpay redirect flow) cookies for the admin session.
- CSRF-aware architecture: state-changing routes check same-origin via
  the `Origin`/`Referer` header in addition to relying on Supabase's
  cookie-based session model; Server Actions get Next.js's built-in
  origin check for free and this is not disabled.
- Dependency auditing (`npm audit`) run before each deployment checkpoint;
  findings triaged, not ignored.

## 5. What is deliberately deferred (documented, not silently skipped)

- Formal WAF / bot mitigation beyond basic rate limiting — Phase 2+.
- Fine-grained staff permissions — Phase 4 (`staff_roles`/`staff_permissions`
  entities already reserved).
- Automated refund security review — arrives with the Phase 4 refund
  workflow.
- Third-party monitoring/alerting (e.g. Sentry) — architecture leaves a
  slot (`lib/observability` naming reserved) but is not wired up in Phase 1.

## 6. Implementation status — Milestone 3 (functional auth + headers)

Administrator authentication was **brought forward from Milestone 10 to
Milestone 3** so the auth boundary exists before any privileged admin
functionality (see `PHASE_ROADMAP.md` sequencing note, `DECISIONS.md` #34).

### 6.1 Authentication & authorization (implemented)

- `/admin/login` is wired to **Supabase Auth** (`signInWithPassword`) via the
  server action `features/auth/actions/sign-in.ts`. Input is validated
  server-side with the shared Zod schema (`lib/validation/auth.ts`, 12-char
  minimum).
- **All failures return one generic message** (`Invalid email or password.`) —
  bad input, wrong password, non-admin, and inactive-admin are
  indistinguishable (no account enumeration).
- After a successful password check, the action requires an **active
  `admin_profiles` row** (`role = 'admin' AND is_active = true`), read
  server-side. A valid Supabase user who is not an active admin is **signed out
  and rejected generically**. Client-controlled auth metadata is never trusted.
- **`requireAdmin()`** (`lib/security/auth.ts`, `server-only`) is THE gate:
  validates the session with `auth.getUser()` then the `admin_profiles` row, and
  `redirect('/admin/login')` for anyone who is not an active admin. It is called
  in the admin layout (guarding all nested `/admin/*` routes except login) and
  must be called by **every privileged page and server action** — middleware is
  only a coarse first pass, never the sole gate.
- **Middleware** (`src/middleware.ts`) refreshes the Supabase session (current
  `@supabase/ssr` pattern in `lib/supabase/middleware.ts`) and coarsely
  redirects unauthenticated users away from `/admin/*` (except login). Active
  admins hitting `/admin/login` are redirected to `/admin`.
- **Logout** (`features/auth/actions/sign-out.ts`) clears the session and
  returns to `/admin/login`.
- **Open-redirect safe:** post-login `next` targets pass `safeNextPath`
  (`lib/security/auth-core.ts`) — same-origin `/admin`-only allow-list,
  rejecting absolute/protocol-relative URLs, backslash and CRLF tricks, and the
  login path itself.
- **No public admin signup.** The service-role key is never referenced in any
  of this (the anon key + user session are used); RLS policies are unchanged.
- Passwords, tokens, cookies, and full auth responses are **never logged**.

### 6.2 Rate limiting

`lib/security/rate-limit.ts` defines a `RateLimiter` interface + an in-memory
sliding-window implementation, applied to the login action (5 / 15 min per IP).
⚠️ The in-memory limiter is **dev / single-instance only** — it is NOT
sufficient for a horizontally scaled production deployment (per-instance
counters). Production must back the same interface with a shared store (Upstash
Redis via the reserved `RATE_LIMIT_KV_URL` / `RATE_LIMIT_KV_TOKEN`).

### 6.3 Content-Security-Policy (risk-based split)

Central config in `lib/security/headers.ts`, applied per request by middleware
with a fresh nonce. No `unsafe-eval` in production anywhere. Documented external
origins: Supabase project (`connect-src`/`img-src` + `wss` realtime) and
Razorpay (`script-src` checkout.js, `frame-src`, `connect-src`).

- **Dynamic, sensitive routes (`/admin/*`): strict** — nonce-based
  `script-src`, **no `unsafe-inline`**.
- **Public, statically-prerendered storefront pages: `script-src` uses
  `'unsafe-inline'`** (no nonce). This is a **deliberate, documented exception**:
  a per-request nonce cannot be embedded in static HTML, and Next.js emits
  nonce-less inline bootstrap scripts for static pages that a strict nonce CSP
  would block (breaking hydration). Risk is low (no user-authored inline HTML;
  React auto-escapes; no `dangerouslySetInnerHTML`). Path to remove: render the
  storefront dynamically with a nonce, or adopt hash-based allow-listing, in a
  later hardening pass. `style-src 'unsafe-inline'` is likewise required by
  motion/react's dynamic inline styles (styles are far lower risk than scripts).

Other headers: HSTS (production only), `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin`,
`Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()`,
`X-Frame-Options: DENY` + CSP `frame-ancestors 'none'`.
