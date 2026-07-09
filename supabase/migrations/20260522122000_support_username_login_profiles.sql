CREATE OR REPLACE FUNCTION public.create_admin_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uses_username_login boolean := COALESCE((NEW.raw_user_meta_data->>'uses_username_login')::boolean, false);
  contact_email text := NULLIF(NEW.raw_user_meta_data->>'contact_email', '');
BEGIN
  INSERT INTO public.admin_profiles (user_id, email, display_name)
  VALUES (
    NEW.id,
    CASE WHEN uses_username_login THEN contact_email ELSE NEW.email END,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = excluded.email,
    display_name = COALESCE(public.admin_profiles.display_name, excluded.display_name);
  RETURN NEW;
END;
$$;
