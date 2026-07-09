CREATE TABLE public.tithes_offerings_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  recipient_name TEXT,
  pix_key TEXT,
  bank_info TEXT,
  qr_code_url TEXT,
  bible_verse TEXT,
  button_label TEXT NOT NULL DEFAULT 'Copiar chave PIX',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tithes_offerings_methods ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER tithes_offerings_methods_updated_at
BEFORE UPDATE ON public.tithes_offerings_methods
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Public read active tithes offerings methods" ON public.tithes_offerings_methods
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins manage tithes offerings methods" ON public.tithes_offerings_methods
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.tithes_offerings_methods (
  title,
  description,
  recipient_name,
  pix_key,
  bible_verse,
  button_label,
  sort_order,
  is_featured
) VALUES (
  'PIX da igreja',
  'Contribua com dízimos e ofertas usando a chave oficial da igreja.',
  'Igreja Recomeço',
  'pix@recomecochurch.org',
  'Trazei todos os dízimos à casa do tesouro. Malaquias 3:10',
  'Copiar chave PIX',
  10,
  true
);
