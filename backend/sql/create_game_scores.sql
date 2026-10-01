-- Best/last score per student per game (AlphaQuest, VowelRush, WordBlast, Balloon Pop),
-- shown in the teacher's Academic Progress radar chart.
CREATE TABLE IF NOT EXISTS game_scores (
  game_score_id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  game_name VARCHAR(40) NOT NULL,
  best_score INTEGER NOT NULL DEFAULT 0,
  last_score INTEGER NOT NULL DEFAULT 0,
  times_played INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_game_scores_user_game UNIQUE (user_id, game_name)
);

-- Only the Spring backend reads/writes this table (direct DB connection, bypasses RLS).
-- Block the browser's anon/authenticated keys, same as the other tables in supabase-security.sql.
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.game_scores FROM anon, authenticated;
