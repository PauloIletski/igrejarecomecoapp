-- Roles
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Admins read user_roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage user_roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- AGENDA ITEMS (recurring weekly)
CREATE TABLE public.agenda_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
  start_time TIME NOT NULL,
  end_time TIME,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.agenda_items ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER agenda_items_updated_at BEFORE UPDATE ON public.agenda_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Public read active agenda" ON public.agenda_items
  FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Admins manage agenda" ON public.agenda_items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- EVENTS
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  location TEXT,
  image_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Public read published events" ON public.events
  FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "Admins manage events" ON public.events
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- PASTORS
CREATE TABLE public.pastors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pastors ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER pastors_updated_at BEFORE UPDATE ON public.pastors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Public read pastors" ON public.pastors
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage pastors" ON public.pastors
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- MINISTRIES
CREATE TABLE public.ministries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ministries ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER ministries_updated_at BEFORE UPDATE ON public.ministries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Public read ministries" ON public.ministries
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage ministries" ON public.ministries
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- DONATION ITEMS (priority list)
CREATE TABLE public.donation_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  priority SMALLINT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.donation_items ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER donation_items_updated_at BEFORE UPDATE ON public.donation_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Public read active donation items" ON public.donation_items
  FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Admins manage donation items" ON public.donation_items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- PRAYER REQUESTS
CREATE TABLE public.prayer_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  message TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  allow_public BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER prayer_requests_updated_at BEFORE UPDATE ON public.prayer_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Anyone can submit prayer requests" ON public.prayer_requests
  FOR INSERT TO anon, authenticated WITH CHECK (
    char_length(message) BETWEEN 1 AND 2000
    AND (name IS NULL OR char_length(name) <= 120)
    AND (email IS NULL OR char_length(email) <= 255)
    AND (phone IS NULL OR char_length(phone) <= 40)
  );
CREATE POLICY "Admins read prayer requests" ON public.prayer_requests
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update prayer requests" ON public.prayer_requests
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete prayer requests" ON public.prayer_requests
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- DONATION PLEDGES
CREATE TABLE public.donation_pledges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  items TEXT NOT NULL,
  quantity_note TEXT,
  planned_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.donation_pledges ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER donation_pledges_updated_at BEFORE UPDATE ON public.donation_pledges
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Anyone can submit donation pledges" ON public.donation_pledges
  FOR INSERT TO anon, authenticated WITH CHECK (
    char_length(name) BETWEEN 1 AND 120
    AND char_length(phone) BETWEEN 4 AND 40
    AND char_length(items) BETWEEN 1 AND 2000
    AND (email IS NULL OR char_length(email) <= 255)
    AND (quantity_note IS NULL OR char_length(quantity_note) <= 500)
  );
CREATE POLICY "Admins read donation pledges" ON public.donation_pledges
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update donation pledges" ON public.donation_pledges
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete donation pledges" ON public.donation_pledges
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Seed placeholder content
INSERT INTO public.agenda_items (day_of_week, start_time, end_time, title, description, location, sort_order) VALUES
  (0, '10:00', '12:00', 'Culto de Celebração', 'Culto principal de domingo com louvor e palavra.', 'Templo Sede', 1),
  (0, '18:30', '20:30', 'Culto da Família', 'Encontro à noite para toda a família.', 'Templo Sede', 2),
  (2, '20:00', '21:30', 'Culto de Oração', 'Noite de oração e intercessão.', 'Templo Sede', 3),
  (4, '20:00', '21:30', 'Estudo Bíblico', 'Estudo aprofundado da Palavra.', 'Templo Sede', 4),
  (5, '20:00', '22:00', 'Culto de Jovens', 'Encontro vibrante para a juventude.', 'Templo Sede', 5);

INSERT INTO public.events (title, description, starts_at, location) VALUES
  ('Conferência Lugar de Adoração', 'Três dias de adoração, palavra e comunhão com convidados especiais.', now() + interval '20 days', 'Templo Sede'),
  ('Ação Social — Café da Manhã', 'Distribuição de café da manhã para a comunidade.', now() + interval '7 days', 'Praça Central'),
  ('Batismo nas Águas', 'Celebração de batismo dos novos membros.', now() + interval '35 days', 'Templo Sede');

INSERT INTO public.pastors (name, role, bio, sort_order) VALUES
  ('Pr. Nome Sobrenome', 'Pastor Presidente', 'Lidera a Igreja Recomeço com paixão pela Palavra e amor pelas pessoas.', 1),
  ('Pra. Nome Sobrenome', 'Pastora', 'Coordena os ministérios da família e do louvor.', 2);

INSERT INTO public.ministries (name, description, icon, sort_order) VALUES
  ('Louvor e Adoração', 'Banda, coral e técnica.', 'Music', 1),
  ('Ministério Infantil', 'Cuidado e ensino para as crianças.', 'Baby', 2),
  ('Jovens', 'Discipulado e comunhão para a juventude.', 'Flame', 3),
  ('Casais', 'Encontros e aconselhamento para casais.', 'Heart', 4),
  ('Intercessão', 'Grupos de oração contínua.', 'HandHeart', 5),
  ('Ação Social', 'Apoio às famílias da comunidade.', 'HeartHandshake', 6);

INSERT INTO public.donation_items (name, priority) VALUES
  ('Arroz', 10),
  ('Feijão', 10),
  ('Óleo de cozinha', 9),
  ('Leite em pó', 8),
  ('Açúcar', 7),
  ('Macarrão', 7),
  ('Café', 6),
  ('Produtos de higiene', 8);
