-- 0007_webhooks_audit.sql
-- Razorpay webhook idempotency/audit trail + admin action audit log.
-- Created before orders/payments because payments.raw_event_ref references
-- webhook_events.

-- ===========================================================================
-- webhook_events — idempotency guard + audit for Razorpay webhooks.
-- The unique event_id makes a duplicate delivery a no-op on second receipt,
-- detected before any state mutation (docs/SECURITY_MODEL.md §2.7).
-- ===========================================================================
create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'razorpay' check (provider in ('razorpay')),
  event_id text not null unique,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create index webhook_events_type_idx on public.webhook_events (event_type, created_at);

-- RLS: service-role only. Deliberately NO policies — the webhook handler uses
-- the service-role client (which bypasses RLS); no anon/authenticated access.
alter table public.webhook_events enable row level security;

-- ===========================================================================
-- admin_audit_logs — who/what/when for every privileged mutation.
-- ===========================================================================
create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.admin_profiles (id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index admin_audit_logs_admin_idx on public.admin_audit_logs (admin_id, created_at);
create index admin_audit_logs_entity_idx on public.admin_audit_logs (entity_type, entity_id);

-- RLS: read-only in the admin UI (active admins); rows are inserted by server
-- actions via the service-role client. No insert/update/delete policies.
alter table public.admin_audit_logs enable row level security;

create policy admin_audit_logs_admin_read
  on public.admin_audit_logs for select
  to authenticated
  using (public.is_active_admin());
