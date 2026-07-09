CREATE TABLE public.donation_responsibles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  whatsapp_opt_in BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.donation_responsibles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER donation_responsibles_updated_at
BEFORE UPDATE ON public.donation_responsibles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Admins read donation responsibles" ON public.donation_responsibles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage donation responsibles" ON public.donation_responsibles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.donation_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  donation_pledge_id UUID NOT NULL REFERENCES public.donation_pledges(id) ON DELETE CASCADE,
  responsible_id UUID NOT NULL REFERENCES public.donation_responsibles(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT,
  provider_message_id TEXT,
  error_message TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (donation_pledge_id, responsible_id, channel)
);

ALTER TABLE public.donation_notifications ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER donation_notifications_updated_at
BEFORE UPDATE ON public.donation_notifications
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Admins read donation notifications" ON public.donation_notifications
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update donation notifications" ON public.donation_notifications
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.queue_donation_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.donation_notifications (donation_pledge_id, responsible_id)
  SELECT NEW.id, dr.id
  FROM public.donation_responsibles dr
  WHERE dr.is_active = true
    AND dr.whatsapp_opt_in = true
  ON CONFLICT (donation_pledge_id, responsible_id, channel) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS donation_pledges_queue_notifications ON public.donation_pledges;

CREATE TRIGGER donation_pledges_queue_notifications
AFTER INSERT ON public.donation_pledges
FOR EACH ROW
EXECUTE FUNCTION public.queue_donation_notifications();

INSERT INTO public.donation_responsibles (name, phone, notes)
VALUES
  ('Responsável Exemplo', '5511999999999', 'Substitua por um número real com DDI/DD D, sem espaços.')
ON CONFLICT DO NOTHING;
