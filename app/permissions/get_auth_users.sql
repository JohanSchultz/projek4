-- Run this in Supabase SQL Editor to expose auth.users (id, email) to the app.
-- Requires a function with SECURITY DEFINER so it can read auth.users.

CREATE OR REPLACE FUNCTION public.get_auth_users()
RETURNS TABLE(id uuid, email text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, email FROM auth.users ORDER BY email;
$$;
