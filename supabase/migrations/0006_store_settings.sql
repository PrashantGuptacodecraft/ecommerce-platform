-- 0006_store_settings.sql
-- Admin-editable key/value configuration: flat shipping charge, free-shipping
-- threshold, COD availability, active shipping provider, store contact info.
--
-- RLS: the full table is admin-only. A curated view exposes just the
-- public-safe keys to the storefront (docs/DATABASE_SCHEMA.md §3).

create table public.store_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create trigger set_store_settings_updated_at
  before update on public.store_settings
  for each row execute function public.set_updated_at();

alter table public.store_settings enable row level security;

-- Full-row access is admin-only; the storefront reads the view below instead.
create policy store_settings_admin_all
  on public.store_settings for all
  to authenticated
  using (public.is_active_admin())
  with check (public.is_active_admin());

-- ---------------------------------------------------------------------------
-- public_store_settings: exposes ONLY the public-safe subset of keys.
--
-- A regular (non-security_invoker) view runs with the privileges of its owner
-- and therefore bypasses store_settings' RLS — so the WHERE clause here is the
-- security boundary. Internal keys (e.g. 'shipping_provider') are excluded.
-- ---------------------------------------------------------------------------
create view public.public_store_settings as
  select key, value
  from public.store_settings
  where key in ('shipping', 'cod', 'contact');

comment on view public.public_store_settings is
  'Storefront-safe subset of store_settings (shipping rate/threshold, COD '
  'toggle, contact info). Excludes internal keys. Security boundary is the '
  'key allow-list in the WHERE clause.';

-- The storefront reads only this view; not the underlying table.
grant select on public.public_store_settings to anon, authenticated;
