
DROP POLICY IF EXISTS "Anyone can view an order by id" ON public.orders;

CREATE OR REPLACE FUNCTION public.get_order_public(_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', o.id,
    'status', o.status,
    'customer_name', o.customer_name,
    'total_cents', o.total_cents,
    'subtotal_cents', o.subtotal_cents,
    'shipping_cents', o.shipping_cents,
    'created_at', o.created_at,
    'order_items', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'product_name', oi.product_name,
        'quantity', oi.quantity,
        'unit_price_cents', oi.unit_price_cents
      )) FROM public.order_items oi WHERE oi.order_id = o.id),
      '[]'::jsonb
    )
  )
  INTO result
  FROM public.orders o
  WHERE o.id = _order_id;
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_order_public(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_public(uuid) TO anon, authenticated;
