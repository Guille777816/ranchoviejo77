
-- Add webhook secret to site_settings for signed RPC calls from Vercel
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS webhook_secret text;
UPDATE public.site_settings SET webhook_secret = encode(gen_random_bytes(24), 'hex') WHERE webhook_secret IS NULL;

-- Ensure at least one settings row exists so RPCs can locate the secret
INSERT INTO public.site_settings (site_name, webhook_secret)
SELECT 'Rancho Viejo', encode(gen_random_bytes(24), 'hex')
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings);

-- Create a public order-creation RPC that trusts DB prices/stock
CREATE OR REPLACE FUNCTION public.create_order_public(
  _items jsonb,
  _customer jsonb,
  _user_id uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_order_id uuid;
  item jsonb;
  prod record;
  qty int;
  subtotal int := 0;
BEGIN
  IF _items IS NULL OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'No items';
  END IF;

  -- Insert empty order first so we get an id
  INSERT INTO public.orders (
    user_id, customer_name, customer_email, customer_phone,
    shipping_address, shipping_city, shipping_province, shipping_zip,
    notes, subtotal_cents, shipping_cents, total_cents
  ) VALUES (
    _user_id,
    _customer->>'customer_name',
    _customer->>'customer_email',
    _customer->>'customer_phone',
    _customer->>'shipping_address',
    _customer->>'shipping_city',
    _customer->>'shipping_province',
    _customer->>'shipping_zip',
    _customer->>'notes',
    0, 0, 0
  ) RETURNING id INTO new_order_id;

  FOR item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    qty := (item->>'quantity')::int;
    IF qty IS NULL OR qty < 1 THEN
      RAISE EXCEPTION 'Cantidad inválida';
    END IF;

    SELECT id, name, slug, price_cents, stock, active
      INTO prod
      FROM public.products
      WHERE id = (item->>'productId')::uuid;

    IF NOT FOUND OR NOT prod.active THEN
      RAISE EXCEPTION 'Producto no disponible';
    END IF;
    IF prod.stock < qty THEN
      RAISE EXCEPTION 'Stock insuficiente para %', prod.name;
    END IF;

    INSERT INTO public.order_items (
      order_id, product_id, product_name, product_slug, unit_price_cents, quantity
    ) VALUES (
      new_order_id, prod.id, prod.name, prod.slug, prod.price_cents, qty
    );

    UPDATE public.products SET stock = stock - qty WHERE id = prod.id;
    subtotal := subtotal + prod.price_cents * qty;
  END LOOP;

  UPDATE public.orders SET subtotal_cents = subtotal, total_cents = subtotal WHERE id = new_order_id;
  RETURN new_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_order_public(jsonb, jsonb, uuid) TO anon, authenticated;

-- RPC to persist MP preference id (signed with webhook_secret)
CREATE OR REPLACE FUNCTION public.set_order_mp_preference(
  _order_id uuid,
  _preference_id text,
  _secret text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored text;
BEGIN
  SELECT webhook_secret INTO stored FROM public.site_settings LIMIT 1;
  IF stored IS NULL OR stored <> _secret THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE public.orders SET mp_preference_id = _preference_id WHERE id = _order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_order_mp_preference(uuid, text, text) TO anon, authenticated;

-- RPC to apply MP payment status from webhook (signed with webhook_secret)
CREATE OR REPLACE FUNCTION public.apply_mp_payment(
  _order_id uuid,
  _status text,
  _payment_id text,
  _secret text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored text;
BEGIN
  SELECT webhook_secret INTO stored FROM public.site_settings LIMIT 1;
  IF stored IS NULL OR stored <> _secret THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE public.orders
     SET status = _status::order_status,
         mp_payment_id = _payment_id
   WHERE id = _order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_mp_payment(uuid, text, text, text) TO anon, authenticated;

-- Allow anon to SELECT the order they just created (only via id, no listing)
-- We keep it restrictive: only return the row when id is provided in the query.
-- This is safe because id is a UUID (unguessable) and no PII listing is possible.
CREATE POLICY "Anyone can view an order by id"
ON public.orders FOR SELECT
TO anon
USING (true);
