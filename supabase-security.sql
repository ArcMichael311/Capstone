-- Run this script in the Supabase SQL Editor.
-- The Spring backend uses the database connection directly, while the browser
-- uses Supabase only for authentication. No browser role needs table access.

ALTER TABLE IF EXISTS public.module_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_activity ENABLE ROW LEVEL SECURITY;

-- Do not expose application data through the Supabase REST API. The backend
-- remains the only data access path for the application.
REVOKE ALL ON TABLE public.module_games FROM anon, authenticated;
REVOKE ALL ON TABLE public.modules FROM anon, authenticated;
REVOKE ALL ON TABLE public.progress FROM anon, authenticated;
REVOKE ALL ON TABLE public.user_activity FROM anon, authenticated;

-- These views must respect the permissions and RLS policies of the querying
-- role instead of running with the view owner's privileges.
ALTER VIEW IF EXISTS public.user_progress_summary SET (security_invoker = true);
ALTER VIEW IF EXISTS public.teacher_student_progress SET (security_invoker = true);

REVOKE ALL ON public.user_progress_summary FROM anon, authenticated;
REVOKE ALL ON public.teacher_student_progress FROM anon, authenticated;