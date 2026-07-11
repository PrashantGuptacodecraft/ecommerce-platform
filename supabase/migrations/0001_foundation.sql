-- 0001_foundation.sql
-- Foundations shared by all later migrations: enum types and the generic
-- updated_at trigger function. See docs/DATABASE_SCHEMA.md for the spec.
--
-- Identifier strategy: UUID v4 via gen_random_uuid() (built into Postgres 13+
-- core, which Supabase runs — no pgcrypto extension required).
-- All monetary values are integer paise. All timestamps are timestamptz.

-- ---------------------------------------------------------------------------
-- Enum types (closed sets from docs/DATABASE_SCHEMA.md)
-- ---------------------------------------------------------------------------

-- Order lifecycle — superset covering both Razorpay and COD payment methods.
create type public.order_status as enum (
  'PENDING_PAYMENT',
  'PENDING_CONFIRMATION',
  'CONFIRMED',
  'PROCESSING',
  'PACKED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'PAYMENT_FAILED',
  'RETURN_REQUESTED',
  'RETURNED'
);

-- How the customer pays. COD is kept a fully separate branch from Razorpay.
create type public.payment_method as enum ('razorpay', 'cod');

-- Payment provider-level status (mirrors Razorpay's captured lifecycle; COD
-- rows use 'created' → 'captured' on delivery, or 'failed'/'refunded').
create type public.payment_status as enum (
  'created',
  'authorized',
  'captured',
  'failed',
  'refunded'
);

-- Reasons for an append-only inventory ledger movement.
create type public.inventory_reason as enum (
  'initial_stock',
  'manual_adjustment',
  'order_reservation',
  'order_completed',
  'order_cancellation',
  'return',
  'damaged_item'
);

-- Shipping provider. Phase 1 is 'manual'; 'shiprocket' reserved for Phase 2.
create type public.shipment_provider as enum ('manual', 'shiprocket');

-- ---------------------------------------------------------------------------
-- Shared trigger function: maintain updated_at on mutable tables.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'BEFORE UPDATE trigger helper: stamps updated_at = now() on the new row.';
