INSERT INTO public.admin_permissions (key, label, group_label, sort_order)
VALUES ('mobile_buttons.manage', 'Gerenciar botões flutuantes mobile', 'Conteúdo do site', 145)
ON CONFLICT (key) DO UPDATE SET
  label = excluded.label,
  group_label = excluded.group_label,
  sort_order = excluded.sort_order;

CREATE TABLE public.site_mobile_floating_buttons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  href TEXT NOT NULL,
  icon_name TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_mobile_floating_buttons ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER site_mobile_floating_buttons_updated_at
BEFORE UPDATE ON public.site_mobile_floating_buttons
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY public_read_mobile_floating_buttons ON public.site_mobile_floating_buttons
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY permission_manage_mobile_floating_buttons ON public.site_mobile_floating_buttons
  FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'mobile_buttons.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'mobile_buttons.manage'));

INSERT INTO public.site_mobile_floating_buttons (label, href, icon_name, is_active, sort_order)
VALUES ('Orações', '#mural-de-oracoes', 'hand-heart', true, 0);
