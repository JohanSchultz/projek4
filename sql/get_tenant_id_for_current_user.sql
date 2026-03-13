-- Run this in Supabase SQL Editor to create the function.
-- Returns tenant_id from public.tenant_users for the current authenticated user (auth.uid()).

create or replace function public.get_tenant_id_for_current_user()
returns integer
language sql stable security definer
as $$
  select tenant_id
  from public.tenant_users
  where user_id = auth.uid()
  limit 1;
$$;
