ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'master';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ministry_user';

CREATE TABLE public.admin_profiles (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER admin_profiles_updated_at BEFORE UPDATE ON public.admin_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.admin_profiles (user_id, email)
SELECT id, email FROM auth.users
ON CONFLICT (user_id) DO UPDATE SET email = excluded.email;

CREATE OR REPLACE FUNCTION public.create_admin_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (user_id) DO UPDATE SET email = excluded.email;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auth_users_create_admin_profile ON auth.users;
CREATE TRIGGER auth_users_create_admin_profile
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.create_admin_profile();

CREATE TABLE public.admin_ministries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_ministries ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER admin_ministries_updated_at BEFORE UPDATE ON public.admin_ministries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.admin_permissions (
  key TEXT NOT NULL PRIMARY KEY,
  label TEXT NOT NULL,
  group_label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.admin_ministry_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ministry_id UUID NOT NULL REFERENCES public.admin_ministries(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL REFERENCES public.admin_permissions(key) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ministry_id, permission_key)
);

ALTER TABLE public.admin_ministry_permissions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.admin_user_ministries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ministry_id UUID NOT NULL REFERENCES public.admin_ministries(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, ministry_id)
);

ALTER TABLE public.admin_user_ministries ENABLE ROW LEVEL SECURITY;

INSERT INTO public.admin_permissions (key, label, group_label, sort_order) VALUES
  ('dashboard.view', 'Ver visão geral', 'Resumo', 10),
  ('agenda.manage', 'Gerenciar agenda', 'Operação', 20),
  ('events.manage', 'Gerenciar eventos', 'Operação', 30),
  ('campaigns.manage', 'Gerenciar campanhas', 'Operação', 40),
  ('visits.manage', 'Gerenciar visitas', 'Operação', 50),
  ('prayers.manage', 'Gerenciar pedidos de oração', 'Comunidade', 60),
  ('donations.manage', 'Gerenciar doações', 'Comunidade', 70),
  ('tithes.manage', 'Gerenciar dízimos e ofertas', 'Comunidade', 80),
  ('pastors.manage', 'Gerenciar pastores', 'Conteúdo do site', 90),
  ('ministries.manage', 'Gerenciar ministérios públicos', 'Conteúdo do site', 100),
  ('locations.manage', 'Gerenciar localidades', 'Conteúdo do site', 110),
  ('hero.manage', 'Gerenciar hero', 'Conteúdo do site', 120),
  ('footer.manage', 'Gerenciar rodapé', 'Conteúdo do site', 130),
  ('users.manage', 'Gerenciar usuários', 'Acessos', 140),
  ('access.manage', 'Gerenciar acessos por ministério', 'Acessos', 150)
ON CONFLICT (key) DO UPDATE SET
  label = excluded.label,
  group_label = excluded.group_label,
  sort_order = excluded.sort_order;

CREATE OR REPLACE FUNCTION public.is_master(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('master', 'admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_master(_user_id)
    OR EXISTS (
      SELECT 1
      FROM public.admin_user_ministries aum
      JOIN public.admin_ministries am ON am.id = aum.ministry_id AND am.is_active = true
      JOIN public.admin_ministry_permissions amp ON amp.ministry_id = am.id
      JOIN public.admin_profiles ap ON ap.user_id = aum.user_id AND ap.is_active = true
      WHERE aum.user_id = _user_id
        AND amp.permission_key = _permission_key
    )
$$;

CREATE OR REPLACE FUNCTION public.get_my_admin_access()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'roles', COALESCE((
      SELECT jsonb_agg(role::text ORDER BY role::text)
      FROM public.user_roles
      WHERE user_id = auth.uid()
    ), '[]'::jsonb),
    'permissions', COALESCE((
      SELECT jsonb_agg(DISTINCT permission_key ORDER BY permission_key)
      FROM (
        SELECT permission_key
        FROM public.admin_user_ministries aum
        JOIN public.admin_ministries am ON am.id = aum.ministry_id AND am.is_active = true
        JOIN public.admin_ministry_permissions amp ON amp.ministry_id = am.id
        JOIN public.admin_profiles ap ON ap.user_id = aum.user_id AND ap.is_active = true
        WHERE aum.user_id = auth.uid()
        UNION
        SELECT key AS permission_key
        FROM public.admin_permissions
        WHERE public.is_master(auth.uid())
      ) permissions
    ), '[]'::jsonb),
    'ministries', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', am.id, 'name', am.name) ORDER BY am.name)
      FROM public.admin_user_ministries aum
      JOIN public.admin_ministries am ON am.id = aum.ministry_id
      WHERE aum.user_id = auth.uid()
    ), '[]'::jsonb),
    'is_master', public.is_master(auth.uid())
  )
$$;

DROP POLICY IF EXISTS "Admins read user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins manage user_roles" ON public.user_roles;
CREATE POLICY "Users read own user_roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_master(auth.uid()));
CREATE POLICY "Masters manage user_roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.is_master(auth.uid()))
  WITH CHECK (public.is_master(auth.uid()));

CREATE POLICY "Users read own admin profile" ON public.admin_profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_master(auth.uid()));
CREATE POLICY "Masters manage admin profiles" ON public.admin_profiles
  FOR ALL TO authenticated USING (public.is_master(auth.uid())) WITH CHECK (public.is_master(auth.uid()));

CREATE POLICY "Authenticated read admin ministries" ON public.admin_ministries
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Masters manage admin ministries" ON public.admin_ministries
  FOR ALL TO authenticated USING (public.is_master(auth.uid())) WITH CHECK (public.is_master(auth.uid()));

CREATE POLICY "Authenticated read admin permissions" ON public.admin_permissions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Masters manage admin permissions" ON public.admin_permissions
  FOR ALL TO authenticated USING (public.is_master(auth.uid())) WITH CHECK (public.is_master(auth.uid()));

CREATE POLICY "Authenticated read ministry permissions" ON public.admin_ministry_permissions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Masters manage ministry permissions" ON public.admin_ministry_permissions
  FOR ALL TO authenticated USING (public.is_master(auth.uid())) WITH CHECK (public.is_master(auth.uid()));

CREATE POLICY "Authenticated read user ministries" ON public.admin_user_ministries
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_master(auth.uid()));
CREATE POLICY "Masters manage user ministries" ON public.admin_user_ministries
  FOR ALL TO authenticated USING (public.is_master(auth.uid())) WITH CHECK (public.is_master(auth.uid()));
