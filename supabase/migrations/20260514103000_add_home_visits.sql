CREATE TABLE public.home_visit_responsibles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.home_visit_responsibles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER home_visit_responsibles_updated_at BEFORE UPDATE ON public.home_visit_responsibles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Admins manage home visit responsibles" ON public.home_visit_responsibles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.home_visit_settings (
  id BOOLEAN NOT NULL DEFAULT true PRIMARY KEY,
  max_visits_per_day INT NOT NULL DEFAULT 3 CHECK (max_visits_per_day > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT home_visit_settings_singleton CHECK (id = true)
);

ALTER TABLE public.home_visit_settings ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER home_visit_settings_updated_at BEFORE UPDATE ON public.home_visit_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Public read home visit settings" ON public.home_visit_settings
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins manage home visit settings" ON public.home_visit_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.home_visit_settings (id, max_visits_per_day)
VALUES (true, 3)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE public.home_visit_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  preferred_date DATE,
  scheduled_date DATE,
  responsible_id UUID REFERENCES public.home_visit_responsibles(id) ON DELETE SET NULL,
  notes TEXT,
  admin_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.home_visit_requests ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER home_visit_requests_updated_at BEFORE UPDATE ON public.home_visit_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Anyone can submit home visit requests" ON public.home_visit_requests
  FOR INSERT TO anon, authenticated WITH CHECK (
    char_length(name) BETWEEN 2 AND 120
    AND char_length(address) BETWEEN 5 AND 500
    AND char_length(whatsapp) BETWEEN 8 AND 40
    AND (notes IS NULL OR char_length(notes) <= 1000)
    AND status = 'pending'
    AND responsible_id IS NULL
    AND scheduled_date IS NULL
    AND admin_notes IS NULL
  );

CREATE POLICY "Admins manage home visit requests" ON public.home_visit_requests
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
