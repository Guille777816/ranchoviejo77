CREATE TABLE public.product_variants (
  id uuid not null default gen_random_uuid() primary key,
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  image_url text not null,
  position integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);
GRANT SELECT ON public.product_variants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;
GRANT ALL ON public.product_variants TO service_role;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view product variants" ON public.product_variants FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can manage product variants" ON public.product_variants FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();