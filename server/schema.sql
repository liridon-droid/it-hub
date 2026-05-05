-- Postgres full-text search only. No vector embeddings, no external APIs.
-- Migration-safe: ALTERs are idempotent so this can be re-run on existing DBs.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS guides (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  body TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  source_type TEXT NOT NULL DEFAULT 'guide',
  metadata JSONB DEFAULT '{}'::jsonb,
  last_verified_at TIMESTAMPTZ,
  helpful_count INT DEFAULT 0,
  unhelpful_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE guides ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'guide';
ALTER TABLE guides ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE guides ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;
ALTER TABLE guides ADD COLUMN IF NOT EXISTS helpful_count INT DEFAULT 0;
ALTER TABLE guides ADD COLUMN IF NOT EXISTS unhelpful_count INT DEFAULT 0;
ALTER TABLE guides ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
-- Partial index makes "active guides" queries trivial — most rows have deleted_at IS NULL.
CREATE INDEX IF NOT EXISTS guides_active_idx ON guides (updated_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS guides_trash_idx ON guides (deleted_at DESC) WHERE deleted_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS guide_chunks (
  id SERIAL PRIMARY KEY,
  guide_id INT REFERENCES guides(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  content TEXT NOT NULL,
  tsv tsvector
);

-- Drop the legacy vector column if it's still around
ALTER TABLE guide_chunks DROP COLUMN IF EXISTS embedding;

-- Add the tsvector column if missing, populate it from existing content,
-- then keep it in sync via a trigger so writers don't have to think about it.
ALTER TABLE guide_chunks ADD COLUMN IF NOT EXISTS tsv tsvector;

CREATE OR REPLACE FUNCTION guide_chunks_tsv_update() RETURNS trigger AS $$
BEGIN
  NEW.tsv := to_tsvector('english', coalesce(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS guide_chunks_tsv_trigger ON guide_chunks;
CREATE TRIGGER guide_chunks_tsv_trigger
  BEFORE INSERT OR UPDATE OF content ON guide_chunks
  FOR EACH ROW EXECUTE FUNCTION guide_chunks_tsv_update();

UPDATE guide_chunks SET tsv = to_tsvector('english', content) WHERE tsv IS NULL;

CREATE INDEX IF NOT EXISTS guide_chunks_tsv_idx ON guide_chunks USING GIN (tsv);
CREATE INDEX IF NOT EXISTS guide_chunks_guide_id_idx ON guide_chunks (guide_id);

CREATE TABLE IF NOT EXISTS chat_logs (
  id SERIAL PRIMARY KEY,
  query TEXT NOT NULL,
  answer TEXT,
  retrieved_chunk_ids INT[] DEFAULT '{}',
  citations JSONB DEFAULT '[]'::jsonb,
  mode TEXT NOT NULL DEFAULT 'retrieval',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS chat_logs_created_at_idx ON chat_logs (created_at DESC);

CREATE TABLE IF NOT EXISTS chat_feedback (
  id SERIAL PRIMARY KEY,
  chat_log_id INT REFERENCES chat_logs(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating IN (-1, 1)),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS chat_feedback_chat_log_id_idx ON chat_feedback (chat_log_id);

-- ── Status platform ────────────────────────────────────────────────────────
-- Replaces the old localStorage-based mock + StatusGator integration.
-- Service catalog lives in `status_services`, grouped via `status_groups`.
-- Each `status_checks` row is one poll result; we keep 90 days for the
-- public history bars. Incidents have a header row + a timeline of updates.

CREATE TABLE IF NOT EXISTS status_groups (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS status_services (
  id SERIAL PRIMARY KEY,
  group_id INT REFERENCES status_groups(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  vendor TEXT,
  domain TEXT,
  icon_url TEXT,
  -- 'manual' = IT toggles state, 'probe' = HTTP poll, 'statuspage' = vendor's
  -- statuspage.io summary.json (Cloudflare/GitHub/Slack/Zoom/Figma all use it).
  source TEXT NOT NULL DEFAULT 'manual',
  source_url TEXT,
  -- Effective state — written by pollers (or by admin when source='manual').
  state TEXT NOT NULL DEFAULT 'operational' CHECK (state IN ('operational','degraded','down')),
  state_note TEXT,
  response_ms INT,
  last_checked_at TIMESTAMPTZ,
  last_error TEXT,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS status_services_group_idx ON status_services (group_id, position);

CREATE TABLE IF NOT EXISTS status_checks (
  id BIGSERIAL PRIMARY KEY,
  service_id INT REFERENCES status_services(id) ON DELETE CASCADE,
  state TEXT NOT NULL CHECK (state IN ('operational','degraded','down')),
  response_ms INT,
  http_status INT,
  error TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS status_checks_service_time_idx ON status_checks (service_id, checked_at DESC);

CREATE TABLE IF NOT EXISTS status_incidents (
  id SERIAL PRIMARY KEY,
  service_id INT REFERENCES status_services(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'minor' CHECK (severity IN ('minor','major','critical')),
  state TEXT NOT NULL DEFAULT 'investigating'
    CHECK (state IN ('investigating','identified','monitoring','resolved')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS status_incidents_open_idx
  ON status_incidents (started_at DESC) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS status_incidents_recent_idx
  ON status_incidents (resolved_at DESC) WHERE resolved_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS status_incident_updates (
  id SERIAL PRIMARY KEY,
  incident_id INT REFERENCES status_incidents(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS status_incident_updates_incident_idx
  ON status_incident_updates (incident_id, created_at);
