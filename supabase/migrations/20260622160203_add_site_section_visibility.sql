INSERT INTO public.admin_permissions (key, label, group_label, sort_order)
VALUES ('sections.manage', 'Gerenciar visibilidade das seções', 'Conteúdo do site', 125)
ON CONFLICT (key) DO UPDATE SET
  label = excluded.label,
  group_label = excluded.group_label,
  sort_order = excluded.sort_order;

CREATE TABLE public.site_section_visibility (
  section_key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT site_section_visibility_key_format
    CHECK (section_key ~ '^[a-z][a-z0-9_]*$')
);

ALTER TABLE public.site_section_visibility ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER site_section_visibility_updated_at
BEFORE UPDATE ON public.site_section_visibility
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Public read site section visibility"
ON public.site_section_visibility
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Permission manage site section visibility"
ON public.site_section_visibility
FOR ALL TO authenticated
USING (public.has_permission(auth.uid(), 'sections.manage'))
WITH CHECK (public.has_permission(auth.uid(), 'sections.manage'));

GRANT SELECT ON public.site_section_visibility TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_section_visibility TO authenticated;

INSERT INTO public.site_section_visibility (section_key, label, sort_order)
VALUES
  ('hero', 'Hero', 10),
  ('about', 'Nossa essência', 20),
  ('agenda', 'Agenda', 30),
  ('events', 'Eventos', 40),
  ('campaigns', 'Campanhas', 50),
  ('pastors', 'Pastores', 60),
  ('ministries', 'Ministérios', 70),
  ('prayer', 'Pedido de oração', 80),
  ('public_prayers', 'Mural de orações', 90),
  ('donations', 'Doações de alimentos', 100),
  ('tithes_offerings', 'Dízimos e ofertas', 110),
  ('home_visits', 'Visitas aos lares', 120),
  ('locations', 'Localidades e mapa', 130),
  ('invitation', 'Convite final', 140),
  ('footer', 'Rodapé', 150)
ON CONFLICT (section_key) DO NOTHING;
