-- 0018_customer_auth.sql
-- Implements customer authentication linkage, cart merging, and enforces ownership on checkout.

-- 1. Add auth_user_id to customers
ALTER TABLE public.customers 
ADD COLUMN auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Enforce one active cart per customer
CREATE UNIQUE INDEX carts_customer_id_unique_idx ON public.carts (customer_id) WHERE customer_id IS NOT NULL;

-- 3. RLS for Customers to read their own data
DROP POLICY IF EXISTS customers_admin_read ON public.customers;
CREATE POLICY customers_read_own 
  ON public.customers FOR SELECT 
  TO authenticated 
  USING (auth_user_id = auth.uid() OR public.is_active_admin());

DROP POLICY IF EXISTS addresses_admin_read ON public.addresses;
CREATE POLICY addresses_read_own 
  ON public.addresses FOR SELECT 
  TO authenticated 
  USING (customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid()) OR public.is_active_admin());

-- Add policy to read own orders
CREATE POLICY orders_read_own 
  ON public.orders FOR SELECT 
  TO authenticated 
  USING (customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid()) OR public.is_active_admin());

-- Add policy to read own order_items
CREATE POLICY order_items_read_own 
  ON public.order_items FOR SELECT 
  TO authenticated 
  USING (order_id IN (SELECT id FROM public.orders WHERE customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid())) OR public.is_active_admin());

