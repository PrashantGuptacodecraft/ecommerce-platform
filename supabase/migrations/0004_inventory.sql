-- 0004_inventory.sql
-- Append-only inventory ledger + the atomic stock primitives.
--
-- Stock is NEVER adjusted with a read-then-write from the app layer. All
-- decrements/increments go through the SECURITY DEFINER functions below, which
-- lock the variant row (SELECT ... FOR UPDATE) and write a ledger row in the
-- same transaction as the caller (order creation / webhook processing).
-- See docs/DATABASE_SCHEMA.md §4 and docs/ARCHITECTURE.md §4.

create table public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants (id) on delete restrict,
  -- Signed: negative = stock removed, positive = stock returned.
  change_quantity integer not null,
  reason public.inventory_reason not null,
  reference_type text check (reference_type in ('order', 'manual', 'return')),
  reference_id uuid,
  note text,
  created_by uuid references public.admin_profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index inventory_transactions_variant_idx
  on public.inventory_transactions (variant_id, created_at);
create index inventory_transactions_reference_idx
  on public.inventory_transactions (reference_type, reference_id);

-- RLS: append-only ledger. Active admins may read (support/debug); there are
-- deliberately NO insert/update/delete policies — rows are written only via
-- the service-role client or the SECURITY DEFINER functions below, and are
-- never mutated or deleted.
alter table public.inventory_transactions enable row level security;

create policy inventory_transactions_admin_read
  on public.inventory_transactions for select
  to authenticated
  using (public.is_active_admin());

-- ---------------------------------------------------------------------------
-- reserve_variant_stock(variant, qty, [order id], [note])
-- Atomically verifies the variant is active and has enough stock, decrements
-- it, and records an 'order_reservation' ledger row. Raises on any failure so
-- the enclosing order-creation transaction rolls back cleanly. Returns the
-- remaining stock.
-- ---------------------------------------------------------------------------
create or replace function public.reserve_variant_stock(
  p_variant_id uuid,
  p_quantity integer,
  p_reference_id uuid default null,
  p_note text default null
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_stock integer;
  v_active boolean;
begin
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'INVALID_QUANTITY: must be a positive integer'
      using errcode = 'check_violation';
  end if;

  -- Lock the variant row for the duration of the transaction.
  select stock_quantity, is_active
    into v_stock, v_active
  from public.product_variants
  where id = p_variant_id
  for update;

  if not found then
    raise exception 'VARIANT_NOT_FOUND: %', p_variant_id
      using errcode = 'no_data_found';
  end if;

  if not v_active then
    raise exception 'VARIANT_INACTIVE: %', p_variant_id
      using errcode = 'raise_exception';
  end if;

  if v_stock < p_quantity then
    raise exception 'INSUFFICIENT_STOCK: have %, need %', v_stock, p_quantity
      using errcode = 'raise_exception';
  end if;

  update public.product_variants
    set stock_quantity = stock_quantity - p_quantity,
        updated_at = now()
  where id = p_variant_id;

  insert into public.inventory_transactions
    (variant_id, change_quantity, reason, reference_type, reference_id, note)
  values
    (p_variant_id, -p_quantity, 'order_reservation',
     case when p_reference_id is null then 'manual' else 'order' end,
     p_reference_id, p_note);

  return v_stock - p_quantity;
end;
$$;

comment on function public.reserve_variant_stock(uuid, integer, uuid, text) is
  'Atomically reserve stock for a variant (decrement + order_reservation '
  'ledger row). Raises INSUFFICIENT_STOCK / VARIANT_INACTIVE / VARIANT_NOT_FOUND.';

-- ---------------------------------------------------------------------------
-- release_variant_stock(variant, qty, [order id], [note])
-- Returns previously reserved stock (payment failed / order cancelled /
-- reservation expired). Increments stock and records an 'order_cancellation'
-- ledger row. Returns the resulting stock.
-- ---------------------------------------------------------------------------
create or replace function public.release_variant_stock(
  p_variant_id uuid,
  p_quantity integer,
  p_reference_id uuid default null,
  p_note text default null
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_stock integer;
begin
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'INVALID_QUANTITY: must be a positive integer'
      using errcode = 'check_violation';
  end if;

  select stock_quantity
    into v_stock
  from public.product_variants
  where id = p_variant_id
  for update;

  if not found then
    raise exception 'VARIANT_NOT_FOUND: %', p_variant_id
      using errcode = 'no_data_found';
  end if;

  update public.product_variants
    set stock_quantity = stock_quantity + p_quantity,
        updated_at = now()
  where id = p_variant_id;

  insert into public.inventory_transactions
    (variant_id, change_quantity, reason, reference_type, reference_id, note)
  values
    (p_variant_id, p_quantity, 'order_cancellation',
     case when p_reference_id is null then 'manual' else 'order' end,
     p_reference_id, p_note);

  return v_stock + p_quantity;
end;
$$;

comment on function public.release_variant_stock(uuid, integer, uuid, text) is
  'Atomically release previously reserved stock (increment + order_cancellation '
  'ledger row).';

-- These mutate stock and must only be callable by trusted server code
-- (service-role). Guests/authenticated users can never invoke them directly.
revoke all on function public.reserve_variant_stock(uuid, integer, uuid, text) from public, anon, authenticated;
revoke all on function public.release_variant_stock(uuid, integer, uuid, text) from public, anon, authenticated;
grant execute on function public.reserve_variant_stock(uuid, integer, uuid, text) to service_role;
grant execute on function public.release_variant_stock(uuid, integer, uuid, text) to service_role;
