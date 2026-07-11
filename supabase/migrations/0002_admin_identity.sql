-- 0002_admin_identity.sql
-- Trusted, server-managed admin role record + the authorization helper that
-- every later RLS policy uses as its defense-in-depth admin gate.
--
-- SECURITY: the admin role is NEVER derived from client-editable Supabase Auth
-- user_metadata/app_metadata (docs/SECURITY_MODEL.md §1). It lives here, joined
-- against auth.uid() on every privileged request. There is no public admin
-- signup — accounts are created only by supabase/seed/create-admin.ts.

create table public.admin_profiles (
  -- 1:1 with the Supabase Auth user.
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  -- Text (not a hard enum) so Phase 4 can extend to staff roles without a
  -- destructive type migration; constrained to 'admin' for now.
  role text not null default 'admin' check (role in ('admin')),
  -- Disable an admin without deleting the underlying auth user.
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_admin_profiles_updated_at
  before update on public.admin_profiles
  for each row execute function public.set_updated_at();

-- RLS: enabled from creation (never "temporarily" without it).
alter table public.admin_profiles enable row level security;

-- An authenticated admin may read ONLY their own profile row. All writes go
-- through the service-role client in server code (which bypasses RLS).
create policy admin_profiles_select_own
  on public.admin_profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- is_active_admin(): the single authorization predicate reused by every
-- admin RLS policy below. SECURITY DEFINER so it can read admin_profiles
-- regardless of that table's RLS (avoids policy recursion); STABLE and
-- search_path-pinned to prevent search-path hijacking.
-- ---------------------------------------------------------------------------
create or replace function public.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.admin_profiles ap
    where ap.id = (select auth.uid())
      and ap.role = 'admin'
      and ap.is_active
  );
$$;

comment on function public.is_active_admin() is
  'True when the current JWT resolves to an active admin_profiles row. '
  'Defense-in-depth gate for admin RLS policies; the primary gate is the '
  'TypeScript service layer (requireAdmin).';

revoke all on function public.is_active_admin() from public;
grant execute on function public.is_active_admin() to anon, authenticated, service_role;
