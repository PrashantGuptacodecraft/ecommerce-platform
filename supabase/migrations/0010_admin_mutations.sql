-- 0010_admin_mutations.sql
-- Transactional admin mutations and audit logging for Milestone 5.

-- ===========================================================================
-- 1. admin_mutation_idempotency
-- Idempotency table for manual stock adjustments and other admin mutations.
-- ===========================================================================
create table public.admin_mutation_idempotency (
  idempotency_key uuid primary key,
  admin_id uuid not null references public.admin_profiles (id) on delete restrict,
  mutation_type text not null,
  result jsonb,
  created_at timestamptz not null default now()
);
alter table public.admin_mutation_idempotency enable row level security;

-- ===========================================================================
-- 2. storage_cleanup_jobs
-- Durable deletion of images from Supabase Storage.
-- ===========================================================================
create table public.storage_cleanup_jobs (
  id uuid primary key default gen_random_uuid(),
  bucket_name text not null,
  object_path text not null,
  source_image_id uuid,
  product_id uuid,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  attempts integer not null default 0 check (attempts >= 0),
  last_error text check (char_length(last_error) <= 2000),
  next_attempt_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index storage_cleanup_jobs_status_created_idx
  on public.storage_cleanup_jobs (status, created_at);

-- Partial unique index to prevent duplicate pending jobs for the same object
create unique index storage_cleanup_jobs_unique_pending_idx
  on public.storage_cleanup_jobs (bucket_name, object_path)
  where status = 'pending';

-- Apply the shared updated_at trigger
create trigger set_storage_cleanup_jobs_updated_at
  before update on public.storage_cleanup_jobs
  for each row execute function public.set_updated_at();

-- RLS for storage_cleanup_jobs (Service role only for processing)
alter table public.storage_cleanup_jobs enable row level security;
revoke all on public.storage_cleanup_jobs from anon, authenticated;

-- ===========================================================================
-- 3. manual_adjust_variant_stock RPC
-- Atomically adjust stock, write ledger, write audit log.
-- ===========================================================================
create or replace function public.manual_adjust_variant_stock(
  p_variant_id uuid,
  p_change_quantity integer,
  p_note text,
  p_idempotency_key uuid
)
returns table(new_stock integer, transaction_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_stock integer;
  v_admin_id uuid;
  v_transaction_id uuid;
  v_trimmed_note text;
  v_cached_result jsonb;
begin
  if not public.is_active_admin() then
    raise exception 'UNAUTHORIZED' using errcode = 'insufficient_privilege';
  end if;
  v_admin_id := auth.uid();

  -- Idempotency Check
  select result into v_cached_result
  from public.admin_mutation_idempotency
  where idempotency_key = p_idempotency_key
  for update;

  if found then
    return query select (v_cached_result->>'new_stock')::integer, (v_cached_result->>'transaction_id')::uuid;
    return;
  end if;

  v_trimmed_note := trim(p_note);

  if p_change_quantity = 0 then
    raise exception 'INVALID_QUANTITY' using errcode = 'check_violation';
  end if;
  if p_change_quantity < -100000 or p_change_quantity > 100000 then
    raise exception 'INVALID_QUANTITY' using errcode = 'check_violation';
  end if;
  if v_trimmed_note is null or length(v_trimmed_note) = 0 or length(v_trimmed_note) > 500 then
    raise exception 'INVALID_NOTE' using errcode = 'check_violation';
  end if;

  select pv.stock_quantity into v_stock
  from public.product_variants pv
  where pv.id = p_variant_id
  for update;

  if not found then
    raise exception 'VARIANT_NOT_FOUND' using errcode = 'no_data_found';
  end if;

  if (p_change_quantity > 0 and v_stock > (2147483647 - p_change_quantity)) then
     raise exception 'OVERFLOW' using errcode = 'numeric_value_out_of_range';
  end if;

  if (v_stock + p_change_quantity) < 0 then
    raise exception 'NEGATIVE_STOCK_PREVENTED' using errcode = 'check_violation';
  end if;

  update public.product_variants
    set stock_quantity = stock_quantity + p_change_quantity,
        updated_at = now()
  where id = p_variant_id;

  insert into public.inventory_transactions
    (variant_id, change_quantity, reason, reference_type, note, created_by)
  values
    (p_variant_id, p_change_quantity, 'manual_adjustment'::public.inventory_reason, 'manual', v_trimmed_note, v_admin_id)
  returning id into v_transaction_id;

  insert into public.admin_audit_logs
    (admin_id, action, entity_type, entity_id, metadata)
  values
    (v_admin_id, 'manual_stock_adjustment', 'product_variant', p_variant_id, 
     jsonb_build_object('change', p_change_quantity, 'new_stock', v_stock + p_change_quantity, 'tx_id', v_transaction_id));

  v_cached_result := jsonb_build_object('new_stock', v_stock + p_change_quantity, 'transaction_id', v_transaction_id);

  insert into public.admin_mutation_idempotency (idempotency_key, admin_id, mutation_type, result)
  values (p_idempotency_key, v_admin_id, 'manual_adjust_variant_stock', v_cached_result);

  return query select (v_stock + p_change_quantity), v_transaction_id;
end;
$$;
revoke all on function public.manual_adjust_variant_stock(uuid, integer, text, uuid) from public, anon, authenticated;
grant execute on function public.manual_adjust_variant_stock(uuid, integer, text, uuid) to authenticated;

-- ===========================================================================
-- 4. delete_product_image_transaction RPC
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
  v_job_id uuid;
  v_cached_result jsonb;
begin
  if not public.is_active_admin() then
    raise exception 'UNAUTHORIZED' using errcode = 'insufficient_privilege';
  end if;
  v_admin_id := auth.uid();

  -- Idempotency Check
  select result into v_cached_result
  from public.admin_mutation_idempotency
  where idempotency_key = p_idempotency_key
  for update;

  if found then
    return (v_cached_result->>'job_id')::uuid;
  end if;

  select storage_path, product_id into v_storage_path, v_product_id
  from public.product_images
  where id = p_image_id
  for update;

  if not found then
    raise exception 'IMAGE_NOT_FOUND' using errcode = 'no_data_found';
  end if;

  if not (v_storage_path like 'products/' || v_product_id || '/%') then
    raise exception 'INVALID_PATH' using errcode = 'check_violation';
  end if;

  delete from public.product_images where id = p_image_id;

  insert into public.storage_cleanup_jobs (bucket_name, object_path, source_image_id, product_id)
  values ('product-images', v_storage_path, p_image_id, v_product_id)
  on conflict (bucket_name, object_path) where status = 'pending' do update
  set updated_at = now()
  returning id into v_job_id;

  insert into public.admin_audit_logs (admin_id, action, entity_type, entity_id, metadata)
  values (v_admin_id, 'delete_product_image', 'product_image', p_image_id, jsonb_build_object('path', v_storage_path));

  v_cached_result := jsonb_build_object('job_id', v_job_id);
  insert into public.admin_mutation_idempotency (idempotency_key, admin_id, mutation_type, result)
  values (p_idempotency_key, v_admin_id, 'delete_product_image_transaction', v_cached_result);

  return v_job_id;
end;
$$;
revoke all on function public.delete_product_image_transaction(uuid, uuid) from public, anon, authenticated;
grant execute on function public.delete_product_image_transaction(uuid, uuid) to authenticated;

-- ===========================================================================
-- 5. save_product_tree RPC
-- ===========================================================================
create or replace function public.save_product_tree(
  p_product_id uuid,
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
  v_existing_updated_at timestamptz;
  v_product jsonb;
  v_options jsonb;
  v_variants jsonb;
  v_opt jsonb;
  v_val jsonb;
  v_var jsonb;
  v_opt_id uuid;
  v_val_id uuid;
  v_var_id uuid;
  v_var_ids_to_keep uuid[] := '{}';
  v_opt_ids_to_keep uuid[] := '{}';
  v_val_ids_to_keep uuid[] := '{}';
  v_deleted_variant record;
  v_stock_sum integer;
  v_opt_val_id uuid;
  v_val_id_array uuid[];
begin
  if not public.is_active_admin() then
    raise exception 'UNAUTHORIZED' using errcode = 'insufficient_privilege';
  end if;
  v_admin_id := auth.uid();

  -- Idempotency Check
  select result into v_cached_result
  from public.admin_mutation_idempotency
  where idempotency_key = p_idempotency_key
  for update;

  if found then
    return v_cached_result;
  end if;

  if p_payload_version != 1 then
    raise exception 'UNSUPPORTED_PAYLOAD_VERSION' using errcode = 'invalid_parameter_value';
  end if;

  -- Optimistic Concurrency Protection
  select updated_at into v_existing_updated_at
  from public.products
  where id = p_product_id
  for update;

  if found and p_expected_updated_at is not null and v_existing_updated_at != p_expected_updated_at then
    raise exception 'CONCURRENCY_CONFLICT' using errcode = 'serialization_failure';
  end if;

  v_product := p_payload->'product';
  v_options := p_payload->'options';
  v_variants := p_payload->'variants';

  -- Limits
  if jsonb_array_length(v_options) > 3 then
    raise exception 'TOO_MANY_OPTIONS' using errcode = 'check_violation';
  end if;
  if jsonb_array_length(v_variants) > 100 then
    raise exception 'TOO_MANY_VARIANTS' using errcode = 'check_violation';
  end if;

  -- 1. Upsert Product
  if v_existing_updated_at is null then
    insert into public.products (
      id, name, slug, description, short_description, category_id, base_price_paise, 
      compare_at_price_paise, fabric, care_instructions, fit_info, size_chart,
      is_active, is_featured, is_new_arrival, seo_title, seo_description
    ) values (
      p_product_id,
      v_product->>'name',
      v_product->>'slug',
      v_product->>'description',
      v_product->>'short_description',
      (v_product->>'category_id')::uuid,
      (v_product->>'base_price_paise')::integer,
      (v_product->>'compare_at_price_paise')::integer,
      v_product->>'fabric',
      v_product->>'care_instructions',
      v_product->>'fit_info',
      v_product->'size_chart',
      (v_product->>'is_active')::boolean,
      (v_product->>'is_featured')::boolean,
      (v_product->>'is_new_arrival')::boolean,
      v_product->>'seo_title',
      v_product->>'seo_description'
    );
  else
    update public.products set
      name = v_product->>'name',
      slug = v_product->>'slug',
      description = v_product->>'description',
      short_description = v_product->>'short_description',
      category_id = (v_product->>'category_id')::uuid,
      base_price_paise = (v_product->>'base_price_paise')::integer,
      compare_at_price_paise = (v_product->>'compare_at_price_paise')::integer,
      fabric = v_product->>'fabric',
      care_instructions = v_product->>'care_instructions',
      fit_info = v_product->>'fit_info',
      size_chart = v_product->'size_chart',
      is_active = (v_product->>'is_active')::boolean,
      is_featured = (v_product->>'is_featured')::boolean,
      is_new_arrival = (v_product->>'is_new_arrival')::boolean,
      seo_title = v_product->>'seo_title',
      seo_description = v_product->>'seo_description',
      updated_at = now()
    where id = p_product_id;
  end if;

  -- 2. Upsert Options and Values
  for v_opt in select * from jsonb_array_elements(v_options) loop
    v_opt_id := (v_opt->>'id')::uuid;
    v_opt_ids_to_keep := array_append(v_opt_ids_to_keep, v_opt_id);

    insert into public.product_options (id, product_id, name, sort_order)
    values (v_opt_id, p_product_id, v_opt->>'name', (v_opt->>'sortOrder')::integer)
    on conflict (id) do update set
      name = excluded.name,
      sort_order = excluded.sort_order;

    for v_val in select * from jsonb_array_elements(v_opt->'values') loop
      v_val_id := (v_val->>'id')::uuid;
      v_val_ids_to_keep := array_append(v_val_ids_to_keep, v_val_id);

      insert into public.product_option_values (id, product_option_id, value, sort_order)
      values (v_val_id, v_opt_id, v_val->>'value', (v_val->>'sortOrder')::integer)
      on conflict (id) do update set
        value = excluded.value,
        sort_order = excluded.sort_order;
    end loop;
  end loop;

  -- Cleanup removed option values
  delete from public.product_option_values 
  where product_option_id in (select id from public.product_options where product_id = p_product_id)
  and not (id = any(v_val_ids_to_keep));

  -- Cleanup removed options
  delete from public.product_options 
  where product_id = p_product_id
  and not (id = any(v_opt_ids_to_keep));

  -- 3. Upsert Variants
  for v_var in select * from jsonb_array_elements(v_variants) loop
    v_var_id := (v_var->>'id')::uuid;
    v_var_ids_to_keep := array_append(v_var_ids_to_keep, v_var_id);

    insert into public.product_variants (id, product_id, sku, stock_quantity, price_adjustment_paise, is_active, image_id)
    values (
      v_var_id,
      p_product_id,
      v_var->>'sku',
      (v_var->>'stockQuantity')::integer,
      (v_var->>'priceAdjustmentPaise')::integer,
      (v_var->>'isActive')::boolean,
      (v_var->>'imageId')::uuid
    )
    on conflict (id) do update set
      sku = excluded.sku,
      price_adjustment_paise = excluded.price_adjustment_paise,
      is_active = excluded.is_active,
      image_id = excluded.image_id,
      updated_at = now();

    -- In Milestone 5, stock adjustment during variant creation is allowed but edits MUST use manual_adjust_variant_stock.
    -- If variant existed, we do NOT update stock here. We omit stock from the update.

    -- Update join table
    delete from public.variant_option_values where variant_id = v_var_id;
    for v_opt_val_id in select jsonb_array_elements_text(v_var->'optionValueIds')::uuid loop
      insert into public.variant_option_values (variant_id, option_value_id)
      values (v_var_id, v_opt_val_id);
    end loop;
  end loop;

  -- 4. Archive removed variants (don't delete if they have stock > 0)
  for v_deleted_variant in 
    select id, stock_quantity from public.product_variants 
    where product_id = p_product_id and not (id = any(v_var_ids_to_keep))
  loop
    if v_deleted_variant.stock_quantity > 0 then
      update public.product_variants set is_active = false, updated_at = now() where id = v_deleted_variant.id;
    else
      delete from public.product_variants where id = v_deleted_variant.id;
    end if;
  end loop;

  -- Audit log
  insert into public.admin_audit_logs (admin_id, action, entity_type, entity_id, metadata)
  values (v_admin_id, 'save_product_tree', 'product', p_product_id, jsonb_build_object('payload_version', p_payload_version));

  v_cached_result := jsonb_build_object('success', true, 'product_id', p_product_id);

  insert into public.admin_mutation_idempotency (idempotency_key, admin_id, mutation_type, result)
  values (p_idempotency_key, v_admin_id, 'save_product_tree', v_cached_result);

  return v_cached_result;
end;
$$;
revoke all on function public.save_product_tree(uuid, timestamptz, integer, jsonb, uuid) from public, anon, authenticated;
grant execute on function public.save_product_tree(uuid, timestamptz, integer, jsonb, uuid) to authenticated;
