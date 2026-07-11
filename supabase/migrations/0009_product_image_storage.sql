-- 0009_product_image_storage.sql
-- Product image Storage: the `product-images` bucket + RLS policies on
-- storage.objects. Brings the bucket (previously a manual dashboard step) under
-- version control so it is reproducible. Does NOT modify migrations 0001-0008.
--
-- Authorization reuses the EXISTING helper public.is_active_admin() from
-- 0002_admin_identity.sql. Confirmed signature before writing these policies:
--   create function public.is_active_admin() returns boolean
--     language sql stable security definer set search_path = public, pg_temp
--   -- ZERO arguments; execute granted to anon, authenticated, service_role.
-- It is therefore called here with no arguments.
--
-- Idempotency & safety:
--   * Bucket is upserted (insert ... on conflict (id) do update), so re-running
--     is a no-op that also corrects the limits if the bucket was pre-created.
--   * Postgres has no CREATE POLICY IF NOT EXISTS, so each policy is dropped by
--     its exact name (drop policy if exists) then recreated. Only the four
--     named policies this migration owns are touched — no existing RLS is
--     dropped or weakened.
--   * RLS on storage.objects (managed/enabled by Supabase) is NOT disabled.
--   * No secrets: the service-role key is never referenced; service_role
--     bypasses RLS at the connection level and needs no policy.

-- ---------------------------------------------------------------------------
-- 1. Bucket: public read, 5 MB cap, raster image MIME allow-list.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 * 1024 * 1024 bytes
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- 2. RLS policies on storage.objects, scoped to the product-images bucket.
--    Storefront needs public read; writes are admin-only (docs/SECURITY_MODEL.md
--    §3). Every policy is bucket-scoped so it can never affect other buckets.
-- ---------------------------------------------------------------------------

-- Public read: anyone may SELECT objects from this bucket only.
drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'product-images');

-- Admin insert: only an authenticated, active admin may upload, and only into
-- this bucket (bucket_id validated per requirement).
drop policy if exists "product_images_admin_insert" on storage.objects;
create policy "product_images_admin_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'product-images'
    and public.is_active_admin()
  );

-- Admin update: only an authenticated, active admin may modify, and both the
-- existing row (USING) and the new row (WITH CHECK) must stay in this bucket.
drop policy if exists "product_images_admin_update" on storage.objects;
create policy "product_images_admin_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'product-images'
    and public.is_active_admin()
  )
  with check (
    bucket_id = 'product-images'
    and public.is_active_admin()
  );

-- Admin delete: only an authenticated, active admin may delete from this bucket.
drop policy if exists "product_images_admin_delete" on storage.objects;
create policy "product_images_admin_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'product-images'
    and public.is_active_admin()
  );
