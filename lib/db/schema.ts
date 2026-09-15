export const SCHEMA_VERSION = 1;

export const schemaSql = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('learner', 'content_reviewer', 'administrator')),
  onboarding_complete INTEGER NOT NULL DEFAULT 0 CHECK (onboarding_complete IN (0, 1)),
  study_minutes INTEGER NOT NULL DEFAULT 45 CHECK (study_minutes BETWEEN 15 AND 240),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS domains (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  priority INTEGER NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_focus (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  domain_slug TEXT NOT NULL REFERENCES domains(slug),
  rank INTEGER NOT NULL CHECK (rank BETWEEN 1 AND 10),
  confidence INTEGER NOT NULL DEFAULT 25 CHECK (confidence BETWEEN 0 AND 100),
  PRIMARY KEY (user_id, domain_slug),
  UNIQUE (user_id, rank)
);

CREATE TABLE IF NOT EXISTS xp_config (
  source_type TEXT PRIMARY KEY,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS quest_templates (
  id TEXT PRIMARY KEY,
  domain_slug TEXT NOT NULL REFERENCES domains(slug),
  cadence TEXT NOT NULL CHECK (cadence IN ('daily', 'weekly', 'monthly')),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  challenge_mode TEXT NOT NULL CHECK (challenge_mode IN ('guided', 'semi-guided', 'expert')),
  prerequisites_json TEXT NOT NULL,
  steps_json TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))
);
CREATE INDEX IF NOT EXISTS idx_quest_templates_cadence ON quest_templates(cadence, active);

CREATE TABLE IF NOT EXISTS quest_instances (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL REFERENCES quest_templates(id),
  cadence TEXT NOT NULL CHECK (cadence IN ('daily', 'weekly', 'monthly')),
  period_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  generated_at TEXT NOT NULL,
  completed_at TEXT,
  UNIQUE (user_id, cadence, period_key)
);
CREATE INDEX IF NOT EXISTS idx_quest_instances_user_status ON quest_instances(user_id, status);

CREATE TABLE IF NOT EXISTS quest_step_completions (
  quest_id TEXT NOT NULL REFERENCES quest_instances(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  step_type TEXT NOT NULL,
  score INTEGER,
  response_json TEXT,
  completed_at TEXT NOT NULL,
  PRIMARY KEY (quest_id, step_id)
);

CREATE TABLE IF NOT EXISTS challenge_progress (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL REFERENCES quest_templates(id),
  status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')),
  percent INTEGER NOT NULL CHECK (percent BETWEEN 0 AND 100),
  evidence_url TEXT,
  notes TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, template_id)
);

CREATE TABLE IF NOT EXISTS xp_ledger (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_key TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (user_id, event_key)
);
CREATE INDEX IF NOT EXISTS idx_xp_ledger_user_created ON xp_ledger(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS streaks (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_kind TEXT NOT NULL CHECK (period_kind IN ('daily', 'weekly', 'monthly')),
  count INTEGER NOT NULL DEFAULT 0,
  best_count INTEGER NOT NULL DEFAULT 0,
  last_period_key TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, period_kind)
);

CREATE TABLE IF NOT EXISTS achievements (
  code TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_achievements (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_code TEXT NOT NULL REFERENCES achievements(code),
  unlocked_at TEXT NOT NULL,
  PRIMARY KEY (user_id, achievement_code)
);

CREATE TABLE IF NOT EXISTS skill_progress (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  domain_slug TEXT NOT NULL REFERENCES domains(slug),
  mastery INTEGER NOT NULL DEFAULT 0 CHECK (mastery BETWEEN 0 AND 100),
  confidence INTEGER NOT NULL DEFAULT 25 CHECK (confidence BETWEEN 0 AND 100),
  attempts INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  completed_steps INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, domain_slug)
);

CREATE TABLE IF NOT EXISTS certifications (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('Microsoft', 'GitHub')),
  description TEXT NOT NULL,
  recommended_order INTEGER NOT NULL,
  domains_json TEXT NOT NULL,
  official_url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_certification_progress (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  certification_code TEXT NOT NULL REFERENCES certifications(code),
  readiness INTEGER NOT NULL DEFAULT 0 CHECK (readiness BETWEEN 0 AND 100),
  confidence INTEGER NOT NULL DEFAULT 25 CHECK (confidence BETWEEN 0 AND 100),
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'preparing', 'ready', 'certified')),
  target_date TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, certification_code)
);

CREATE TABLE IF NOT EXISTS exam_questions (
  id TEXT PRIMARY KEY,
  certification_code TEXT NOT NULL REFERENCES certifications(code),
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'scenario', 'case_study')),
  difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  domain_slug TEXT NOT NULL REFERENCES domains(slug),
  case_context TEXT,
  prompt TEXT NOT NULL,
  options_json TEXT NOT NULL,
  answer_index INTEGER NOT NULL,
  explanation TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_exam_questions_cert ON exam_questions(certification_code, difficulty);

CREATE TABLE IF NOT EXISTS exam_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  certification_code TEXT NOT NULL REFERENCES certifications(code),
  difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  duration_minutes INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'submitted', 'expired')),
  started_at TEXT NOT NULL,
  submitted_at TEXT,
  score INTEGER,
  result_json TEXT
);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_user ON exam_attempts(user_id, started_at DESC);

CREATE TABLE IF NOT EXISTS exam_attempt_questions (
  attempt_id TEXT NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES exam_questions(id),
  position INTEGER NOT NULL,
  PRIMARY KEY (attempt_id, question_id),
  UNIQUE (attempt_id, position)
);

CREATE TABLE IF NOT EXISTS exam_answers (
  attempt_id TEXT NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES exam_questions(id),
  selected_index INTEGER NOT NULL,
  correct INTEGER NOT NULL CHECK (correct IN (0, 1)),
  PRIMARY KEY (attempt_id, question_id)
);

CREATE TABLE IF NOT EXISTS mentor_messages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('learner', 'mentor')),
  content TEXT NOT NULL,
  provider TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mentor_messages_user ON mentor_messages(user_id, created_at DESC);
`;
