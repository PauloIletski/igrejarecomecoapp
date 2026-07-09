INSERT INTO public.admin_permissions (key, label, group_label, sort_order)
VALUES ('header.manage', 'Gerenciar menu e logo', 'Conteúdo do site', 122)
ON CONFLICT (key) DO UPDATE SET
  label = excluded.label,
  group_label = excluded.group_label,
  sort_order = excluded.sort_order;

CREATE TABLE public.site_header_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true,
  logo_url TEXT,
  logo_alt TEXT NOT NULL DEFAULT 'Igreja Recomeço — Deus recomeça histórias',
  mobile_logo_width_px INTEGER NOT NULL DEFAULT 192,
  desktop_logo_width_px INTEGER NOT NULL DEFAULT 244,
  show_prayer_badge BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT site_header_settings_singleton CHECK (id = true),
  CONSTRAINT site_header_logo_widths_positive CHECK (
    mobile_logo_width_px BETWEEN 160 AND 220
    AND desktop_logo_width_px BETWEEN 220 AND 260
  )
);

ALTER TABLE public.site_header_settings ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER site_header_settings_updated_at
BEFORE UPDATE ON public.site_header_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Public read site header settings"
ON public.site_header_settings
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Permission manage site header settings"
ON public.site_header_settings
FOR ALL TO authenticated
USING (public.has_permission(auth.uid(), 'header.manage'))
WITH CHECK (public.has_permission(auth.uid(), 'header.manage'));

GRANT SELECT ON public.site_header_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_header_settings TO authenticated;

INSERT INTO public.site_header_settings (id)
VALUES (true)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE public.site_header_nav_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  href TEXT NOT NULL,
  section_key TEXT,
  parent_label TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT site_header_nav_item_label_not_blank CHECK (length(trim(label)) > 0),
  CONSTRAINT site_header_nav_item_href_not_blank CHECK (length(trim(href)) > 0),
  CONSTRAINT site_header_nav_item_section_key_format CHECK (
    section_key IS NULL OR section_key ~ '^[a-z][a-z0-9_]*$'
  ),
  CONSTRAINT site_header_nav_item_parent_not_blank CHECK (
    parent_label IS NULL OR length(trim(parent_label)) > 0
  )
);

ALTER TABLE public.site_header_nav_items ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER site_header_nav_items_updated_at
BEFORE UPDATE ON public.site_header_nav_items
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Public read site header nav items"
ON public.site_header_nav_items
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Permission manage site header nav items"
ON public.site_header_nav_items
FOR ALL TO authenticated
USING (public.has_permission(auth.uid(), 'header.manage'))
WITH CHECK (public.has_permission(auth.uid(), 'header.manage'));

GRANT SELECT ON public.site_header_nav_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_header_nav_items TO authenticated;

INSERT INTO public.site_header_nav_items (label, href, section_key, parent_label, sort_order)
VALUES
  ('Nossa igreja', '#sobre', 'about', NULL, 10),
  ('Agenda', '#agenda', 'agenda', NULL, 20),
  ('Eventos', '#eventos', 'events', NULL, 30),
  ('Campanhas', '#campanhas', 'campaigns', NULL, 40),
  ('Álbuns', '#albums', 'albums', NULL, 50),
  ('Ministérios', '#ministerios', 'ministries', NULL, 60),
  ('Pedido de oração', '#oracao', 'prayer', 'Orações', 70),
  ('Mural de orações', '#mural-de-oracoes', 'public_prayers', 'Orações', 80),
  ('Doações de alimentos', '#doacao', 'donations', 'Contribuir', 90),
  ('Dízimos e Ofertas', '#dizimos-ofertas', 'tithes_offerings', 'Contribuir', 100),
  ('Transparência', '/transparencia', 'transparency', 'Contribuir', 110),
  ('Encontre-nos', '#endereco', 'locations', NULL, 120)
ON CONFLICT DO NOTHING;
