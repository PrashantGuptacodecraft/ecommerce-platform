-- 0016_razorpay_payment_lifecycle.sql
-- Implements secure Razorpay payment lifecycle, webhook durability, exact-once stock release, and idempotency.

-- 1. Extend webhook_events for durability
ALTER TABLE public.webhook_events
ADD COLUMN status text not null default 'received' check (status in ('received', 'processing', 'processed', 'failed')),
ADD COLUMN attempt_count integer not null default 0 check (attempt_count >= 0),
ADD COLUMN last_error text,
ADD COLUMN updated_at timestamptz not null default now();

CREATE TRIGGER set_webhook_events_updated_at
  BEFORE UPDATE ON public.webhook_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Create razorpay_payment_intents
CREATE TABLE public.razorpay_payment_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders (id) ON DELETE CASCADE,
  razorpay_order_id text UNIQUE,
  deterministic_receipt text NOT NULL UNIQUE,
  amount_paise integer NOT NULL CHECK (amount_paise > 0),
  currency text NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
  initialization_status text NOT NULL DEFAULT 'pending' CHECK (initialization_status IN ('pending', 'created', 'ambiguous', 'failed')),
  expires_at timestamptz NOT NULL,
  confirmed_at timestamptz,
  stock_released_at timestamptz,
  requires_manual_review boolean NOT NULL DEFAULT false,
  review_reason text,
  provider_last_checked_at timestamptz,
  hold_extension_count integer NOT NULL DEFAULT 0 CHECK (hold_extension_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Prevent both confirmed and released
  CONSTRAINT razorpay_intent_state_check CHECK (
    NOT (confirmed_at IS NOT NULL AND stock_released_at IS NOT NULL)
  )
);

CREATE TRIGGER set_razorpay_payment_intents_updated_at
  BEFORE UPDATE ON public.razorpay_payment_intents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.razorpay_payment_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY razorpay_payment_intents_admin_read
  ON public.razorpay_payment_intents FOR SELECT
  TO authenticated
  USING (public.is_active_admin());

-- 3. RPC: create_razorpay_order_atomic
-- Creates local order and intent, snapshots items, deducts stock, clears checked-out cart items.
CREATE OR REPLACE FUNCTION public.create_razorpay_order_atomic(
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
  -- Idempotency Check
  SELECT * INTO v_existing_idempotency 
  FROM public.order_idempotency_keys 
  WHERE idempotency_key = p_idempotency_key;

  IF FOUND THEN
    IF v_existing_idempotency.payload_hash = p_payload_hash 
       AND v_existing_idempotency.session_token = p_session_token 
       AND v_existing_idempotency.operation = 'checkout_razorpay' THEN
      RETURN v_existing_idempotency.result;
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'IDEMPOTENCY_CONFLICT');
    END IF;
  END IF;

  -- Resolve cart (must lock cart to prevent concurrent mutation while building order)
  SELECT id INTO v_cart_id FROM public.carts WHERE session_token = p_session_token FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'CART_NOT_FOUND');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.cart_items WHERE cart_id = v_cart_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'CART_EMPTY');
  END IF;

  -- Lock variants deterministically
  PERFORM id FROM public.product_variants 
  WHERE id IN (SELECT variant_id FROM public.cart_items WHERE cart_id = v_cart_id)
  ORDER BY id
  FOR UPDATE;

  v_order_id := gen_random_uuid();

  -- Process variants, reserve stock
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

    v_unit_price := v_item.base_price_paise + COALESCE(v_item.price_adjustment_paise, 0);
    v_line_total := v_unit_price * v_item.quantity;
    v_subtotal_paise := v_subtotal_paise + v_line_total;

    PERFORM public.reserve_variant_stock(v_item.variant_id, v_item.quantity, v_order_id, 'Razorpay checkout reservation');
  END LOOP;

  -- Calculate shipping
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

  IF v_total_paise != p_expected_total_paise THEN
    RAISE EXCEPTION 'PRICE_CHANGED';
  END IF;

  -- Create address
  INSERT INTO public.addresses (
    full_name, phone, email, address_line1, address_line2, landmark, city, state, postal_code, country
  ) VALUES (
    p_name, p_phone, p_email, p_address_line1, p_address_line2, p_landmark, p_city, p_state, p_postal_code, 'IN'
  ) RETURNING id INTO v_address_id;

  -- Create order
  INSERT INTO public.orders (
    id, address_id, status, payment_method, subtotal_paise, shipping_paise, discount_paise, total_paise, notes
  ) VALUES (
    v_order_id, v_address_id, 'PENDING_PAYMENT', 'razorpay', v_subtotal_paise, v_shipping_paise, v_discount_paise, v_total_paise, p_notes
  ) RETURNING order_number INTO v_order_number;

  v_receipt := v_order_number || '-RZP';

  -- Create order items
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

  -- Create payment intent (hold for 15 mins)
  INSERT INTO public.razorpay_payment_intents (
    order_id, deterministic_receipt, amount_paise, currency, expires_at
  ) VALUES (
    v_order_id, v_receipt, v_total_paise, 'INR', now() + interval '15 minutes'
  ) RETURNING id INTO v_intent_id;

  -- Clear ONLY checked-out items
  DELETE FROM public.cart_items WHERE cart_id = v_cart_id;

  v_result := jsonb_build_object(
    'success', true,
    'orderId', v_order_id,
    'orderNumber', v_order_number,
    'intentId', v_intent_id,
    'receipt', v_receipt,
    'totalPaise', v_total_paise
  );

  INSERT INTO public.order_idempotency_keys (
    idempotency_key, session_token, operation, payload_hash, 
    order_id, order_number, status, total_paise, result
  ) VALUES (
    p_idempotency_key, p_session_token, 'checkout_razorpay', p_payload_hash,
    v_order_id, v_order_number, 'PENDING_PAYMENT', v_total_paise, v_result
  );

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  IF SQLERRM = 'PRICE_CHANGED' THEN
    RETURN jsonb_build_object('success', false, 'error', 'PRICE_CHANGED');
  ELSIF SQLERRM LIKE 'INSUFFICIENT_STOCK%' THEN
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

