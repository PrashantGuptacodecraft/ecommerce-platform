# Supabase Setup

## 1. Create the project

1. Create a new Supabase project (choose a region close to India, e.g.
   Singapore, for lower latency).
2. Note the **Project URL** and **anon public key** — these go into
   `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Note the **service-role key** — this goes into `SUPABASE_SERVICE_ROLE_KEY`
   and must **only ever** be used in server-only modules
   (`src/lib/supabase/admin.ts`). Never commit it, never log it, never
   reference it from a Client Component.

## 2. Apply migrations

Migrations live in `supabase/migrations/*.sql`, numbered sequentially, and
are the source of truth for schema + RLS (see `DATABASE_SCHEMA.md`).

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Do not hand-create tables in the Supabase dashboard for anything that
should exist in production — if a table is created ad hoc, immediately
back it with a migration file so the schema stays reproducible.

## 3. Storage bucket

The `product-images` bucket and its policies are **managed by a migration** —
`supabase/migrations/0009_product_image_storage.sql`. Applying migrations
(step 2, `supabase db push`) creates the bucket and its RLS policies; there is
**no manual dashboard step**. Do not hand-create it in the dashboard — that
would drift from version control.

The migration configures:

- Bucket `product-images`: public, `file_size_limit` 5 MB, `allowed_mime_types`
  `image/jpeg, image/png, image/webp, image/avif`. Re-running the migration
  upserts these limits (idempotent).
- Public `SELECT` (read) — allowed for anyone from this bucket only (storefront
  needs to render images).
- `INSERT` / `UPDATE` / `DELETE` on `storage.objects` — restricted to
  authenticated users for whom `public.is_active_admin()` is true (i.e.
  `admin_profiles.role = 'admin' AND is_active = true`), and scoped to
  `bucket_id = 'product-images'`. Unauthenticated writes are never allowed.
- The migration does not disable RLS on `storage.objects` and does not touch
  any other bucket's policies.

Application-layer defence in depth (still required, enforced in the admin
uploader): validate file size and MIME **and file signature (magic bytes)**
server-side before upload, and regenerate the storage filename (uuid + ext) —
see `docs/SECURITY_MODEL.md` §4. The bucket-level `file_size_limit` /
`allowed_mime_types` are a backstop, not the primary gate.

## 4. Seed data

```bash
npm run seed
```

Runs `supabase/seed/seed.ts`: categories, ≤20 products with real variant
data, and default `store_settings` (flat shipping rate, free-shipping
threshold, COD enabled, active shipping provider = `manual`).

## 5. Create the first (and only, in Phase 1) admin account

Do **not** expose a public admin signup route. Run the controlled script:

```bash
npm run create-admin -- --email you@yourstore.in
```

This should use the service-role client to create the Supabase Auth user
and the corresponding `admin_profiles` row in one step, prompting for a
password interactively rather than accepting it as a plaintext CLI arg
logged in shell history.

## 6. Environment variables required

See `.env.example` at the repo root for the full list. At minimum for
Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## 7. Backup considerations

- Enable Supabase's automatic daily backups (or point-in-time recovery on
  a paid tier) before going live with real customer orders.
- Treat `order_items` snapshot columns as the durable record of what was
  sold — do not rely on being able to reconstruct historical orders from
  the current `products`/`product_variants` state.
