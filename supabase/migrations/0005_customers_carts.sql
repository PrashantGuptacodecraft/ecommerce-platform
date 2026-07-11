-- 0005_customers_carts.sql
-- Customers (minimal, mostly for future Phase 3 account linkage), addresses,
-- and the server-persisted cart used only for re-validation.
--
-- RLS posture (docs/SECURITY_MODEL.md §3): these are order-adjacent tables, so
-- there is NO direct anon/authenticated access. All reads/writes go through
-- server code using the service-role client (which re-checks authorization in
-- TypeScript). Active admins may read for support/debug. Carts are managed
-- server-side because a guest session token cannot be bound into an RLS
-- predicate with the anon key — see docs/DECISIONS.md (#16).

-- ===========================================================================
-- customers  (Phase 1: minimal; accounts/UI deferred to Phase 3)
-- ===========================================================================
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  phone text unique,
  email text unique,
  full_name text,
  created_at timestamptz not null default now()
);

alter table public.customers enable row level security;

create policy customers_admin_read
  on public.customers for select
  to authenticated
  using (public.is_active_admin());

-- ===========================================================================
-- addresses
-- ===========================================================================
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers (id) on delete set null,
  full_name text not null,
  phone text not null,
  email text,
  address_line1 text not null,
  address_line2 text,
  landmark text,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null default 'IN',
  created_at timestamptz not null default now()
);

create index addresses_customer_idx on public.addresses (customer_id);

alter table public.addresses enable row level security;

create policy addresses_admin_read
  on public.addresses for select
  to authenticated
  using (public.is_active_admin());

-- ===========================================================================
-- carts / cart_items
-- Server-persisted representation used only for re-validation — NOT the
-- pricing source of truth (that is always recomputed server-side).
-- ===========================================================================
create table public.carts (
  id uuid primary key default gen_random_uuid(),
  session_token text not null unique,
  customer_id uuid references public.customers (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_carts_updated_at
  before update on public.carts
  for each row execute function public.set_updated_at();

alter table public.carts enable row level security;

create policy carts_admin_read
  on public.carts for select
  to authenticated
  using (public.is_active_admin());

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts (id) on delete cascade,
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, variant_id)
);

create index cart_items_cart_idx on public.cart_items (cart_id);

create trigger set_cart_items_updated_at
  before update on public.cart_items
  for each row execute function public.set_updated_at();

alter table public.cart_items enable row level security;

create policy cart_items_admin_read
  on public.cart_items for select
  to authenticated
  using (public.is_active_admin());