-- 4. Cart Merge RPC
CREATE OR REPLACE FUNCTION public.merge_guest_cart_to_customer_atomic(
  p_session_token TEXT,
  p_auth_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_customer_id UUID;
  v_guest_cart_id UUID;
  v_customer_cart_id UUID;
  v_guest_item RECORD;
  v_existing_qty INTEGER;
  v_stock_quantity INTEGER;
  v_new_qty INTEGER;
  v_warnings TEXT[] := '{}';
BEGIN
  -- Resolve Customer
  SELECT id INTO v_customer_id FROM public.customers WHERE auth_user_id = p_auth_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'CUSTOMER_NOT_FOUND';
  END IF;

  -- Resolve Guest Cart (Lock it)
  SELECT id INTO v_guest_cart_id FROM public.carts WHERE session_token = p_session_token FOR UPDATE;
  
  -- Resolve Customer Cart (Lock it)
  SELECT id INTO v_customer_cart_id FROM public.carts WHERE customer_id = v_customer_id FOR UPDATE;

  -- Scenario A: Guest has no cart. Do nothing.
  IF v_guest_cart_id IS NULL THEN
    RETURN jsonb_build_object('success', true, 'warnings', v_warnings);
  END IF;

  -- Scenario B: Customer has no cart. Assign guest cart to customer.
  IF v_customer_cart_id IS NULL THEN
    UPDATE public.carts SET customer_id = v_customer_id WHERE id = v_guest_cart_id;
    RETURN jsonb_build_object('success', true, 'warnings', v_warnings);
  END IF;

  -- Scenario C: Both have carts. Merge guest items into customer cart safely.
  IF v_guest_cart_id = v_customer_cart_id THEN
    -- Already merged (Idempotent callback retry)
    RETURN jsonb_build_object('success', true, 'warnings', v_warnings);
  END IF;

  FOR v_guest_item IN SELECT * FROM public.cart_items WHERE cart_id = v_guest_cart_id
  LOOP
    -- Lock variant to check stock
    SELECT stock_quantity INTO v_stock_quantity FROM public.product_variants WHERE id = v_guest_item.variant_id FOR SHARE;

    SELECT quantity INTO v_existing_qty FROM public.cart_items WHERE cart_id = v_customer_cart_id AND variant_id = v_guest_item.variant_id;
    
    IF FOUND THEN
      v_new_qty := v_existing_qty + v_guest_item.quantity;
      IF v_new_qty > v_stock_quantity THEN
        v_new_qty := v_stock_quantity;
        v_warnings := array_append(v_warnings, 'Item quantity reduced due to stock limits.');
      END IF;
      UPDATE public.cart_items SET quantity = v_new_qty WHERE cart_id = v_customer_cart_id AND variant_id = v_guest_item.variant_id;
    ELSE
      v_new_qty := v_guest_item.quantity;
      IF v_new_qty > v_stock_quantity THEN
        v_new_qty := v_stock_quantity;
        v_warnings := array_append(v_warnings, 'Item quantity reduced due to stock limits.');
      END IF;
      IF v_new_qty > 0 THEN
        INSERT INTO public.cart_items (cart_id, variant_id, quantity) VALUES (v_customer_cart_id, v_guest_item.variant_id, v_new_qty);
      END IF;
    END IF;
  END LOOP;

  -- Delete guest cart now that merge is complete
  DELETE FROM public.carts WHERE id = v_guest_cart_id;

  RETURN jsonb_build_object('success', true, 'warnings', v_warnings);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE ALL ON FUNCTION public.merge_guest_cart_to_customer_atomic(TEXT, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.merge_guest_cart_to_customer_atomic(TEXT, UUID) FROM anon;
REVOKE ALL ON FUNCTION public.merge_guest_cart_to_customer_atomic(TEXT, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.merge_guest_cart_to_customer_atomic(TEXT, UUID) TO service_role;


-- 5. Drop old unauthenticated RPCs
DROP FUNCTION IF EXISTS public.create_cod_order_atomic(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_razorpay_order_atomic(text, uuid, text, text, text, text, text, text, text, text, text, text, text, integer);

-- 6. New Authenticated COD RPC
CREATE OR REPLACE FUNCTION public.create_cod_order_atomic(
  p_auth_user_id UUID,
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
  v_customer_id UUID;
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
  -- Resolve Customer
  SELECT id INTO v_customer_id FROM public.customers WHERE auth_user_id = p_auth_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

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
      RETURN jsonb_build_object('success', false, 'error', 'IDEMPOTENCY_CONFLICT');
    END IF;
  END IF;

  -- 2. Resolve cart (Use customer_id for secure cart access)
  SELECT id INTO v_cart_id FROM public.carts WHERE customer_id = v_customer_id AND session_token = p_session_token FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'CART_NOT_FOUND');
  END IF;

  -- 3. Reject empty cart
  IF NOT EXISTS (SELECT 1 FROM public.cart_items WHERE cart_id = v_cart_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'CART_EMPTY');
  END IF;

  -- 4. Deterministic locking
  PERFORM id FROM public.product_variants 
  WHERE id IN (SELECT variant_id FROM public.cart_items WHERE cart_id = v_cart_id)
  ORDER BY id
  FOR UPDATE;

  v_order_id := gen_random_uuid();

  -- 5. Process variants
  FOR v_item IN 
    SELECT 
      ci.variant_id, ci.quantity, v.sku, v.price_adjustment_paise, v.is_active AS variant_active,
      p.id AS product_id, p.base_price_paise, p.is_active AS product_active
    FROM public.cart_items ci
    JOIN public.product_variants v ON ci.variant_id = v.id
    JOIN public.products p ON v.product_id = p.id
    WHERE ci.cart_id = v_cart_id
  LOOP
    IF NOT v_item.product_active THEN RAISE EXCEPTION 'PRODUCT_INACTIVE'; END IF;
    IF NOT v_item.variant_active THEN RAISE EXCEPTION 'VARIANT_INACTIVE'; END IF;
    IF v_item.quantity <= 0 THEN RAISE EXCEPTION 'INVALID_QUANTITY'; END IF;

    v_unit_price := v_item.base_price_paise + COALESCE(v_item.price_adjustment_paise, 0);
    v_line_total := v_unit_price * v_item.quantity;
    v_subtotal_paise := v_subtotal_paise + v_line_total;

    PERFORM public.reserve_variant_stock(v_item.variant_id, v_item.quantity, v_order_id, 'COD checkout reservation');
  END LOOP;

  -- 6. Calculate shipping
  SELECT value INTO v_shipping_settings FROM public.store_settings WHERE key = 'shipping';
  IF FOUND AND v_shipping_settings IS NOT NULL THEN
    v_flat_rate := COALESCE((v_shipping_settings->>'flat_rate_paise')::INTEGER, 0);
    v_free_threshold := COALESCE((v_shipping_settings->>'free_shipping_threshold_paise')::INTEGER, 0);
  END IF;
  IF v_free_threshold > 0 AND v_subtotal_paise >= v_free_threshold THEN v_shipping_paise := 0; ELSE v_shipping_paise := v_flat_rate; END IF;

  v_total_paise := v_subtotal_paise + v_shipping_paise - v_discount_paise;

  -- 7. Create address (Linked to customer)
  INSERT INTO public.addresses (
    customer_id, full_name, phone, email, address_line1, address_line2, landmark, city, state, postal_code, country
  ) VALUES (
    v_customer_id, p_name, p_phone, p_email, p_address_line1, p_address_line2, p_landmark, p_city, p_state, p_postal_code, 'IN'
  ) RETURNING id INTO v_address_id;

  -- 8. Create order (Linked to customer)
  INSERT INTO public.orders (
    id, customer_id, address_id, status, payment_method, subtotal_paise, shipping_paise, discount_paise, total_paise, notes
  ) VALUES (
    v_order_id, v_customer_id, v_address_id, 'PENDING_CONFIRMATION', 'cod', v_subtotal_paise, v_shipping_paise, v_discount_paise, v_total_paise, p_notes
  ) RETURNING order_number INTO v_order_number;

  -- 9. Create order items
  INSERT INTO public.order_items (
    order_id, product_id, variant_id, product_name_snapshot, product_slug_snapshot,
    product_image_snapshot, sku_snapshot, size_snapshot, colour_snapshot,
    unit_price_paise_snapshot, quantity, line_total_paise
  )
  SELECT 
    v_order_id, p.id, v.id, p.name, p.slug,
    (SELECT storage_path FROM public.product_images WHERE product_id = p.id AND is_primary = true LIMIT 1),
    v.sku,
    (SELECT pov.value FROM public.variant_option_values vov JOIN public.product_option_values pov ON vov.option_value_id = pov.id JOIN public.product_options po ON pov.product_option_id = po.id WHERE vov.variant_id = v.id AND po.name ILIKE 'size' LIMIT 1),
    (SELECT pov.value FROM public.variant_option_values vov JOIN public.product_option_values pov ON vov.option_value_id = pov.id JOIN public.product_options po ON pov.product_option_id = po.id WHERE vov.variant_id = v.id AND po.name ILIKE 'colour' LIMIT 1),
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
  v_result := jsonb_build_object('success', true, 'orderId', v_order_id, 'orderNumber', v_order_number, 'status', 'PENDING_CONFIRMATION', 'subtotalPaise', v_subtotal_paise, 'shippingPaise', v_shipping_paise, 'discountPaise', v_discount_paise, 'totalPaise', v_total_paise);
  INSERT INTO public.order_idempotency_keys (idempotency_key, session_token, operation, payload_hash, order_id, order_number, status, total_paise, result) VALUES (p_idempotency_key, p_session_token, 'checkout_cod', p_payload_hash, v_order_id, v_order_number, 'PENDING_CONFIRMATION', v_total_paise, v_result);

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  IF SQLERRM LIKE 'INSUFFICIENT_STOCK%' THEN RETURN jsonb_build_object('success', false, 'error', 'INSUFFICIENT_STOCK');
  ELSIF SQLERRM LIKE 'VARIANT_NOT_FOUND%' OR SQLERRM LIKE 'VARIANT_INACTIVE%' THEN RETURN jsonb_build_object('success', false, 'error', 'VARIANT_INACTIVE');
  ELSIF SQLERRM = 'PRODUCT_INACTIVE' THEN RETURN jsonb_build_object('success', false, 'error', 'PRODUCT_INACTIVE');
  ELSIF SQLERRM = 'VARIANT_INACTIVE' THEN RETURN jsonb_build_object('success', false, 'error', 'VARIANT_INACTIVE');
  ELSIF SQLERRM = 'INVALID_QUANTITY' THEN RETURN jsonb_build_object('success', false, 'error', 'INVALID_QUANTITY');
  ELSIF SQLERRM = 'UNAUTHORIZED' THEN RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED');
  ELSE RETURN jsonb_build_object('success', false, 'error', 'ORDER_CREATION_FAILED'); END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE ALL ON FUNCTION public.create_cod_order_atomic(UUID, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_cod_order_atomic(UUID, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.create_cod_order_atomic(UUID, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.create_cod_order_atomic(UUID, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;

-- 7. New Authenticated Razorpay RPC
CREATE OR REPLACE FUNCTION public.create_razorpay_order_atomic(
  p_auth_user_id UUID,
  p_session_token text,
  p_idempotency_key uuid,
  p_payload_hash text,
  p_name text,
  p_email text,
  p_phone text,
  p_address_line1 text,
  p_address_line2 text,
  p_landmark text,
  p_city text,
  p_state text,
  p_postal_code text,
  p_notes text,
  p_expected_total_paise integer
) RETURNS jsonb AS $$
DECLARE
  v_customer_id UUID;
  v_cart_id uuid;
  v_existing_idempotency record;
  v_item record;
  v_subtotal_paise integer := 0;
  v_shipping_paise integer := 0;
  v_discount_paise integer := 0;
  v_total_paise integer := 0;
  v_shipping_settings jsonb;
  v_flat_rate integer := 0;
  v_free_threshold integer := 0;
  v_address_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_intent_id uuid;
  v_receipt text;
  v_result jsonb;
  v_unit_price integer;
  v_line_total integer;
BEGIN
  SELECT id INTO v_customer_id FROM public.customers WHERE auth_user_id = p_auth_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'UNAUTHORIZED'; END IF;

  SELECT * INTO v_existing_idempotency FROM public.order_idempotency_keys WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN
    IF v_existing_idempotency.payload_hash = p_payload_hash AND v_existing_idempotency.session_token = p_session_token AND v_existing_idempotency.operation = 'checkout_razorpay' THEN
      RETURN v_existing_idempotency.result;
    ELSE RETURN jsonb_build_object('success', false, 'error', 'IDEMPOTENCY_CONFLICT'); END IF;
  END IF;

  SELECT id INTO v_cart_id FROM public.carts WHERE customer_id = v_customer_id AND session_token = p_session_token FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'CART_NOT_FOUND'); END IF;

  IF NOT EXISTS (SELECT 1 FROM public.cart_items WHERE cart_id = v_cart_id) THEN RETURN jsonb_build_object('success', false, 'error', 'CART_EMPTY'); END IF;

  PERFORM id FROM public.product_variants WHERE id IN (SELECT variant_id FROM public.cart_items WHERE cart_id = v_cart_id) ORDER BY id FOR UPDATE;

  v_order_id := gen_random_uuid();

  FOR v_item IN SELECT ci.variant_id, ci.quantity, v.sku, v.price_adjustment_paise, v.is_active AS variant_active, p.id AS product_id, p.base_price_paise, p.is_active AS product_active FROM public.cart_items ci JOIN public.product_variants v ON ci.variant_id = v.id JOIN public.products p ON v.product_id = p.id WHERE ci.cart_id = v_cart_id
  LOOP
    IF NOT v_item.product_active THEN RAISE EXCEPTION 'PRODUCT_INACTIVE'; END IF;
    IF NOT v_item.variant_active THEN RAISE EXCEPTION 'VARIANT_INACTIVE'; END IF;
    IF v_item.quantity <= 0 THEN RAISE EXCEPTION 'INVALID_QUANTITY'; END IF;

    v_unit_price := v_item.base_price_paise + COALESCE(v_item.price_adjustment_paise, 0);
    v_line_total := v_unit_price * v_item.quantity;
    v_subtotal_paise := v_subtotal_paise + v_line_total;

    PERFORM public.reserve_variant_stock(v_item.variant_id, v_item.quantity, v_order_id, 'Razorpay checkout reservation');
  END LOOP;

  SELECT value INTO v_shipping_settings FROM public.store_settings WHERE key = 'shipping';
  IF FOUND AND v_shipping_settings IS NOT NULL THEN v_flat_rate := COALESCE((v_shipping_settings->>'flat_rate_paise')::INTEGER, 0); v_free_threshold := COALESCE((v_shipping_settings->>'free_shipping_threshold_paise')::INTEGER, 0); END IF;
  IF v_free_threshold > 0 AND v_subtotal_paise >= v_free_threshold THEN v_shipping_paise := 0; ELSE v_shipping_paise := v_flat_rate; END IF;

  v_total_paise := v_subtotal_paise + v_shipping_paise - v_discount_paise;
  IF v_total_paise != p_expected_total_paise THEN RAISE EXCEPTION 'PRICE_CHANGED'; END IF;

  INSERT INTO public.addresses (customer_id, full_name, phone, email, address_line1, address_line2, landmark, city, state, postal_code, country) VALUES (v_customer_id, p_name, p_phone, p_email, p_address_line1, p_address_line2, p_landmark, p_city, p_state, p_postal_code, 'IN') RETURNING id INTO v_address_id;

  INSERT INTO public.orders (id, customer_id, address_id, status, payment_method, subtotal_paise, shipping_paise, discount_paise, total_paise, notes) VALUES (v_order_id, v_customer_id, v_address_id, 'PENDING_PAYMENT', 'razorpay', v_subtotal_paise, v_shipping_paise, v_discount_paise, v_total_paise, p_notes) RETURNING order_number INTO v_order_number;

  v_receipt := v_order_number || '-RZP';

  INSERT INTO public.order_items (order_id, product_id, variant_id, product_name_snapshot, product_slug_snapshot, product_image_snapshot, sku_snapshot, size_snapshot, colour_snapshot, unit_price_paise_snapshot, quantity, line_total_paise)
  SELECT v_order_id, p.id, v.id, p.name, p.slug, (SELECT storage_path FROM public.product_images WHERE product_id = p.id AND is_primary = true LIMIT 1), v.sku, (SELECT pov.value FROM public.variant_option_values vov JOIN public.product_option_values pov ON vov.option_value_id = pov.id JOIN public.product_options po ON pov.product_option_id = po.id WHERE vov.variant_id = v.id AND po.name ILIKE 'size' LIMIT 1), (SELECT pov.value FROM public.variant_option_values vov JOIN public.product_option_values pov ON vov.option_value_id = pov.id JOIN public.product_options po ON pov.product_option_id = po.id WHERE vov.variant_id = v.id AND po.name ILIKE 'colour' LIMIT 1), (p.base_price_paise + COALESCE(v.price_adjustment_paise, 0)), ci.quantity, (p.base_price_paise + COALESCE(v.price_adjustment_paise, 0)) * ci.quantity FROM public.cart_items ci JOIN public.product_variants v ON ci.variant_id = v.id JOIN public.products p ON v.product_id = p.id WHERE ci.cart_id = v_cart_id;

  INSERT INTO public.razorpay_payment_intents (order_id, deterministic_receipt, amount_paise, currency, expires_at) VALUES (v_order_id, v_receipt, v_total_paise, 'INR', now() + interval '15 minutes') RETURNING id INTO v_intent_id;

  DELETE FROM public.cart_items WHERE cart_id = v_cart_id;

  v_result := jsonb_build_object('success', true, 'orderId', v_order_id, 'orderNumber', v_order_number, 'intentId', v_intent_id, 'receipt', v_receipt, 'totalPaise', v_total_paise);
  INSERT INTO public.order_idempotency_keys (idempotency_key, session_token, operation, payload_hash, order_id, order_number, status, total_paise, result) VALUES (p_idempotency_key, p_session_token, 'checkout_razorpay', p_payload_hash, v_order_id, v_order_number, 'PENDING_PAYMENT', v_total_paise, v_result);

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  IF SQLERRM = 'PRICE_CHANGED' THEN RETURN jsonb_build_object('success', false, 'error', 'PRICE_CHANGED');
  ELSIF SQLERRM LIKE 'INSUFFICIENT_STOCK%' THEN RETURN jsonb_build_object('success', false, 'error', 'INSUFFICIENT_STOCK');
  ELSIF SQLERRM LIKE 'VARIANT_NOT_FOUND%' OR SQLERRM LIKE 'VARIANT_INACTIVE%' THEN RETURN jsonb_build_object('success', false, 'error', 'VARIANT_INACTIVE');
  ELSIF SQLERRM = 'PRODUCT_INACTIVE' THEN RETURN jsonb_build_object('success', false, 'error', 'PRODUCT_INACTIVE');
  ELSIF SQLERRM = 'VARIANT_INACTIVE' THEN RETURN jsonb_build_object('success', false, 'error', 'VARIANT_INACTIVE');
  ELSIF SQLERRM = 'INVALID_QUANTITY' THEN RETURN jsonb_build_object('success', false, 'error', 'INVALID_QUANTITY');
  ELSIF SQLERRM = 'UNAUTHORIZED' THEN RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED');
  ELSE RETURN jsonb_build_object('success', false, 'error', 'ORDER_CREATION_FAILED'); END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE ALL ON FUNCTION public.create_razorpay_order_atomic(UUID, text, uuid, text, text, text, text, text, text, text, text, text, text, text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_razorpay_order_atomic(UUID, text, uuid, text, text, text, text, text, text, text, text, text, text, text, integer) FROM anon;
REVOKE ALL ON FUNCTION public.create_razorpay_order_atomic(UUID, text, uuid, text, text, text, text, text, text, text, text, text, text, text, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.create_razorpay_order_atomic(UUID, text, uuid, text, text, text, text, text, text, text, text, text, text, text, integer) TO service_role;
