INSERT INTO public.admin_permissions (key, label, group_label, sort_order)
VALUES ('tapume.manage', 'Gerenciar tapume do site', 'Conteúdo do site', 135)
ON CONFLICT (key) DO UPDATE SET
  label = excluded.label,
  group_label = excluded.group_label,
  sort_order = excluded.sort_order;

CREATE TABLE public.site_maintenance_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT false,
  title TEXT NOT NULL DEFAULT 'Voltamos em breve',
  message TEXT NOT NULL DEFAULT 'Enquanto isso, siga-nos no Instagram.',
  instagram_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT site_maintenance_settings_singleton CHECK (id = true)
);

ALTER TABLE public.site_maintenance_settings ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER site_maintenance_settings_updated_at
BEFORE UPDATE ON public.site_maintenance_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Public read site maintenance settings" ON public.site_maintenance_settings
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Permission manage site maintenance settings" ON public.site_maintenance_settings
  FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'tapume.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'tapume.manage'));

INSERT INTO public.site_maintenance_settings (
  id,
  is_active,
  title,
  message
) VALUES (
  true,
  false,
  'Voltamos em breve',
  'Enquanto isso, siga-nos no Instagram.'
);