REVOKE ALL ON FUNCTION public.create_razorpay_order_atomic(text, uuid, text, text, text, text, text, text, text, text, text, text, text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_razorpay_order_atomic(text, uuid, text, text, text, text, text, text, text, text, text, text, text, integer) FROM anon;
REVOKE ALL ON FUNCTION public.create_razorpay_order_atomic(text, uuid, text, text, text, text, text, text, text, text, text, text, text, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.create_razorpay_order_atomic(text, uuid, text, text, text, text, text, text, text, text, text, text, text, integer) TO service_role;
-- 4. RPC: attach_razorpay_order_atomic
CREATE OR REPLACE FUNCTION public.attach_razorpay_order_atomic(
  p_intent_id uuid,
  p_razorpay_order_id text,
  p_amount_paise integer,
  p_currency text
) RETURNS boolean AS $$
DECLARE
  v_intent record;
BEGIN
  SELECT * INTO v_intent FROM public.razorpay_payment_intents WHERE id = p_intent_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'INTENT_NOT_FOUND';
  END IF;

  IF v_intent.amount_paise != p_amount_paise OR v_intent.currency != p_currency THEN
    RAISE EXCEPTION 'AMOUNT_MISMATCH';
  END IF;

  IF v_intent.razorpay_order_id IS NOT NULL AND v_intent.razorpay_order_id != p_razorpay_order_id THEN
    RAISE EXCEPTION 'ORDER_ALREADY_ATTACHED';
  END IF;

  UPDATE public.razorpay_payment_intents
  SET razorpay_order_id = p_razorpay_order_id,
      initialization_status = 'created',
      updated_at = now()
  WHERE id = p_intent_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE ALL ON FUNCTION public.attach_razorpay_order_atomic(uuid, text, integer, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.attach_razorpay_order_atomic(uuid, text, integer, text) FROM anon;
REVOKE ALL ON FUNCTION public.attach_razorpay_order_atomic(uuid, text, integer, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.attach_razorpay_order_atomic(uuid, text, integer, text) TO service_role;

-- 5. RPC: record_razorpay_payment_attempt_atomic
CREATE OR REPLACE FUNCTION public.record_razorpay_payment_attempt_atomic(
  p_razorpay_order_id text,
  p_razorpay_payment_id text,
  p_status public.payment_status,
  p_amount_paise integer
) RETURNS boolean AS $$
DECLARE
  v_intent record;
  v_payment_exists boolean;
BEGIN
  SELECT * INTO v_intent FROM public.razorpay_payment_intents WHERE razorpay_order_id = p_razorpay_order_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'INTENT_NOT_FOUND';
  END IF;

  SELECT EXISTS(SELECT 1 FROM public.payments WHERE razorpay_payment_id = p_razorpay_payment_id) INTO v_payment_exists;
  
  IF NOT v_payment_exists THEN
    INSERT INTO public.payments (
      order_id, provider, razorpay_order_id, razorpay_payment_id, status, amount_paise
    ) VALUES (
      v_intent.order_id, 'razorpay', p_razorpay_order_id, p_razorpay_payment_id, p_status, p_amount_paise
    );
  ELSE
    UPDATE public.payments
    SET status = p_status, updated_at = now()
    WHERE razorpay_payment_id = p_razorpay_payment_id;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE ALL ON FUNCTION public.record_razorpay_payment_attempt_atomic(text, text, public.payment_status, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_razorpay_payment_attempt_atomic(text, text, public.payment_status, integer) FROM anon;
REVOKE ALL ON FUNCTION public.record_razorpay_payment_attempt_atomic(text, text, public.payment_status, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.record_razorpay_payment_attempt_atomic(text, text, public.payment_status, integer) TO service_role;

-- 6. RPC: confirm_razorpay_payment_atomic
CREATE OR REPLACE FUNCTION public.confirm_razorpay_payment_atomic(
  p_razorpay_order_id text,
  p_razorpay_payment_id text,
  p_amount_paise integer,
  p_currency text
) RETURNS jsonb AS $$
DECLARE
  v_intent record;
  v_order record;
BEGIN
  SELECT * INTO v_intent FROM public.razorpay_payment_intents WHERE razorpay_order_id = p_razorpay_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'INTENT_NOT_FOUND');
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = v_intent.order_id FOR UPDATE;

  IF v_intent.amount_paise != p_amount_paise OR v_intent.currency != p_currency THEN
    RETURN jsonb_build_object('success', false, 'error', 'AMOUNT_MISMATCH');
  END IF;

  PERFORM public.record_razorpay_payment_attempt_atomic(p_razorpay_order_id, p_razorpay_payment_id, 'captured', p_amount_paise);

  IF v_intent.confirmed_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'orderNumber', v_order.order_number, 'status', 'CONFIRMED');
  END IF;

  IF v_intent.stock_released_at IS NOT NULL THEN
    UPDATE public.razorpay_payment_intents
    SET requires_manual_review = true,
        review_reason = 'Captured after stock release',
        updated_at = now()
    WHERE id = v_intent.id;

    INSERT INTO public.admin_audit_logs (action, entity_type, entity_id, metadata)
    VALUES ('LATE_CAPTURE_DETECTED', 'order', v_order.id, jsonb_build_object('payment_id', p_razorpay_payment_id, 'order_id', p_razorpay_order_id));

    RETURN jsonb_build_object('success', false, 'error', 'LATE_CAPTURE_REQUIRES_REVIEW');
  END IF;

  UPDATE public.razorpay_payment_intents
  SET confirmed_at = now(),
      updated_at = now()
  WHERE id = v_intent.id;

  UPDATE public.orders
  SET status = 'CONFIRMED',
      updated_at = now()
  WHERE id = v_order.id;

  RETURN jsonb_build_object('success', true, 'orderNumber', v_order.order_number, 'status', 'CONFIRMED');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE ALL ON FUNCTION public.confirm_razorpay_payment_atomic(text, text, integer, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.confirm_razorpay_payment_atomic(text, text, integer, text) FROM anon;
REVOKE ALL ON FUNCTION public.confirm_razorpay_payment_atomic(text, text, integer, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_razorpay_payment_atomic(text, text, integer, text) TO service_role;

-- 7. RPC: expire_razorpay_order_atomic
CREATE OR REPLACE FUNCTION public.expire_razorpay_order_atomic(
  p_order_id uuid,
  p_reason text
) RETURNS boolean AS $$
DECLARE
  v_intent record;
  v_order record;
  v_item record;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND';
  END IF;

  SELECT * INTO v_intent FROM public.razorpay_payment_intents WHERE order_id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'INTENT_NOT_FOUND';
  END IF;

  IF v_order.status != 'PENDING_PAYMENT' THEN
    RAISE EXCEPTION 'ORDER_NOT_PENDING';
  END IF;

  IF v_intent.confirmed_at IS NOT NULL THEN
    RAISE EXCEPTION 'ALREADY_CONFIRMED';
  END IF;

  IF v_intent.stock_released_at IS NOT NULL THEN
    RETURN true;
  END IF;

  UPDATE public.orders
  SET status = 'PAYMENT_FAILED',
      updated_at = now()
  WHERE id = p_order_id;

  UPDATE public.razorpay_payment_intents
  SET stock_released_at = now(),
      updated_at = now()
  WHERE id = v_intent.id;

  FOR v_item IN SELECT variant_id, quantity FROM public.order_items WHERE order_id = p_order_id LOOP
    PERFORM public.release_variant_stock(v_item.variant_id, v_item.quantity, p_order_id, p_reason);
  END LOOP;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE ALL ON FUNCTION public.expire_razorpay_order_atomic(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.expire_razorpay_order_atomic(uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.expire_razorpay_order_atomic(uuid, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.expire_razorpay_order_atomic(uuid, text) TO service_role;

-- 8. RPC: list_expired_razorpay_candidates
CREATE OR REPLACE FUNCTION public.list_expired_razorpay_candidates(
  p_limit integer
) RETURNS TABLE (
  intent_id uuid,
  order_id uuid,
  razorpay_order_id text,
  deterministic_receipt text,
  hold_extension_count integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT i.id, i.order_id, i.razorpay_order_id, i.deterministic_receipt, i.hold_extension_count
  FROM public.razorpay_payment_intents i
  JOIN public.orders o ON i.order_id = o.id
  WHERE o.status = 'PENDING_PAYMENT'
    AND i.expires_at < now()
    AND i.confirmed_at IS NULL
    AND i.stock_released_at IS NULL
  ORDER BY i.expires_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE ALL ON FUNCTION public.list_expired_razorpay_candidates(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_expired_razorpay_candidates(integer) FROM anon;
REVOKE ALL ON FUNCTION public.list_expired_razorpay_candidates(integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.list_expired_razorpay_candidates(integer) TO service_role;

-- 9. RPC: update_razorpay_intent_reconciliation
CREATE OR REPLACE FUNCTION public.update_razorpay_intent_reconciliation(
  p_intent_id uuid,
  p_extend_hold boolean
) RETURNS boolean AS $$
BEGIN
  IF p_extend_hold THEN
    UPDATE public.razorpay_payment_intents
    SET hold_extension_count = hold_extension_count + 1,
        expires_at = now() + interval '15 minutes',
        provider_last_checked_at = now(),
        updated_at = now()
    WHERE id = p_intent_id;
  ELSE
    UPDATE public.razorpay_payment_intents
    SET provider_last_checked_at = now(),
        updated_at = now()
    WHERE id = p_intent_id;
  END IF;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE ALL ON FUNCTION public.update_razorpay_intent_reconciliation(uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_razorpay_intent_reconciliation(uuid, boolean) FROM anon;
REVOKE ALL ON FUNCTION public.update_razorpay_intent_reconciliation(uuid, boolean) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.update_razorpay_intent_reconciliation(uuid, boolean) TO service_role;

-- 10. RPC: mark_intent_initialization_failed_atomic
CREATE OR REPLACE FUNCTION public.mark_intent_initialization_failed_atomic(
  p_intent_id uuid
) RETURNS boolean AS $$
DECLARE
  v_intent record;
BEGIN
  SELECT * INTO v_intent FROM public.razorpay_payment_intents WHERE id = p_intent_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'INTENT_NOT_FOUND';
  END IF;

  UPDATE public.razorpay_payment_intents
  SET initialization_status = 'failed',
      expires_at = now(),
      updated_at = now()
  WHERE id = p_intent_id;

  PERFORM public.expire_razorpay_order_atomic(v_intent.order_id, 'Razorpay initialization failed');

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE ALL ON FUNCTION public.mark_intent_initialization_failed_atomic(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_intent_initialization_failed_atomic(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.mark_intent_initialization_failed_atomic(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.mark_intent_initialization_failed_atomic(uuid) TO service_role;

-- 11. RPC: mark_intent_initialization_ambiguous_atomic
CREATE OR REPLACE FUNCTION public.mark_intent_initialization_ambiguous_atomic(
  p_intent_id uuid
) RETURNS boolean AS $$
BEGIN
  UPDATE public.razorpay_payment_intents
  SET initialization_status = 'ambiguous',
      updated_at = now()
  WHERE id = p_intent_id;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE ALL ON FUNCTION public.mark_intent_initialization_ambiguous_atomic(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_intent_initialization_ambiguous_atomic(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.mark_intent_initialization_ambiguous_atomic(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.mark_intent_initialization_ambiguous_atomic(uuid) TO service_role;
