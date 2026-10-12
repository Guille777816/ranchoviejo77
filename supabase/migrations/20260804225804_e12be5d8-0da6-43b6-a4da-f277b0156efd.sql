ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_dni text;

CREATE OR REPLACE FUNCTION public.create_order_public(_items jsonb, _customer jsonb, _user_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  INSERT INTO public.orders (
    user_id, customer_name, customer_email, customer_phone, customer_dni,
    shipping_address, shipping_city, shipping_province, shipping_zip,
    notes, subtotal_cents, shipping_cents, total_cents
  ) VALUES (
    _user_id,
    _customer->>'customer_name',
    _customer->>'customer_email',
    _customer->>'customer_phone',
    _customer->>'customer_dni',
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
$function$;