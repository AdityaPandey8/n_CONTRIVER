CREATE OR REPLACE FUNCTION public.assign_admin_role(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.user_roles
  SET role = 'admin', assigned_at = now()
  WHERE user_id = _user_id;
END;
$$;