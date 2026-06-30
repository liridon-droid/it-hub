#!/usr/bin/env bash
# Local dev stack for it-hub — Postgres (Docker) + Express server + Vite client.
# Idempotent: safe to re-run. Prod is untouched (this never runs on EC2).
#
#   bin/dev.sh          start everything
#   bin/dev.sh logs     tail server + client logs
#   bin/dev.sh down     stop server + client (leaves Postgres running)
#   bin/dev.sh nuke     stop everything incl. Postgres (keeps the data volume)
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$(pwd)"
LOGDIR="$ROOT/.dev-logs"
mkdir -p "$LOGDIR"

PG_URL="postgresql://portal2:portal2@localhost:5433/portal2"

start() {
  # 1. Docker daemon
  if ! docker info >/dev/null 2>&1; then
    echo "→ starting Docker Desktop…"; open -a Docker || true
    for _ in $(seq 1 40); do docker info >/dev/null 2>&1 && break; sleep 3; done
  fi
  docker info >/dev/null 2>&1 || { echo "✗ Docker daemon not up"; exit 1; }

  # 2. Postgres
  echo "→ Postgres (Docker)…"
  docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d it-hub-postgres >/dev/null
  for _ in $(seq 1 30); do
    [ "$(docker inspect -f '{{.State.Health.Status}}' it-hub-postgres 2>/dev/null)" = "healthy" ] && break
    sleep 2
  done
  echo "  Postgres healthy on localhost:5433"

  # 3. Deps
  [ -d node_modules ] || npm install
  [ -d server/node_modules ] || (cd server && npm install)

  # 4. Server (auto-creates schema on boot)
  if ! curl -s -m2 -o /dev/null http://localhost:3001/api/health; then
    echo "→ Express server (:3001)…"
    (cd server && node --env-file=.env.local --watch index.js) >"$LOGDIR/server.log" 2>&1 &
    for _ in $(seq 1 20); do curl -s -m2 -o /dev/null http://localhost:3001/api/health && break; sleep 1; done
  fi
  echo "  Server up on :3001"

  # 5. Seed data on first run (only if the DB is empty)
  cnt=$(PGPASSWORD=portal2 psql -h localhost -p 5433 -U portal2 -d portal2 -At -c \
        "select count(*) from guides" 2>/dev/null || echo 0)
  if [ "${cnt:-0}" = "0" ]; then
    echo "→ seeding db/seed-data.sql…"
    PGPASSWORD=portal2 psql -h localhost -p 5433 -U portal2 -d portal2 -q -f db/seed-data.sql >/dev/null 2>&1 || true
  fi

  # 6. Client
  if ! curl -s -m2 -o /dev/null http://localhost:5173/; then
    echo "→ Vite client (:5173)…"
    VITE_BASE_PATH=/ npm run dev -- --no-open >"$LOGDIR/client.log" 2>&1 &
    sleep 3
  fi
  echo "  Client up on http://localhost:5173"

  echo
  echo "✅ it-hub dev is up → http://localhost:5173  (you're 'Dev User', super_admin)"
  echo "   logs: bin/dev.sh logs   |   stop: bin/dev.sh down"
}

case "${1:-start}" in
  start) start ;;
  logs)  tail -f "$LOGDIR/server.log" "$LOGDIR/client.log" ;;
  down)
    lsof -ti tcp:3001 | xargs kill 2>/dev/null || true
    lsof -ti tcp:5173 | xargs kill 2>/dev/null || true
    echo "stopped server + client (Postgres still running)" ;;
  nuke)
    lsof -ti tcp:3001 | xargs kill 2>/dev/null || true
    lsof -ti tcp:5173 | xargs kill 2>/dev/null || true
    docker compose -f docker-compose.yml -f docker-compose.dev.yml stop it-hub-postgres >/dev/null 2>&1 || true
    echo "stopped everything (data volume kept; 'docker compose down -v' to wipe)" ;;
  *) echo "usage: bin/dev.sh [start|logs|down|nuke]"; exit 1 ;;
esac
