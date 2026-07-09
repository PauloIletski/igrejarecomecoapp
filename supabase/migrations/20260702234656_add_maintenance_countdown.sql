ALTER TABLE public.site_maintenance_settings
ADD COLUMN IF NOT EXISTS countdown_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS countdown_target_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS draft_countdown_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS draft_countdown_target_at TIMESTAMPTZ;

UPDATE public.site_maintenance_settings
SET
  draft_countdown_enabled = COALESCE(draft_countdown_enabled, countdown_enabled),
  draft_countdown_target_at = COALESCE(draft_countdown_target_at, countdown_target_at);
