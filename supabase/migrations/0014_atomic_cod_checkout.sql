-- 0014_atomic_cod_checkout.sql
-- Atomic order creation for COD, including order idempotency and deterministic stock locking.

-- ===========================================================================
-- order_idempotency_keys
-- ===========================================================================
CREATE TABLE public.order_idempotency_keys (
  idempotency_key UUID PRIMARY KEY,
  session_token TEXT NOT NULL,
  operation TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  order_number TEXT,
  status TEXT,
  total_paise INTEGER,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique boundary covers session token, operation, and idempotency key
CREATE UNIQUE INDEX order_idempotency_unique_idx ON public.order_idempotency_keys(session_token, operation, idempotency_key);

ALTER TABLE public.order_idempotency_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY order_idempotency_admin_read
  ON public.order_idempotency_keys FOR SELECT
  TO authenticated
  USING (public.is_active_admin());

-- ===========================================================================
-- create_cod_order_atomic
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.create_cod_order_atomic(
  p_session_token TEXT,
  p_idempotency_key UUID,
  p_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_address_line1 TEXT,
  p_address_line2 TEXT,
  p_landmark TEXT,
  p_city TEXT,
  p_state TEXT,
  p_postal_code TEXT,
  p_notes TEXT,
  p_payload_hash TEXT
) RETURNS JSONB AS $$
DECLARE
  v_cart_id UUID;
  v_existing_idempotency RECORD;
  v_item RECORD;
  v_subtotal_paise INTEGER := 0;
  v_shipping_paise INTEGER := 0;
  v_discount_paise INTEGER := 0;
  v_total_paise INTEGER := 0;
  v_shipping_settings JSONB;
  v_flat_rate INTEGER := 0;
  v_free_threshold INTEGER := 0;
  v_address_id UUID;
  v_order_id UUID;
  v_order_number TEXT;
  v_result JSONB;
  v_unit_price INTEGER;
  v_line_total INTEGER;
BEGIN
  -- 1. Idempotency Check
  SELECT * INTO v_existing_idempotency 
  FROM public.order_idempotency_keys 
  WHERE idempotency_key = p_idempotency_key;

  IF FOUND THEN
    IF v_existing_idempotency.payload_hash = p_payload_hash 
       AND v_existing_idempotency.session_token = p_session_token 
       AND v_existing_idempotency.operation = 'checkout_cod' THEN
      RETURN v_existing_idempotency.result;
    ELSE
      -- Returning here is safe as no state mutations occurred yet
      RETURN jsonb_build_object('success', false, 'error', 'IDEMPOTENCY_CONFLICT');
    END IF;
  END IF;

  -- 2. Resolve cart
  SELECT id INTO v_cart_id FROM public.carts WHERE session_token = p_session_token;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'CART_NOT_FOUND');
  END IF;

  -- 3. Reject empty cart
  IF NOT EXISTS (SELECT 1 FROM public.cart_items WHERE cart_id = v_cart_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'CART_EMPTY');
  END IF;

  -- 4. Deterministic locking of variants to prevent deadlocks
  -- Lock all variants involved in the cart in order of their UUIDs
  PERFORM id FROM public.product_variants 
  WHERE id IN (SELECT variant_id FROM public.cart_items WHERE cart_id = v_cart_id)
  ORDER BY id
  FOR UPDATE;

  v_order_id := gen_random_uuid();

  -- 5. Process variants, validate, calculate totals, and reserve stock
  FOR v_item IN 
    SELECT 
      ci.variant_id, 
      ci.quantity,
      v.sku, 
      v.price_adjustment_paise, 
      v.is_active AS variant_active,
      p.id AS product_id,
      p.base_price_paise,
      p.is_active AS product_active
    FROM public.cart_items ci
    JOIN public.product_variants v ON ci.variant_id = v.id
    JOIN public.products p ON v.product_id = p.id
    WHERE ci.cart_id = v_cart_id
  LOOP
    IF NOT v_item.product_active THEN
      RAISE EXCEPTION 'PRODUCT_INACTIVE';
    END IF;

    IF NOT v_item.variant_active THEN
      RAISE EXCEPTION 'VARIANT_INACTIVE';
    END IF;

    IF v_item.quantity <= 0 THEN
      RAISE EXCEPTION 'INVALID_QUANTITY';
    END IF;

    -- Calculate exact unit price natively
    v_unit_price := v_item.base_price_paise + COALESCE(v_item.price_adjustment_paise, 0);
    v_line_total := v_unit_price * v_item.quantity;
    v_subtotal_paise := v_subtotal_paise + v_line_total;

    -- Reserve stock. If this fails, it raises an exception which we catch in the outer block,
    -- automatically rolling back this entire function's transactions up to this point.
    PERFORM public.reserve_variant_stock(v_item.variant_id, v_item.quantity, v_order_id, 'COD checkout reservation');
  END LOOP;

  -- 6. Calculate shipping
  SELECT value INTO v_shipping_settings FROM public.store_settings WHERE key = 'shipping';
  IF FOUND AND v_shipping_settings IS NOT NULL THEN
    v_flat_rate := COALESCE((v_shipping_settings->>'flat_rate_paise')::INTEGER, 0);
    v_free_threshold := COALESCE((v_shipping_settings->>'free_shipping_threshold_paise')::INTEGER, 0);
  END IF;

  IF v_free_threshold > 0 AND v_subtotal_paise >= v_free_threshold THEN
    v_shipping_paise := 0;
  ELSE
    v_shipping_paise := v_flat_rate;
  END IF;

  v_total_paise := v_subtotal_paise + v_shipping_paise - v_discount_paise;

  -- 7. Create address
  INSERT INTO public.addresses (
    full_name, phone, email, address_line1, address_line2, landmark, city, state, postal_code, country
  ) VALUES (
    p_name, p_phone, p_email, p_address_line1, p_address_line2, p_landmark, p_city, p_state, p_postal_code, 'IN'
  ) RETURNING id INTO v_address_id;

  -- 8. Create order
  INSERT INTO public.orders (
    id, address_id, status, payment_method, subtotal_paise, shipping_paise, discount_paise, total_paise, notes
  ) VALUES (
    v_order_id, v_address_id, 'PENDING_CONFIRMATION', 'cod', v_subtotal_paise, v_shipping_paise, v_discount_paise, v_total_paise, p_notes
  ) RETURNING order_number INTO v_order_number;

  -- 9. Create order items
  INSERT INTO public.order_items (
    order_id, product_id, variant_id, product_name_snapshot, product_slug_snapshot,
    product_image_snapshot, sku_snapshot, size_snapshot, colour_snapshot,
    unit_price_paise_snapshot, quantity, line_total_paise
  )
  SELECT 
    v_order_id,
    p.id,
    v.id,
    p.name,
    p.slug,
    (SELECT storage_path FROM public.product_images WHERE product_id = p.id AND is_primary = true LIMIT 1),
    v.sku,
    (
        SELECT pov.value
        FROM public.variant_option_values vov
        JOIN public.product_option_values pov ON vov.option_value_id = pov.id
        JOIN public.product_options po ON pov.product_option_id = po.id
        WHERE vov.variant_id = v.id AND po.name ILIKE 'size' LIMIT 1
    ),
    (
        SELECT pov.value
        FROM public.variant_option_values vov
        JOIN public.product_option_values pov ON vov.option_value_id = pov.id
        JOIN public.product_options po ON pov.product_option_id = po.id
        WHERE vov.variant_id = v.id AND po.name ILIKE 'colour' LIMIT 1
    ),
    (p.base_price_paise + COALESCE(v.price_adjustment_paise, 0)),
    ci.quantity,
    (p.base_price_paise + COALESCE(v.price_adjustment_paise, 0)) * ci.quantity
  FROM public.cart_items ci
  JOIN public.product_variants v ON ci.variant_id = v.id
  JOIN public.products p ON v.product_id = p.id
  WHERE ci.cart_id = v_cart_id;

  -- 10. Clear cart
  DELETE FROM public.cart_items WHERE cart_id = v_cart_id;

  -- 11. Record idempotency and result
  v_result := jsonb_build_object(
    'success', true,
    'orderId', v_order_id,
    'orderNumber', v_order_number,
    'status', 'PENDING_CONFIRMATION',
    'subtotalPaise', v_subtotal_paise,
    'shippingPaise', v_shipping_paise,
    'discountPaise', v_discount_paise,
    'totalPaise', v_total_paise
  );

  INSERT INTO public.order_idempotency_keys (
    idempotency_key, session_token, operation, payload_hash, 
    order_id, order_number, status, total_paise, result
  ) VALUES (
    p_idempotency_key, p_session_token, 'checkout_cod', p_payload_hash,
    v_order_id, v_order_number, 'PENDING_CONFIRMATION', v_total_paise, v_result
  );

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  -- Catch-all for unexpected DB errors to avoid exposing raw SQL details.
  -- By catching at this outermost block, Postgres automatically rolls back
  -- everything that happened inside this function (including stock reservations).
  
  -- We parse SQLERRM to map to our safe errors.
  IF SQLERRM LIKE 'INSUFFICIENT_STOCK%' THEN
    RETURN jsonb_build_object('success', false, 'error', 'INSUFFICIENT_STOCK');
  ELSIF SQLERRM LIKE 'VARIANT_NOT_FOUND%' OR SQLERRM LIKE 'VARIANT_INACTIVE%' THEN
    RETURN jsonb_build_object('success', false, 'error', 'VARIANT_INACTIVE');
  ELSIF SQLERRM = 'PRODUCT_INACTIVE' THEN
    RETURN jsonb_build_object('success', false, 'error', 'PRODUCT_INACTIVE');
  ELSIF SQLERRM = 'VARIANT_INACTIVE' THEN
    RETURN jsonb_build_object('success', false, 'error', 'VARIANT_INACTIVE');
  ELSIF SQLERRM = 'INVALID_QUANTITY' THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_QUANTITY');
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'ORDER_CREATION_FAILED');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE ALL ON FUNCTION public.create_cod_order_atomic(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_cod_order_atomic(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.create_cod_order_atomic(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.create_cod_order_atomic(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;
