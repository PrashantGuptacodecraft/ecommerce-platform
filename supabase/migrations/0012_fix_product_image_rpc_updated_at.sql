-- 0012_fix_product_image_rpc_updated_at.sql
-- Removes invalid updated_at references on product_images and properly updates products.updated_at

-- ===========================================================================
-- 1. finalize_product_image_upload (REPLACE)
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
    update public.product_images set is_primary = false where product_id = v_intent.product_id;
  end if;

  v_image_id := gen_random_uuid();
  insert into public.product_images (id, product_id, storage_path, alt_text, sort_order, is_primary)
  values (v_image_id, v_intent.product_id, v_intent.object_path, p_alt_text, coalesce((select max(sort_order) + 1 from public.product_images where product_id = v_intent.product_id), 0), v_set_primary);

  update public.product_image_upload_intents
  set status = 'finalized', finalized_at = now(), created_image_id = v_image_id
  where id = p_intent_id;

  update public.products set updated_at = now() where id = v_intent.product_id;

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
-- 2. update_product_images_transaction (REPLACE)
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
      is_primary = (v_img->>'is_primary')::boolean
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
-- 3. delete_product_image_transaction (REPLACE)
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
      update public.product_images set is_primary = true where id = v_next_primary_id;
    end if;
  end if;

  update public.products set updated_at = now() where id = v_product_id;

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
