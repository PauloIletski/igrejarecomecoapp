CREATE TABLE public.site_hero_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true,
  image_url TEXT,
  image_alt TEXT NOT NULL DEFAULT 'Igreja Recomeço',
  image_title TEXT NOT NULL DEFAULT 'Igreja Recomeço',
  image_subtitle TEXT NOT NULL DEFAULT 'Lugar de adoracao',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT site_hero_settings_singleton CHECK (id = true)
);

ALTER TABLE public.site_hero_settings ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER site_hero_settings_updated_at
BEFORE UPDATE ON public.site_hero_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Public read site hero settings" ON public.site_hero_settings
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage site hero settings" ON public.site_hero_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.site_hero_settings (
  id,
  image_alt,
  image_title,
  image_subtitle
) VALUES (
  true,
  'Igreja Recomeço',
  'Igreja Recomeço',
  'Lugar de adoracao'
);
