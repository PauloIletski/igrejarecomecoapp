-- PRAYER PRAYING RECORDS (tracks who is praying for each prayer request)
CREATE TABLE public.prayer_praying_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prayer_request_id UUID NOT NULL REFERENCES public.prayer_requests(id) ON DELETE CASCADE,
  user_session_id TEXT NOT NULL, -- session identifier (anonymous user tracking)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (prayer_request_id, user_session_id)
);

ALTER TABLE public.prayer_praying_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view praying counts" ON public.prayer_praying_records
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anyone can add themselves as praying" ON public.prayer_praying_records
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Users can remove their own praying record" ON public.prayer_praying_records
  FOR DELETE TO anon, authenticated USING (true);
