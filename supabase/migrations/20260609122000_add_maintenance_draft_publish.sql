ALTER TABLE public.site_maintenance_settings
ADD COLUMN IF NOT EXISTS preview_draft_on_localhost BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS draft_title TEXT,
ADD COLUMN IF NOT EXISTS draft_message TEXT,
ADD COLUMN IF NOT EXISTS draft_instagram_url TEXT;

ALTER TABLE public.site_maintenance_settings
ALTER COLUMN show_content_on_localhost SET DEFAULT false;

UPDATE public.site_maintenance_settings
SET
  show_content_on_localhost = false,
  draft_title = COALESCE(draft_title, title),
  draft_message = COALESCE(draft_message, message),
  draft_instagram_url = COALESCE(draft_instagram_url, instagram_url);
