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

-- These views must respect the permissions and RLS policies of the querying
-- role instead of running with the view owner's privileges.
ALTER VIEW IF EXISTS public.user_progress_summary SET (security_invoker = true);
ALTER VIEW IF EXISTS public.teacher_student_progress SET (security_invoker = true);

REVOKE ALL ON public.user_progress_summary FROM anon, authenticated;
REVOKE ALL ON public.teacher_student_progress FROM anon, authenticated;

-- Lock down EVERY table in the public schema (including users, which stores password
-- hashes and session token hashes). The browser only uses Supabase for authentication;
-- the backend connects as the database owner, which is not affected by these rules.
DO $$
DECLARE
	r record;
BEGIN
	FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
		EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
		EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', r.tablename);
	END LOOP;
END $$;

-- Tables created later should not be exposed by default either.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;

-- Session tokens are now stored as SHA-256 hashes. Clear any old plaintext tokens
-- (users simply log in again).
UPDATE public.users SET session_token = NULL, session_expires_at = NULL WHERE session_token IS NOT NULL;