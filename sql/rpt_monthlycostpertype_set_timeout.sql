-- Run this in Supabase SQL Editor to avoid "canceling statement due to statement timeout"
-- when calling public.rpt_monthlycostpertype. This sets a 2-minute timeout for that function only.

ALTER FUNCTION public.rpt_monthlycostpertype(int4, int4, int4, int4, int4[], date, date)
  SET statement_timeout = '120s';
