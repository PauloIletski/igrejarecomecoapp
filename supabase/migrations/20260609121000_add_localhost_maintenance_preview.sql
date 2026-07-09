ALTER TABLE public.site_maintenance_settings
ADD COLUMN IF NOT EXISTS show_content_on_localhost BOOLEAN NOT NULL DEFAULT false;
