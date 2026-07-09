CREATE TABLE public.church_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_name TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  service_hours TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  maps_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.church_locations ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER church_locations_updated_at
BEFORE UPDATE ON public.church_locations
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Public read active church locations" ON public.church_locations
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins manage church locations" ON public.church_locations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.church_locations (
  unit_name,
  city,
  address,
  phone,
  email,
  service_hours,
  latitude,
  longitude,
  maps_url,
  sort_order
) VALUES
  (
    'Igreja Recomeço Sede',
    'São Paulo, SP',
    'Rua Exemplo, 123 - Bairro Central, São Paulo/SP',
    '(11) 0000-0000',
    'contato@recomecochurch.com',
    'Domingo: 9h e 18h30 · Quarta: 20h',
    -23.55052,
    -46.633308,
    'https://www.google.com/maps/search/?api=1&query=-23.55052,-46.633308',
    20
  ),
  (
    'Igreja Recomeço Campinas',
    'Campinas, SP',
    'Av. Modelo, 456 - Jardim Esperança, Campinas/SP',
    '(19) 0000-0000',
    'campinas@recomecochurch.com',
    'Domingo: 10h · Sexta: 20h',
    -22.90556,
    -47.06083,
    'https://www.google.com/maps/search/?api=1&query=-22.90556,-47.06083',
    10
  );
