-- 0013_atomic_guest_cart_mutations.sql
-- Add atomic RPC for adding to cart and cart idempotency.

-- ===========================================================================
-- cart_idempotency_keys
-- ===========================================================================
CREATE TABLE public.cart_idempotency_keys (
  idempotency_key UUID PRIMARY KEY,
  session_token TEXT NOT NULL REFERENCES public.carts(session_token) ON DELETE CASCADE,
  operation_hash TEXT NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cart_idempotency_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY cart_idempotency_admin_read
  ON public.cart_idempotency_keys FOR SELECT
  TO authenticated
  USING (public.is_active_admin());

-- ===========================================================================
-- upsert_cart_item_atomic (Add to Cart)
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.upsert_cart_item_atomic(
  p_session_token TEXT,
  p_variant_id UUID,
  p_quantity INTEGER,
  p_idempotency_key UUID
) RETURNS JSONB AS $$
DECLARE
  v_cart_id UUID;
  v_stock_quantity INTEGER;
  v_is_active BOOLEAN;
  v_product_is_active BOOLEAN;
  v_current_cart_qty INTEGER;
  v_new_qty INTEGER;
  v_existing_idempotency RECORD;
  v_payload_hash TEXT;
  v_result JSONB;
BEGIN
  -- 1. Idempotency Check
  v_payload_hash := md5(p_session_token || p_variant_id::text || p_quantity::text);

  SELECT * INTO v_existing_idempotency 
  FROM public.cart_idempotency_keys 
  WHERE idempotency_key = p_idempotency_key;

  IF FOUND THEN
    IF v_existing_idempotency.operation_hash = v_payload_hash AND v_existing_idempotency.session_token = p_session_token THEN
      RETURN v_existing_idempotency.result;
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'IDEMPOTENCY_CONFLICT');
    END IF;
  END IF;

  -- 2. Validate input
  IF p_quantity <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_QUANTITY');
  END IF;

  -- 3. Resolve or create cart
  SELECT id INTO v_cart_id FROM public.carts WHERE session_token = p_session_token;
  IF NOT FOUND THEN
    INSERT INTO public.carts (session_token) VALUES (p_session_token) RETURNING id INTO v_cart_id;
  END IF;

  -- 4. Load and lock product variant (compatible with reservation)
  SELECT 
    v.is_active, 
    v.stock_quantity,
    p.is_active
  INTO 
    v_is_active, 
    v_stock_quantity,
    v_product_is_active
  FROM public.product_variants v
  JOIN public.products p ON v.product_id = p.id
  WHERE v.id = p_variant_id
  FOR SHARE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'VARIANT_INACTIVE');
  END IF;

  IF NOT v_product_is_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'PRODUCT_INACTIVE');
  END IF;

  IF NOT v_is_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'VARIANT_INACTIVE');
  END IF;

  IF v_stock_quantity <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'OUT_OF_STOCK');
  END IF;

  -- 5. Calculate existing quantity
  SELECT quantity INTO v_current_cart_qty FROM public.cart_items WHERE cart_id = v_cart_id AND variant_id = p_variant_id;
  IF NOT FOUND THEN
    v_current_cart_qty := 0;
  END IF;

  v_new_qty := v_current_cart_qty + p_quantity;

  -- 6. Reject if exceeding stock
  IF v_new_qty > v_stock_quantity THEN
    RETURN jsonb_build_object('success', false, 'error', 'INSUFFICIENT_STOCK');
  END IF;

  -- 7. Atomically insert or increment
  INSERT INTO public.cart_items (cart_id, variant_id, quantity)
  VALUES (v_cart_id, p_variant_id, p_quantity)
  ON CONFLICT (cart_id, variant_id)
  DO UPDATE SET quantity = public.cart_items.quantity + EXCLUDED.quantity
  RETURNING quantity INTO v_new_qty;

  v_result := jsonb_build_object('success', true, 'quantity', v_new_qty);

  -- 8. Save idempotency
  INSERT INTO public.cart_idempotency_keys (idempotency_key, session_token, operation_hash, result)
  VALUES (p_idempotency_key, p_session_token, v_payload_hash, v_result);

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', 'UNKNOWN_ERROR');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE ALL ON FUNCTION public.upsert_cart_item_atomic(TEXT, UUID, INTEGER, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upsert_cart_item_atomic(TEXT, UUID, INTEGER, UUID) FROM anon;
REVOKE ALL ON FUNCTION public.upsert_cart_item_atomic(TEXT, UUID, INTEGER, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_cart_item_atomic(TEXT, UUID, INTEGER, UUID) TO service_role;
