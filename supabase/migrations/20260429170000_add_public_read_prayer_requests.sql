-- ADD PUBLIC READ POLICY FOR PRAYER REQUESTS
CREATE POLICY "Public read allowed prayers" ON public.prayer_requests
  FOR SELECT TO anon, authenticated USING (allow_public = true);
