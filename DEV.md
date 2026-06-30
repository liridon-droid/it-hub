# Local development

A full local stack for it-hub so you can make changes and preview them **before**
anything reaches production.

> ⚠️ **Prod auto-deploys from `main`.** A push to `main` (any non-`.md` change)
> triggers `.github/workflows/deploy.yml`, which rebuilds the production EC2.
> So: **work on `dev`, preview locally, and only merge to `main` when you want to ship.**

## The loop

```
dev branch  →  bin/dev.sh  →  edit src/ or server/  →  see it at localhost:5173
            →  merge dev → main → push  =  deploy to prod
```

## Start / stop

```bash
bin/dev.sh         # start Postgres + server + client (idempotent)
bin/dev.sh logs    # tail server + client logs
bin/dev.sh down    # stop server + client (Postgres keeps running)
bin/dev.sh nuke    # stop everything (data volume kept)
```

Then open **http://localhost:5173**. You're auto-signed-in as **"Dev User" (super_admin)**.

## What's running

| Piece | Where | Notes |
|---|---|---|
| Postgres | Docker `it-hub-postgres`, host port **5433** | pgvector pg16 — matches prod. `docker-compose.dev.yml` only adds the host port. |
| Express server | host, **:3001** | `node --env-file=server/.env.local --watch index.js` — hot-reloads on save. |
| Vite client | host, **:5173** | `VITE_BASE_PATH=/` (prod uses `/portal/`). Proxies `/api` → :3001. HMR on save. |

## The dev-only config

- `server/.env.local` (gitignored) — local `DATABASE_URL` + **`DEV_BYPASS_AUTH=1`**
  (every request becomes a super_admin "Dev User"; no hub pairing / cookie needed).
- `docker-compose.dev.yml` — exposes Postgres on host :5433. Prod never loads it.
- `.claude/launch.json` (gitignored) — preview config.

## Limitations (offline)

AI chat, AI guide-drafting, and the guides list **proxy to the real SliceDesk hub**,
so they're inert locally and degrade gracefully. Everything else — tickets UI, admin,
search, status board — runs against the seeded local DB. To enable AI/guides locally,
fill in `SLICEDESK_API_URL` / `MODULE_API_KEY` / `MODULE_EMBED_SECRET` in `server/.env.local`.

## Reset the database

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v   # wipe volume
bin/dev.sh                                                               # recreate + reseed
```
