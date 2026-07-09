ALTER TABLE public.events
ADD COLUMN registration_form_enabled BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE public.event_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  event_title TEXT NOT NULL,
  full_name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER event_registrations_updated_at BEFORE UPDATE ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Anyone can submit event registrations" ON public.event_registrations
  FOR INSERT TO anon, authenticated WITH CHECK (
    char_length(full_name) BETWEEN 2 AND 120
    AND char_length(whatsapp) BETWEEN 8 AND 40
    AND char_length(event_title) BETWEEN 1 AND 200
    AND (email IS NULL OR char_length(email) <= 255)
    AND EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_registrations.event_id
        AND events.title = event_registrations.event_title
        AND events.is_published = true
        AND events.registration_form_enabled = true
    )
  );

CREATE POLICY "Admins read event registrations" ON public.event_registrations
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update event registrations" ON public.event_registrations
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete event registrations" ON public.event_registrations
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
