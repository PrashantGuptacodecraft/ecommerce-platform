-- 0008_orders_payments_shipments.sql
-- Orders, immutable order-item snapshots, payments, and (manual) shipments.
--
-- RLS (docs/SECURITY_MODEL.md §3): NO direct anon/authenticated SELECT on any
-- of these. Orders are created only via server (service-role) logic inside
-- services/orders; guest order tracking uses a purpose-built lookup endpoint,
-- never a raw table read. Active admins get scoped SELECT/UPDATE.

-- Human-readable, race-free order numbers: SN-0001, SN-0002, …
create sequence public.order_number_seq start 1;

-- ===========================================================================
-- orders
-- ===========================================================================
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique
    default ('SN-' || lpad(nextval('public.order_number_seq')::text, 4, '0')),
  customer_id uuid references public.customers (id) on delete set null,
  address_id uuid not null references public.addresses (id) on delete restrict,
  status public.order_status not null default 'PENDING_PAYMENT',
  payment_method public.payment_method not null,
  subtotal_paise integer not null check (subtotal_paise >= 0),
  shipping_paise integer not null default 0 check (shipping_paise >= 0),
  discount_paise integer not null default 0 check (discount_paise >= 0),
  total_paise integer not null check (total_paise >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_status_idx on public.orders (status);
create index orders_payment_method_idx on public.orders (payment_method);
create index orders_created_idx on public.orders (created_at desc);
create index orders_customer_idx on public.orders (customer_id);

create trigger set_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

alter table public.orders enable row level security;

create policy orders_admin_read
  on public.orders for select
  to authenticated
  using (public.is_active_admin());

create policy orders_admin_update
  on public.orders for update
  to authenticated
  using (public.is_active_admin())
  with check (public.is_active_admin());

-- ===========================================================================
-- order_items — immutable price/product snapshot. Editing a product later
-- must never change historical orders; FK refs may go null if the source
-- product/variant is later deleted, but the snapshot survives.
-- ===========================================================================
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  product_name_snapshot text not null,
  product_slug_snapshot text not null,
  product_image_snapshot text,
  sku_snapshot text not null,
  size_snapshot text,
  colour_snapshot text,
  unit_price_paise_snapshot integer not null check (unit_price_paise_snapshot >= 0),
  quantity integer not null check (quantity > 0),
  line_total_paise integer not null check (line_total_paise >= 0),
  created_at timestamptz not null default now()
);

create index order_items_order_idx on public.order_items (order_id);

alter table public.order_items enable row level security;

create policy order_items_admin_read
  on public.order_items for select
  to authenticated
  using (public.is_active_admin());

-- ===========================================================================
-- payments
-- ===========================================================================
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  provider public.payment_method not null,
  razorpay_order_id text,
  razorpay_payment_id text,
  -- Stored for verification/audit; NEVER logged raw (docs/SECURITY_MODEL.md §2).
  razorpay_signature text,
  status public.payment_status not null default 'created',
  amount_paise integer not null check (amount_paise >= 0),
  raw_event_ref uuid references public.webhook_events (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Idempotency guard: at most one payment row per Razorpay payment id.
create unique index payments_razorpay_payment_id_key
  on public.payments (razorpay_payment_id)
  where razorpay_payment_id is not null;

create index payments_order_idx on public.payments (order_id);

create trigger set_payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

alter table public.payments enable row level security;

create policy payments_admin_read
  on public.payments for select
  to authenticated
  using (public.is_active_admin());

-- ===========================================================================
-- shipments — manual in Phase 1; same table serves Shiprocket in Phase 2 via
-- the provider column.
-- ===========================================================================
create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  provider public.shipment_provider not null default 'manual',
  courier_name text,
  tracking_number text,
  tracking_url text,
  status text not null default 'pending',
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index shipments_order_idx on public.shipments (order_id);

create trigger set_shipments_updated_at
  before update on public.shipments
  for each row execute function public.set_updated_at();

alter table public.shipments enable row level security;

create policy shipments_admin_all
  on public.shipments for all
  to authenticated
  using (public.is_active_admin())
  with check (public.is_active_admin());
