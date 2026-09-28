CREATE TABLE IF NOT EXISTS teacher_activities (
  activity_id BIGSERIAL PRIMARY KEY,
  teacher_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  module_key VARCHAR(40) NOT NULL,
  title VARCHAR(150) NOT NULL,
  focus VARCHAR(200) NOT NULL,
  instructions TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_teacher_activities_teacher_id
  ON teacher_activities (teacher_id, created_at DESC);
