INSERT INTO public.admin_permissions (key, label, group_label, sort_order)
VALUES ('transparency.manage', 'Gerenciar transparência financeira', 'Conteúdo do site', 128)
ON CONFLICT (key) DO UPDATE SET label = excluded.label, group_label = excluded.group_label, sort_order = excluded.sort_order;

CREATE TABLE public.transparency_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  allocated_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (allocated_amount >= 0),
  is_paid BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transparency_expenses ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER transparency_expenses_updated_at
BEFORE UPDATE ON public.transparency_expenses
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX transparency_expenses_sort_order_idx
ON public.transparency_expenses (sort_order, created_at DESC);

CREATE POLICY "Public read transparency expenses"
ON public.transparency_expenses FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Permission manage transparency expenses"
ON public.transparency_expenses FOR ALL TO authenticated
USING (public.has_permission(auth.uid(), 'transparency.manage'))
WITH CHECK (public.has_permission(auth.uid(), 'transparency.manage'));

GRANT SELECT ON public.transparency_expenses TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.transparency_expenses TO authenticated;
