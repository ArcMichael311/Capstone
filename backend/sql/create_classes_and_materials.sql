CREATE TABLE IF NOT EXISTS class_sections (
  class_id BIGSERIAL PRIMARY KEY,
  teacher_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_class_sections_teacher_id
  ON class_sections (teacher_id, created_at DESC);

CREATE TABLE IF NOT EXISTS class_enrollments (
  enrollment_id BIGSERIAL PRIMARY KEY,
  class_id BIGINT NOT NULL REFERENCES class_sections(class_id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (class_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_class_enrollments_class_id
  ON class_enrollments (class_id);

CREATE INDEX IF NOT EXISTS idx_class_enrollments_student_id
  ON class_enrollments (student_id);

CREATE TABLE IF NOT EXISTS learning_materials (
  material_id BIGSERIAL PRIMARY KEY,
  class_id BIGINT NOT NULL REFERENCES class_sections(class_id) ON DELETE CASCADE,
  teacher_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  content_type VARCHAR(150),
  material_type VARCHAR(20) NOT NULL,
  file_size BIGINT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_learning_materials_class_id
  ON learning_materials (class_id, created_at DESC);
