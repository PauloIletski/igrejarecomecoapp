INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-media',
  'site-media',
  true,
  8388608,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

CREATE OR REPLACE FUNCTION public.can_manage_site_media(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_master(_user_id)
    OR EXISTS (
      SELECT 1
      FROM public.admin_profiles
      WHERE user_id = _user_id
        AND is_active = true
    )
$$;

CREATE POLICY "Public read site media" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'site-media');

CREATE POLICY "Admins upload site media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'site-media'
    AND public.can_manage_site_media(auth.uid())
  );

CREATE POLICY "Admins update site media" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'site-media'
    AND public.can_manage_site_media(auth.uid())
  )
  WITH CHECK (
    bucket_id = 'site-media'
    AND public.can_manage_site_media(auth.uid())
  );

CREATE POLICY "Admins delete site media" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'site-media'
    AND public.can_manage_site_media(auth.uid())
  );
