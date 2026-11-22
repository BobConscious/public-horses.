CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  reviewer INTEGER NOT NULL DEFAULT 0 CHECK (reviewer IN (0, 1))
) STRICT;

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
) STRICT;
CREATE INDEX IF NOT EXISTS session_expiry ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  owner_id TEXT NOT NULL REFERENCES members(id),
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  location TEXT NOT NULL,
  summary TEXT NOT NULL,
  story TEXT NOT NULL,
  field TEXT NOT NULL CHECK (field IN ('nourishment', 'health', 'relationships',
    'livelihood', 'happiness', 'partnership')),
  ends_at TEXT NOT NULL,
  proof_url TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'submitted', 'changes_requested', 'published', 'closed')),
  version INTEGER NOT NULL CHECK (version >= 1),
  art TEXT NOT NULL DEFAULT '',
  demo INTEGER NOT NULL DEFAULT 0 CHECK (demo IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;
CREATE INDEX IF NOT EXISTS projects_by_owner ON projects(owner_id, updated_at);
CREATE INDEX IF NOT EXISTS projects_directory ON projects(status, ends_at);

CREATE TABLE IF NOT EXISTS needs (
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('funding', 'supplies', 'time', 'skills')),
  detail TEXT NOT NULL,
  url TEXT NOT NULL,
  PRIMARY KEY (project_id, type)
) STRICT;

CREATE TABLE IF NOT EXISTS reviews (
  project_id TEXT NOT NULL REFERENCES projects(id),
  version INTEGER NOT NULL CHECK (version >= 1),
  reviewer_id TEXT NOT NULL REFERENCES members(id),
  decision TEXT NOT NULL CHECK (decision IN ('publish', 'changes_requested')),
  note TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (project_id, version)
) STRICT;

CREATE TABLE IF NOT EXISTS seeds (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  request_id TEXT NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id),
  project_title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('funding', 'supplies', 'time', 'skills')),
  intention TEXT NOT NULL CHECK (intention IN ('nourishment', 'health', 'relationships',
    'livelihood', 'happiness', 'partnership')),
  note TEXT NOT NULL,
  created_at TEXT NOT NULL,
  planted_at TEXT,
  watered_at TEXT,
  waters INTEGER NOT NULL DEFAULT 0 CHECK (waters BETWEEN 0 AND 3),
  plot INTEGER CHECK (plot BETWEEN 1 AND 12),
  harvested_at TEXT,
  UNIQUE (member_id, request_id),
  CHECK (plot IS NULL OR planted_at IS NOT NULL),
  CHECK (waters = 0 OR watered_at IS NOT NULL),
  CHECK (harvested_at IS NULL OR (plot IS NULL AND waters = 3))
) STRICT;
CREATE UNIQUE INDEX IF NOT EXISTS seed_plot ON seeds(member_id, plot) WHERE plot IS NOT NULL;
CREATE INDEX IF NOT EXISTS member_garden ON seeds(member_id, created_at);
