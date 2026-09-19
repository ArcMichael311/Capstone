CREATE TABLE IF NOT EXISTS pretests (
  pretest_id BIGSERIAL PRIMARY KEY,
  class_id BIGINT NOT NULL REFERENCES class_sections(class_id) ON DELETE CASCADE,
  teacher_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description VARCHAR(500),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pretests_class_id
  ON pretests (class_id, created_at DESC);

CREATE TABLE IF NOT EXISTS pretest_questions (
  question_id BIGSERIAL PRIMARY KEY,
  pretest_id BIGINT NOT NULL REFERENCES pretests(pretest_id) ON DELETE CASCADE,
  question_type VARCHAR(30) NOT NULL,
  prompt_text VARCHAR(500) NOT NULL,
  audio_storage_path VARCHAR(500),
  correct_answer_text VARCHAR(300),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pretest_questions_pretest_id
  ON pretest_questions (pretest_id, sort_order ASC);

CREATE TABLE IF NOT EXISTS pretest_options (
  option_id BIGSERIAL PRIMARY KEY,
  question_id BIGINT NOT NULL REFERENCES pretest_questions(question_id) ON DELETE CASCADE,
  label VARCHAR(300) NOT NULL,
  match_value VARCHAR(300),
  audio_storage_path VARCHAR(500),
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_pretest_options_question_id
  ON pretest_options (question_id, sort_order ASC);

CREATE TABLE IF NOT EXISTS pretest_attempts (
  attempt_id BIGSERIAL PRIMARY KEY,
  pretest_id BIGINT NOT NULL REFERENCES pretests(pretest_id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  score INT NOT NULL,
  total_questions INT NOT NULL,
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pretest_attempts_pretest_id
  ON pretest_attempts (pretest_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_pretest_attempts_student_id
  ON pretest_attempts (student_id, submitted_at DESC);

CREATE TABLE IF NOT EXISTS pretest_answers (
  answer_id BIGSERIAL PRIMARY KEY,
  attempt_id BIGINT NOT NULL REFERENCES pretest_attempts(attempt_id) ON DELETE CASCADE,
  question_id BIGINT NOT NULL REFERENCES pretest_questions(question_id) ON DELETE CASCADE,
  response_text VARCHAR(500),
  is_correct BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_pretest_answers_attempt_id
  ON pretest_answers (attempt_id);
