CREATE TABLE public.home_visit_blocked_dates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocked_date DATE NOT NULL UNIQUE,
  reason TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.home_visit_blocked_dates ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER home_visit_blocked_dates_updated_at BEFORE UPDATE ON public.home_visit_blocked_dates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Public read active home visit blocked dates" ON public.home_visit_blocked_dates
  FOR SELECT TO anon, authenticated USING (is_active = true);

CREATE POLICY "Admins manage home visit blocked dates" ON public.home_visit_blocked_dates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
