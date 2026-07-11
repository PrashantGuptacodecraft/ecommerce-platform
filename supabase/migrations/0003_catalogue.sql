-- 0003_catalogue.sql
-- Product catalogue: categories, products, images, generic options/values,
-- variants, and the variant→option-value join. RLS: public (anon +
-- authenticated) may SELECT only active catalogue data; active admins get full
-- CRUD (defense in depth alongside the service-role server layer).

-- ===========================================================================
-- categories
-- ===========================================================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index categories_active_sort_idx on public.categories (is_active, sort_order);

create trigger set_categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

alter table public.categories enable row level security;

create policy categories_public_read
  on public.categories for select
  to anon, authenticated
  using (is_active);

create policy categories_admin_all
  on public.categories for all
  to authenticated
  using (public.is_active_admin())
  with check (public.is_active_admin());

-- ===========================================================================
-- products
-- ===========================================================================
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  short_description text,
  category_id uuid not null references public.categories (id) on delete restrict,
  base_price_paise integer not null check (base_price_paise >= 0),
  -- Discount display: only meaningful when strictly greater than base price.
  compare_at_price_paise integer
    check (compare_at_price_paise is null or compare_at_price_paise > base_price_paise),
  fabric text,
  care_instructions text,
  fit_info text,
  size_chart jsonb,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  is_new_arrival boolean not null default false,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_idx on public.products (category_id);
create index products_active_idx on public.products (is_active);
create index products_featured_idx on public.products (is_featured, is_active);
create index products_new_arrival_idx on public.products (is_new_arrival, is_active);

create trigger set_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

alter table public.products enable row level security;

create policy products_public_read
  on public.products for select
  to anon, authenticated
  using (is_active);

create policy products_admin_all
  on public.products for all
  to authenticated
  using (public.is_active_admin())
  with check (public.is_active_admin());

-- ===========================================================================
-- product_images  (child of products; cascade-deleted with the product)
-- ===========================================================================
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

-- At most one primary image per product.
create unique index product_images_one_primary_idx
  on public.product_images (product_id)
  where is_primary;

create index product_images_product_idx on public.product_images (product_id, sort_order);

alter table public.product_images enable row level security;

create policy product_images_public_read
  on public.product_images for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.is_active
    )
  );

create policy product_images_admin_all
  on public.product_images for all
  to authenticated
  using (public.is_active_admin())
  with check (public.is_active_admin());

-- ===========================================================================
-- product_options / product_option_values
-- Generic (Size, Colour, … — not hardcoded), future-proof for e.g. Length.
-- ===========================================================================
create table public.product_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, name)
);

create index product_options_product_idx on public.product_options (product_id, sort_order);

alter table public.product_options enable row level security;

create policy product_options_public_read
  on public.product_options for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.is_active
    )
  );

create policy product_options_admin_all
  on public.product_options for all
  to authenticated
  using (public.is_active_admin())
  with check (public.is_active_admin());

create table public.product_option_values (
  id uuid primary key default gen_random_uuid(),
  product_option_id uuid not null references public.product_options (id) on delete cascade,
  value text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (product_option_id, value)
);

create index product_option_values_option_idx
  on public.product_option_values (product_option_id, sort_order);

alter table public.product_option_values enable row level security;

create policy product_option_values_public_read
  on public.product_option_values for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.product_options po
      join public.products p on p.id = po.product_id
      where po.id = product_option_id and p.is_active
    )
  );

create policy product_option_values_admin_all
  on public.product_option_values for all
  to authenticated
  using (public.is_active_admin())
  with check (public.is_active_admin());

-- ===========================================================================
-- product_variants
-- ===========================================================================
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  sku text not null unique,
  -- Belt-and-braces: DB-level guarantee stock never goes negative, alongside
  -- the atomic reserve_variant_stock() function (0004).
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  price_adjustment_paise integer not null default 0,
  is_active boolean not null default true,
  image_id uuid references public.product_images (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index product_variants_product_idx on public.product_variants (product_id);
create index product_variants_active_idx on public.product_variants (is_active);

create trigger set_product_variants_updated_at
  before update on public.product_variants
  for each row execute function public.set_updated_at();

alter table public.product_variants enable row level security;

create policy product_variants_public_read
  on public.product_variants for select
  to anon, authenticated
  using (
    is_active
    and exists (
      select 1 from public.products p
      where p.id = product_id and p.is_active
    )
  );

create policy product_variants_admin_all
  on public.product_variants for all
  to authenticated
  using (public.is_active_admin())
  with check (public.is_active_admin());

-- ===========================================================================
-- variant_option_values  (variant X → {Size: M, Colour: Black})
-- ===========================================================================
create table public.variant_option_values (
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  option_value_id uuid not null references public.product_option_values (id) on delete restrict,
  primary key (variant_id, option_value_id)
);

create index variant_option_values_value_idx
  on public.variant_option_values (option_value_id);

alter table public.variant_option_values enable row level security;

create policy variant_option_values_public_read
  on public.variant_option_values for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.product_variants v
      join public.products p on p.id = v.product_id
      where v.id = variant_id and v.is_active and p.is_active
    )
  );

create policy variant_option_values_admin_all
  on public.variant_option_values for all
  to authenticated
  using (public.is_active_admin())
  with check (public.is_active_admin());
