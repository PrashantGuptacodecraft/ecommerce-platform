-- 0017_wishlists_reviews.sql
-- Wishlists and Product Reviews (Phase 1)

-- ===========================================================================
-- wishlists & wishlist_items
-- Session-based wishlists for guests, similar to carts
-- ===========================================================================
create table public.wishlists (
  id uuid primary key default gen_random_uuid(),
  session_token text not null unique,
  customer_id uuid references public.customers (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_wishlists_updated_at
  before update on public.wishlists
  for each row execute function public.set_updated_at();

alter table public.wishlists enable row level security;

create policy wishlists_admin_read
  on public.wishlists for select
  to authenticated
  using (public.is_active_admin());

create table public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references public.wishlists (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(wishlist_id, product_id)
);

create index wishlist_items_wishlist_idx on public.wishlist_items (wishlist_id);

alter table public.wishlist_items enable row level security;

create policy wishlist_items_admin_read
  on public.wishlist_items for select
  to authenticated
  using (public.is_active_admin());

-- ===========================================================================
-- product_reviews
-- Customer reviews for products
-- ===========================================================================
create table public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  author_name text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  title text,
  content text,
  is_verified_purchase boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index product_reviews_product_idx on public.product_reviews (product_id);
create index product_reviews_status_idx on public.product_reviews (status);

create trigger set_product_reviews_updated_at
  before update on public.product_reviews
  for each row execute function public.set_updated_at();

alter table public.product_reviews enable row level security;

create policy product_reviews_public_read
  on public.product_reviews for select
  using (status = 'approved');

create policy product_reviews_admin_all
  on public.product_reviews for all
  to authenticated
  using (public.is_active_admin());
