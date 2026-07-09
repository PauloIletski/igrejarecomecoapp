ALTER TABLE public.events
ADD COLUMN detail_page_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN detail_hero_image_url TEXT,
ADD COLUMN detail_content TEXT,
ADD COLUMN cta_label TEXT,
ADD COLUMN cta_url TEXT,
ADD COLUMN secondary_cta_label TEXT,
ADD COLUMN secondary_cta_url TEXT;
