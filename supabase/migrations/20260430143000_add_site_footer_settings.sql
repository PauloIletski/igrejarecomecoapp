CREATE TABLE public.site_footer_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true,
  brand_name TEXT NOT NULL DEFAULT 'Igreja Recomeço',
  description TEXT NOT NULL DEFAULT 'Lugar de adoracao, comunhao e servico. Voce e bem-vindo na Igreja Recomeço.',
  address TEXT,
  phone TEXT,
  email TEXT,
  instagram_url TEXT,
  facebook_url TEXT,
  youtube_url TEXT,
  whatsapp_url TEXT,
  copyright_text TEXT NOT NULL DEFAULT 'Igreja Recomeço. Todos os direitos reservados.',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT site_footer_settings_singleton CHECK (id = true)
);

ALTER TABLE public.site_footer_settings ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER site_footer_settings_updated_at
BEFORE UPDATE ON public.site_footer_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Public read site footer settings" ON public.site_footer_settings
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage site footer settings" ON public.site_footer_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.site_footer_settings (
  id,
  brand_name,
  description,
  address,
  phone,
  email,
  copyright_text
) VALUES (
  true,
  'Igreja Recomeço',
  'Lugar de adoracao, comunhao e servico. Voce e bem-vindo na Igreja Recomeço.',
  'Rua Exemplo, 123 - Bairro, Cidade/UF',
  '(00) 0000-0000',
  'contato@recomecochurch.com',
  'Igreja Recomeço. Todos os direitos reservados.'
);
