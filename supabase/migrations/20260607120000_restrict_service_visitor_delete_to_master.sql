DROP POLICY IF EXISTS "Permission manage service visitors" ON public.service_visitors;

CREATE POLICY "Permission read service visitors" ON public.service_visitors
  FOR SELECT TO authenticated
  USING (public.has_permission(auth.uid(), 'service_visitors.manage'));

CREATE POLICY "Permission insert service visitors" ON public.service_visitors
  FOR INSERT TO authenticated
  WITH CHECK (public.has_permission(auth.uid(), 'service_visitors.manage'));

CREATE POLICY "Permission update service visitors" ON public.service_visitors
  FOR UPDATE TO authenticated
  USING (public.has_permission(auth.uid(), 'service_visitors.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'service_visitors.manage'));

CREATE POLICY "Master delete service visitors" ON public.service_visitors
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role::text = 'master'
    )
  );
