-- One-time cleanup for the duplicate-progress-row bug in ProgressService
-- (fixed in code by switching Optional.orElse(...) to Optional.orElseGet(...)).
--
-- Before the fix, every progress read/update call unconditionally inserted a
-- fresh all-zero "default" Progress row for (user_id, module_name), even when
-- a real row already existed. Once two rows existed for the same user+module,
-- any lookup that expects a single result started throwing errors, which is
-- why progress could silently fail to load/sync on some accounts/devices.
--
-- This script is safe to run multiple times. Run it against the Supabase
-- Postgres database (SQL Editor) BEFORE or AFTER deploying the code fix.
--
-- Step 1: See which (user_id, module_name) pairs currently have duplicates.
SELECT user_id, module_name, COUNT(*) AS row_count
FROM progress
GROUP BY user_id, module_name
HAVING COUNT(*) > 1
ORDER BY user_id, module_name;

-- Step 2: Delete the duplicates, keeping the earliest-created row per
-- (user_id, module_name) — that's always the one that was actually being
-- updated with real progress; the later duplicates are the accidental
-- all-zero inserts.
DELETE FROM progress p
USING progress dup
WHERE p.user_id = dup.user_id
  AND p.module_name = dup.module_name
  AND p.progress_id > dup.progress_id;

-- Step 3: Prevent this from ever happening again at the database level.
-- (The code now also uses @UniqueConstraint on the entity, but ddl-auto is
-- "none" against Supabase, so this constraint won't be created automatically
-- — it must be added here.)
ALTER TABLE progress
  ADD CONSTRAINT progress_user_module_unique UNIQUE (user_id, module_name);

-- Step 4: Verify no duplicates remain (should return zero rows).
SELECT user_id, module_name, COUNT(*) AS row_count
FROM progress
GROUP BY user_id, module_name
HAVING COUNT(*) > 1;
