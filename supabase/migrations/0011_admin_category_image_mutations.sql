-- 0011_admin_category_image_mutations.sql
-- Milestone 5B: Category Mutations, Image Management, Upload Intents

create extension if not exists pgcrypto with schema extensions;

-- ===========================================================================
-- 0. Extend admin_mutation_idempotency
-- ===========================================================================
alter table public.admin_mutation_idempotency add column if not exists payload_hash text;

-- ===========================================================================
-- 1. product_image_upload_intents table
-- ===========================================================================
create table public.product_image_upload_intents (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  admin_id uuid not null references public.admin_profiles (id) on delete restrict,
  object_path text not null unique,
  declared_mime_type text not null check (declared_mime_type in ('image/jpeg', 'image/png', 'image/webp', 'image/avif')),
  declared_size_bytes bigint not null check (declared_size_bytes between 1 and 5242880),
  status text not null default 'pending' check (status in ('pending', 'finalized', 'expired', 'rejected', 'cleanup_pending')),
  expires_at timestamptz not null,
  finalized_at timestamptz,
  created_image_id uuid references public.product_images(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint expires_after_created check (expires_at > created_at),
  constraint valid_object_path check (
    object_path ~ ('^products/' || product_id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|avif)$')
  ),
  constraint valid_mime_extension check (
    (declared_mime_type = 'image/jpeg' and object_path like '%.jpg') or
    (declared_mime_type = 'image/png' and object_path like '%.png') or
    (declared_mime_type = 'image/webp' and object_path like '%.webp') or
    (declared_mime_type = 'image/avif' and object_path like '%.avif')
  )
);

create index product_image_upload_intents_status_idx
  on public.product_image_upload_intents (status, expires_at);

create trigger set_product_image_upload_intents_updated_at
  before update on public.product_image_upload_intents
  for each row execute function public.set_updated_at();

alter table public.product_image_upload_intents enable row level security;
revoke all on public.product_image_upload_intents from anon, authenticated, public;

-- ===========================================================================
-- 2. create_product_image_upload_intent
-- ===========================================================================
create or replace function public.create_product_image_upload_intent(
  p_product_id uuid,
  p_declared_mime_type text,
  p_declared_size_bytes bigint,
  p_idempotency_key uuid
)
returns table(intent_id uuid, object_path text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid;
  v_ext text;
  v_object_path text;
  v_intent_id uuid;
  v_expires_at timestamptz;
  v_cached_result jsonb;
  v_cached_hash text;
  v_payload_hash text;
begin
  if not public.is_active_admin() then
    raise exception 'UNAUTHORIZED' using errcode = 'insufficient_privilege';
  end if;
  v_admin_id := auth.uid();

  v_payload_hash := encode(extensions.digest(p_product_id::text || ':' || p_declared_mime_type || ':' || p_declared_size_bytes::text, 'sha256'), 'hex');

  select result, payload_hash into v_cached_result, v_cached_hash
  from public.admin_mutation_idempotency
  where idempotency_key = p_idempotency_key
  for update;

  if found then
    if coalesce(v_cached_hash, '') is distinct from v_payload_hash then
      raise exception 'IDEMPOTENCY_CONFLICT' using errcode = 'data_exception';
    end if;
    return query select (v_cached_result->>'intent_id')::uuid, v_cached_result->>'object_path', (v_cached_result->>'expires_at')::timestamptz;
    return;
  end if;

  if not exists(select 1 from public.products where id = p_product_id) then
    raise exception 'PRODUCT_NOT_FOUND' using errcode = 'foreign_key_violation';
  end if;

  if p_declared_size_bytes < 1 or p_declared_size_bytes > 5242880 then
    raise exception 'INVALID_SIZE' using errcode = 'check_violation';
  end if;

  case p_declared_mime_type
    when 'image/jpeg' then v_ext := 'jpg';
    when 'image/png' then v_ext := 'png';
    when 'image/webp' then v_ext := 'webp';
    when 'image/avif' then v_ext := 'avif';
    else raise exception 'INVALID_MIME_TYPE' using errcode = 'invalid_parameter_value';
  end case;

  v_intent_id := gen_random_uuid();
  v_object_path := 'products/' || p_product_id || '/' || v_intent_id || '.' || v_ext;
  v_expires_at := now() + interval '15 minutes';

  insert into public.product_image_upload_intents
    (id, product_id, admin_id, object_path, declared_mime_type, declared_size_bytes, expires_at)
  values
    (v_intent_id, p_product_id, v_admin_id, v_object_path, p_declared_mime_type, p_declared_size_bytes, v_expires_at);

  v_cached_result := jsonb_build_object('intent_id', v_intent_id, 'object_path', v_object_path, 'expires_at', v_expires_at);
  insert into public.admin_mutation_idempotency (idempotency_key, admin_id, mutation_type, result, payload_hash)
  values (p_idempotency_key, v_admin_id, 'create_product_image_upload_intent', v_cached_result, v_payload_hash);

  return query select v_intent_id, v_object_path, v_expires_at;
end;
$$;
revoke all on function public.create_product_image_upload_intent(uuid, text, bigint, uuid) from public, anon, authenticated;
grant execute on function public.create_product_image_upload_intent(uuid, text, bigint, uuid) to authenticated;

-- ===========================================================================
-- 3. finalize_product_image_upload
-- ===========================================================================
create or replace function public.finalize_product_image_upload(
  p_admin_id uuid,
  p_intent_id uuid,
  p_alt_text text,
  p_make_primary boolean,
  p_validated_mime_type text,
  p_validated_size_bytes bigint,
  p_width integer,
  p_height integer,
  p_idempotency_key uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_intent record;
  v_cached_result jsonb;
  v_cached_hash text;
  v_payload_hash text;
  v_image_id uuid;
  v_existing_images_count integer;
  v_set_primary boolean;
begin
  if not exists(select 1 from public.admin_profiles where id = p_admin_id and is_active = true) then
    raise exception 'UNAUTHORIZED' using errcode = 'insufficient_privilege';
  end if;

  v_payload_hash := encode(extensions.digest(p_admin_id::text || ':' || p_intent_id::text || ':' || coalesce(p_alt_text, '') || ':' || p_make_primary::text || ':' || p_validated_mime_type || ':' || p_validated_size_bytes::text, 'sha256'), 'hex');

  select result, payload_hash into v_cached_result, v_cached_hash
  from public.admin_mutation_idempotency
  where idempotency_key = p_idempotency_key
  for update;

  if found then
    if coalesce(v_cached_hash, '') is distinct from v_payload_hash then
      raise exception 'IDEMPOTENCY_CONFLICT' using errcode = 'data_exception';
    end if;
    return (v_cached_result->>'image_id')::uuid;
  end if;

  select * into v_intent
  from public.product_image_upload_intents
  where id = p_intent_id
  for update;

  if not found then
    raise exception 'INTENT_NOT_FOUND' using errcode = 'no_data_found';
  end if;

  if v_intent.admin_id != p_admin_id then
    raise exception 'INTENT_OWNER_MISMATCH' using errcode = 'insufficient_privilege';
  end if;

  if v_intent.status != 'pending' or v_intent.expires_at < now() then
    raise exception 'INTENT_EXPIRED_OR_FINALIZED' using errcode = 'object_not_in_prerequisite_state';
  end if;

  if v_intent.declared_mime_type != p_validated_mime_type then
    raise exception 'MIME_MISMATCH' using errcode = 'data_exception';
  end if;

  if p_validated_size_bytes < 1 or p_validated_size_bytes > 5242880 then
    raise exception 'INVALID_SIZE' using errcode = 'check_violation';
  end if;

  -- Concurrency locks
  perform id from public.products where id = v_intent.product_id for update;
  perform id from public.product_images where product_id = v_intent.product_id for update;

  select count(*) into v_existing_images_count from public.product_images where product_id = v_intent.product_id;
  v_set_primary := p_make_primary;
  
  if v_existing_images_count = 0 then
    v_set_primary := true;
  end if;

  if v_set_primary then
    update public.product_images set is_primary = false, updated_at = now() where product_id = v_intent.product_id;
  end if;

  v_image_id := gen_random_uuid();
  insert into public.product_images (id, product_id, storage_path, alt_text, sort_order, is_primary)
  values (v_image_id, v_intent.product_id, v_intent.object_path, p_alt_text, coalesce((select max(sort_order) + 1 from public.product_images where product_id = v_intent.product_id), 0), v_set_primary);

  update public.product_image_upload_intents
  set status = 'finalized', finalized_at = now(), created_image_id = v_image_id
  where id = p_intent_id;

  insert into public.admin_audit_logs (admin_id, action, entity_type, entity_id, metadata)
  values (p_admin_id, 'finalize_product_image', 'product_image', v_image_id, jsonb_build_object('product_id', v_intent.product_id, 'intent_id', p_intent_id, 'is_primary', v_set_primary));

  v_cached_result := jsonb_build_object('image_id', v_image_id);
  insert into public.admin_mutation_idempotency (idempotency_key, admin_id, mutation_type, result, payload_hash)
  values (p_idempotency_key, p_admin_id, 'finalize_product_image_upload', v_cached_result, v_payload_hash);

  return v_image_id;
end;
$$;
revoke all on function public.finalize_product_image_upload(uuid, uuid, text, boolean, text, bigint, integer, integer, uuid) from public, anon, authenticated;
grant execute on function public.finalize_product_image_upload(uuid, uuid, text, boolean, text, bigint, integer, integer, uuid) to service_role;

-- ===========================================================================
-- 4. update_product_images_transaction
-- ===========================================================================
create or replace function public.update_product_images_transaction(
  p_product_id uuid,
  p_expected_product_updated_at timestamptz,
  p_payload_version integer,
  p_payload jsonb,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid;
  v_cached_result jsonb;
  v_cached_hash text;
  v_payload_hash text;
  v_existing_updated_at timestamptz;
  v_img jsonb;
  v_primary_count integer := 0;
  v_img_id uuid;
  v_found_count integer;
  v_payload_length integer;
begin
  if not public.is_active_admin() then
    raise exception 'UNAUTHORIZED' using errcode = 'insufficient_privilege';
  end if;
  v_admin_id := auth.uid();

  v_payload_hash := encode(extensions.digest(p_product_id::text || ':' || p_payload::text, 'sha256'), 'hex');

  select result, payload_hash into v_cached_result, v_cached_hash
  from public.admin_mutation_idempotency
  where idempotency_key = p_idempotency_key
  for update;

  if found then
    if coalesce(v_cached_hash, '') is distinct from v_payload_hash then
      raise exception 'IDEMPOTENCY_CONFLICT' using errcode = 'data_exception';
    end if;
    return v_cached_result;
  end if;

  if p_payload_version != 1 then
    raise exception 'UNSUPPORTED_PAYLOAD_VERSION' using errcode = 'invalid_parameter_value';
  end if;

  select updated_at into v_existing_updated_at
  from public.products
  where id = p_product_id
  for update;

  if not found then
    raise exception 'PRODUCT_NOT_FOUND' using errcode = 'no_data_found';
  end if;

  if p_expected_product_updated_at is not null and v_existing_updated_at != p_expected_product_updated_at then
    raise exception 'CONCURRENCY_CONFLICT' using errcode = 'serialization_failure';
  end if;

  -- Lock all product images
  perform id from public.product_images where product_id = p_product_id for update;

  v_payload_length := jsonb_array_length(p_payload);
  
  if v_payload_length > 0 then
    for v_img in select * from jsonb_array_elements(p_payload) loop
      if (v_img->>'is_primary')::boolean then
        v_primary_count := v_primary_count + 1;
      end if;
      if length(coalesce(v_img->>'alt_text', '')) > 255 then
         raise exception 'ALT_TEXT_TOO_LONG' using errcode = 'string_data_right_truncation';
      end if;
    end loop;
    
    if v_primary_count != 1 then
      raise exception 'EXACTLY_ONE_PRIMARY_REQUIRED' using errcode = 'check_violation';
    end if;

    select count(*) into v_found_count 
    from public.product_images 
    where product_id = p_product_id 
      and id in (select (value->>'image_id')::uuid from jsonb_array_elements(p_payload));
      
    if v_found_count != v_payload_length then
      raise exception 'INVALID_IMAGE_ID' using errcode = 'foreign_key_violation';
    end if;
  end if;

  update public.product_images set is_primary = false where product_id = p_product_id;

  for v_img in select * from jsonb_array_elements(p_payload) loop
    v_img_id := (v_img->>'image_id')::uuid;
    update public.product_images set
      sort_order = (v_img->>'sort_order')::integer,
      alt_text = v_img->>'alt_text',
      is_primary = (v_img->>'is_primary')::boolean,
      updated_at = now()
    where id = v_img_id and product_id = p_product_id;
  end loop;

  update public.products set updated_at = now() where id = p_product_id returning updated_at into v_existing_updated_at;

  insert into public.admin_audit_logs (admin_id, action, entity_type, entity_id, metadata)
  values (v_admin_id, 'update_product_images', 'product', p_product_id, jsonb_build_object('count', v_payload_length));

  v_cached_result := jsonb_build_object('success', true, 'updated_at', v_existing_updated_at);
  insert into public.admin_mutation_idempotency (idempotency_key, admin_id, mutation_type, result, payload_hash)
  values (p_idempotency_key, v_admin_id, 'update_product_images_transaction', v_cached_result, v_payload_hash);

  return v_cached_result;
end;
$$;
revoke all on function public.update_product_images_transaction(uuid, timestamptz, integer, jsonb, uuid) from public, anon, authenticated;
grant execute on function public.update_product_images_transaction(uuid, timestamptz, integer, jsonb, uuid) to authenticated;

-- ===========================================================================
-- 5. delete_product_image_transaction (REPLACE)
-- ===========================================================================
create or replace function public.delete_product_image_transaction(
  p_image_id uuid,
  p_idempotency_key uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid;
  v_storage_path text;
  v_product_id uuid;
  v_is_primary boolean;
  v_job_id uuid;
  v_cached_result jsonb;
  v_cached_hash text;
  v_payload_hash text;
  v_next_primary_id uuid;
begin
  if not public.is_active_admin() then
    raise exception 'UNAUTHORIZED' using errcode = 'insufficient_privilege';
  end if;
  v_admin_id := auth.uid();

  v_payload_hash := encode(extensions.digest(p_image_id::text, 'sha256'), 'hex');

  select result, payload_hash into v_cached_result, v_cached_hash
  from public.admin_mutation_idempotency
  where idempotency_key = p_idempotency_key
  for update;

  if found then
    if coalesce(v_cached_hash, '') is distinct from v_payload_hash then
      raise exception 'IDEMPOTENCY_CONFLICT' using errcode = 'data_exception';
    end if;
    return (v_cached_result->>'job_id')::uuid;
  end if;

  select storage_path, product_id, is_primary into v_storage_path, v_product_id, v_is_primary
  from public.product_images
  where id = p_image_id
  for update;

  if not found then
    raise exception 'IMAGE_NOT_FOUND' using errcode = 'no_data_found';
  end if;

  if not (v_storage_path ~ ('^products/' || v_product_id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|avif)$')) then
    raise exception 'INVALID_PATH' using errcode = 'check_violation';
  end if;

  -- Concurrency locks
  perform id from public.products where id = v_product_id for update;
  perform id from public.product_images where product_id = v_product_id for update;

  delete from public.product_images where id = p_image_id;

  if v_is_primary then
    select id into v_next_primary_id from public.product_images where product_id = v_product_id order by sort_order asc limit 1;
    if v_next_primary_id is not null then
      update public.product_images set is_primary = false where product_id = v_product_id;
      update public.product_images set is_primary = true, updated_at = now() where id = v_next_primary_id;
    end if;
  end if;

  insert into public.storage_cleanup_jobs (bucket_name, object_path, source_image_id, product_id)
  values ('product-images', v_storage_path, p_image_id, v_product_id)
  on conflict (bucket_name, object_path) where status = 'pending' do update
  set updated_at = now()
  returning id into v_job_id;

  insert into public.admin_audit_logs (admin_id, action, entity_type, entity_id, metadata)
  values (v_admin_id, 'delete_product_image', 'product_image', p_image_id, jsonb_build_object('path', v_storage_path));

  v_cached_result := jsonb_build_object('job_id', v_job_id);
  insert into public.admin_mutation_idempotency (idempotency_key, admin_id, mutation_type, result, payload_hash)
  values (p_idempotency_key, v_admin_id, 'delete_product_image_transaction', v_cached_result, v_payload_hash);

  return v_job_id;
end;
$$;
revoke all on function public.delete_product_image_transaction(uuid, uuid) from public, anon, authenticated;
grant execute on function public.delete_product_image_transaction(uuid, uuid) to authenticated;

-- ===========================================================================
-- 6. save_category_transaction
-- ===========================================================================
create or replace function public.save_category_transaction(
  p_category_id uuid,
  p_expected_updated_at timestamptz,
  p_payload_version integer,
  p_payload jsonb,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid;
  v_cached_result jsonb;
  v_cached_hash text;
  v_payload_hash text;
  v_existing_updated_at timestamptz;
  v_slug text;
  v_name text;
  v_description text;
  v_sort_order integer;
  v_is_active boolean;
  v_active_products_count integer;
begin
  if not public.is_active_admin() then
    raise exception 'UNAUTHORIZED' using errcode = 'insufficient_privilege';
  end if;
  v_admin_id := auth.uid();

  v_payload_hash := encode(extensions.digest(p_category_id::text || ':' || p_payload::text, 'sha256'), 'hex');

  select result, payload_hash into v_cached_result, v_cached_hash
  from public.admin_mutation_idempotency
  where idempotency_key = p_idempotency_key
  for update;

  if found then
    if coalesce(v_cached_hash, '') is distinct from v_payload_hash then
      raise exception 'IDEMPOTENCY_CONFLICT' using errcode = 'data_exception';
    end if;
    return v_cached_result;
  end if;

  if p_payload_version != 1 then
    raise exception 'UNSUPPORTED_PAYLOAD_VERSION' using errcode = 'invalid_parameter_value';
  end if;

  v_name := trim(p_payload->>'name');
  v_slug := trim(p_payload->>'slug');
  v_description := trim(p_payload->>'description');
  v_sort_order := (p_payload->>'sort_order')::integer;
  v_is_active := (p_payload->>'is_active')::boolean;

  if length(v_name) < 1 or length(v_name) > 100 or length(v_slug) < 1 or length(v_slug) > 100 then
    raise exception 'INVALID_LENGTH' using errcode = 'check_violation';
  end if;

  select updated_at into v_existing_updated_at from public.categories where id = p_category_id for update;

  if found and p_expected_updated_at is not null and v_existing_updated_at != p_expected_updated_at then
    raise exception 'CONCURRENCY_CONFLICT' using errcode = 'serialization_failure';
  end if;

  if not v_is_active and found then
    select count(*) into v_active_products_count from public.products where category_id = p_category_id and is_active = true;
    if v_active_products_count > 0 then
      raise exception 'CATEGORY_IN_USE' using errcode = 'restrict_violation';
    end if;
  end if;

  if v_existing_updated_at is null then
    insert into public.categories (id, name, slug, description, sort_order, is_active)
    values (p_category_id, v_name, v_slug, v_description, v_sort_order, v_is_active)
    returning updated_at into v_existing_updated_at;
  else
    update public.categories set
      name = v_name, slug = v_slug, description = v_description, sort_order = v_sort_order, is_active = v_is_active, updated_at = now()
    where id = p_category_id
    returning updated_at into v_existing_updated_at;
  end if;

  insert into public.admin_audit_logs (admin_id, action, entity_type, entity_id, metadata)
  values (v_admin_id, 'save_category', 'category', p_category_id, jsonb_build_object('slug', v_slug, 'is_active', v_is_active));

  v_cached_result := jsonb_build_object('success', true, 'updated_at', v_existing_updated_at);
  insert into public.admin_mutation_idempotency (idempotency_key, admin_id, mutation_type, result, payload_hash)
  values (p_idempotency_key, v_admin_id, 'save_category_transaction', v_cached_result, v_payload_hash);

  return v_cached_result;
end;
$$;
revoke all on function public.save_category_transaction(uuid, timestamptz, integer, jsonb, uuid) from public, anon, authenticated;
grant execute on function public.save_category_transaction(uuid, timestamptz, integer, jsonb, uuid) to authenticated;
