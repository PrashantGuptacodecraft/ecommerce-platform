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

Create a public bucket (e.g. `product-images`) for product photography.

- Public `SELECT` (read) — allowed for anyone (storefront needs to render
  images).
- `INSERT` / `UPDATE` / `DELETE` — restricted to authenticated users whose
  `admin_profiles.role = 'admin' AND is_active = true` (via a Storage RLS
  policy referencing that table, not just "any authenticated user").
- Enforce file size and MIME allow-list at the application layer before
  upload, in addition to whatever bucket-level limits Supabase offers.

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
