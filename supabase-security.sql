-- Run this script in the Supabase SQL Editor.
-- The Spring backend uses the database connection directly, while the browser
-- uses Supabase only for authentication. No browser role needs table access.

ALTER TABLE IF EXISTS public.module_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.game_scores ENABLE ROW LEVEL SECURITY;

-- Required by the backend's single-device login lock.
ALTER TABLE IF EXISTS public.users
	ADD COLUMN IF NOT EXISTS active_device_id VARCHAR(128);

ALTER TABLE IF EXISTS public.users
	ADD COLUMN IF NOT EXISTS session_token VARCHAR(64);

ALTER TABLE IF EXISTS public.users
	ADD COLUMN IF NOT EXISTS reset_token_hash VARCHAR(64);

ALTER TABLE IF EXISTS public.users
	ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ;

ALTER TABLE IF EXISTS public.users
	ADD COLUMN IF NOT EXISTS session_expires_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS users_session_token_uq
	ON public.users(session_token)
	WHERE session_token IS NOT NULL;

-- Do not expose application data through the Supabase REST API. The backend
-- remains the only data access path for the application.
REVOKE ALL ON TABLE public.module_games FROM anon, authenticated;
REVOKE ALL ON TABLE public.modules FROM anon, authenticated;
REVOKE ALL ON TABLE public.progress FROM anon, authenticated;
REVOKE ALL ON TABLE public.user_activity FROM anon, authenticated;
REVOKE ALL ON TABLE public.game_scores FROM anon, authenticated;

-- Backend-only tables: never expose account, session, class, pretest, material,
-- or activity data through the browser-facing Supabase REST API.
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.class_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.learning_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.teacher_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pretests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pretest_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pretest_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pretest_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pretest_answers ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.users FROM anon, authenticated;
REVOKE ALL ON TABLE public.class_sections FROM anon, authenticated;
REVOKE ALL ON TABLE public.class_enrollments FROM anon, authenticated;
REVOKE ALL ON TABLE public.learning_materials FROM anon, authenticated;
REVOKE ALL ON TABLE public.teacher_activities FROM anon, authenticated;
REVOKE ALL ON TABLE public.pretests FROM anon, authenticated;
REVOKE ALL ON TABLE public.pretest_questions FROM anon, authenticated;
REVOKE ALL ON TABLE public.pretest_options FROM anon, authenticated;
REVOKE ALL ON TABLE public.pretest_attempts FROM anon, authenticated;
REVOKE ALL ON TABLE public.pretest_answers FROM anon, authenticated;

-- These views must respect the permissions and RLS policies of the querying
-- role instead of running with the view owner's privileges.
ALTER VIEW IF EXISTS public.user_progress_summary SET (security_invoker = true);
ALTER VIEW IF EXISTS public.teacher_student_progress SET (security_invoker = true);

REVOKE ALL ON public.user_progress_summary FROM anon, authenticated;
REVOKE ALL ON public.teacher_student_progress FROM anon, authenticated;