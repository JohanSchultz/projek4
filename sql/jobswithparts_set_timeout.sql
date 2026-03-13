-- Run this in Supabase SQL Editor to avoid "canceling statement due to statement timeout"
-- when calling public.jobswithparts (used by the Services done report).
-- Adjust the timeout value if needed (e.g. 300s for 5 minutes).

-- First, get the exact function signature with:
--   SELECT pg_get_function_identity_arguments(oid) FROM pg_proc WHERE proname = 'jobswithparts';

-- Typical signature (int4, int4, int4, int4, int4[], date, date):
ALTER FUNCTION public.jobswithparts(int4, int4, int4, int4, int4[], date, date)
  SET statement_timeout = '120s';
