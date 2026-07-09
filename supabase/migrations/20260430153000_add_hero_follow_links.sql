ALTER TABLE public.site_hero_settings
  ADD COLUMN follow_title TEXT NOT NULL DEFAULT 'Siga-nos',
  ADD COLUMN instagram_url TEXT,
  ADD COLUMN facebook_url TEXT,
  ADD COLUMN youtube_url TEXT,
  ADD COLUMN whatsapp_url TEXT;
