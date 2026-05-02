-- Runs once, the first time the postgres container starts with an empty data volume.
-- Wipe the volume (`docker compose down -v`) to re-run.

CREATE EXTENSION IF NOT EXISTS vector;
