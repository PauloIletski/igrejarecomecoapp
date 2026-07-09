INSERT INTO public.admin_permissions (key, label, group_label, sort_order)
VALUES ('service_visitors.manage', 'Gerenciar visitantes do culto', 'Comunidade', 85)
ON CONFLICT (key) DO UPDATE SET
  label = excluded.label,
  group_label = excluded.group_label,
  sort_order = excluded.sort_order;

CREATE TABLE public.service_visitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  visit_date DATE NOT NULL DEFAULT ((now() AT TIME ZONE 'America/Sao_Paulo')::date),
  contacted_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_visitors ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER service_visitors_updated_at BEFORE UPDATE ON public.service_visitors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Permission manage service visitors" ON public.service_visitors
  FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'service_visitors.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'service_visitors.manage'));
