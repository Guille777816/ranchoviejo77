
-- Add extra fiscal/contact fields to site_settings
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS cuit text,
  ADD COLUMN IF NOT EXISTS province text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS hours text;

-- Add landing page fields to categories
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS landing_title text,
  ADD COLUMN IF NOT EXISTS landing_description text,
  ADD COLUMN IF NOT EXISTS landing_image_url text,
  ADD COLUMN IF NOT EXISTS landing_video_url text;

-- Home videos table
CREATE TABLE IF NOT EXISTS public.home_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  description text,
  video_url text NOT NULL,
  poster_url text,
  position int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.home_videos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_videos TO authenticated;
GRANT ALL ON public.home_videos TO service_role;

ALTER TABLE public.home_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read active videos"
  ON public.home_videos FOR SELECT
  USING (active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins manage videos"
  ON public.home_videos FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_home_videos_updated
  BEFORE UPDATE ON public.home_videos
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
