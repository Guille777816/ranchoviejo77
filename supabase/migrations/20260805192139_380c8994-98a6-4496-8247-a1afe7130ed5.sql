CREATE TABLE IF NOT EXISTS public.app_secrets (
  key text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.app_secrets TO service_role;
ALTER TABLE public.app_secrets ENABLE ROW LEVEL SECURITY;

INSERT INTO public.app_secrets (key, value)
SELECT 'mp_webhook_secret', webhook_secret FROM public.site_settings
WHERE webhook_secret IS NOT NULL
LIMIT 1
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

CREATE OR REPLACE FUNCTION public.apply_mp_payment(_order_id uuid, _status text, _payment_id text, _secret text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored text;
BEGIN
  SELECT value INTO stored FROM public.app_secrets WHERE key = 'mp_webhook_secret';
  IF stored IS NULL OR stored <> _secret THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE public.orders
     SET status = _status::order_status,
         mp_payment_id = _payment_id
   WHERE id = _order_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_order_mp_preference(_order_id uuid, _preference_id text, _secret text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored text;
BEGIN
  SELECT value INTO stored FROM public.app_secrets WHERE key = 'mp_webhook_secret';
  IF stored IS NULL OR stored <> _secret THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE public.orders SET mp_preference_id = _preference_id WHERE id = _order_id;
END;
$$;

ALTER TABLE public.site_settings DROP COLUMN IF EXISTS webhook_secret;