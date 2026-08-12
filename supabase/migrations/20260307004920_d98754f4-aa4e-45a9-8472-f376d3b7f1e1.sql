
-- Add ban columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ban_reason text;

-- Create admin_ban_user function (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.admin_ban_user(_user_id uuid, _banned boolean, _reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Verify caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can ban users';
  END IF;

  UPDATE public.profiles
  SET is_banned = _banned, ban_reason = _reason
  WHERE id = _user_id;
END;
$$;
