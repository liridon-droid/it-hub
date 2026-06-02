# IT Portal — Module Operations & Update Guide

> **For future Claude:** this is the source of truth for how the IT Portal runs as a
> SliceDesk module and how to change it. Read it before making edits.
> (`RUNBOOK.md` is an older *standalone/tunnel* deploy variant — **not** how this is
> actually deployed; ignore it for the live setup.)

---

## TL;DR — the two kinds of update

- **Content** (guides / knowledge base / chatbot answers): edit in the portal's own
  **admin UI**. Saved to the database, live instantly. **No deploy, no commands.**
- **Code** (UI / features / server, i.e. `src/` or `server/`): edit → push to `main`
  → run the two deploy commands on the mini. Rebuilds **only the portal**; slicedesk
  (the hub) is never touched.

---

## What this is

The portal (repo `liridon-droid/it-hub`, package `portal2-local`) runs as a **paired
SliceDesk module** — module ID **167**, name **"IT Portal"** — embedded in the hub at
**https://slicedesk.slice.services/portal/**. It is decoupled from slicedesk:
updating the portal does **not** rebuild the hub.

- **Client:** Vite + React 18 (`src/app.jsx`, `src/main.jsx`) → built to static, served by nginx.
- **Server:** Express + Postgres (`server/`) — full-text search + AI helpers.
- **Auth:** `AUTH_MODE=dual` — verifies the hub's signed `hub_token` when embedded, and
  falls back to the slicedesk session cookie when `/portal/` is opened directly. So
  `/portal/` works **both** embedded and direct.

---

## Where everything lives (mini: `SRV-NY-01`, user `itadmin`)

| Thing | Location |
|---|---|
| Portal **source** | `~/it-hub` (GitHub `liridon-droid/it-hub`, branch `main`) |
| **Orchestration** (compose + nginx) | `~/it-catalog` (the slicedesk repo) |
| Containers | `it-hub-client` (UI nginx), `it-hub-server` (Express API), `it-hub-postgres` (portal DB) |
| slicedesk API container | `server` → reached internally as `http://server:3001` |
| nginx route | `~/it-catalog/nginx.conf`: `/portal/` → it-hub-client; `/portal/api/` & `/portal/uploads/` → it-hub-server |
| Module creds | `~/it-hub/server/.module-state.json` (gitignored) → mounted **read-only** into it-hub-server at `/app/.module-state.json` |

---

## Updating CODE (the deploy)

```bash
# 1. (Claude or you) edit + commit + push to main on liridon-droid/it-hub
# 2. On the mini:
cd ~/it-hub && git pull origin main
cd ~/it-catalog && docker compose up -d --build it-hub-server it-hub-client
# 3. Verify:
docker compose logs --tail=15 it-hub-server   # want: [auth] mode = dual ... FTS listening on :3001
```

- Only one side changed? Rebuild just it: `... up -d --build it-hub-client` (UI) **or** `it-hub-server` (API).
- **Creds persist** across rebuilds (they're mounted) — no re-pairing needed.
- **slicedesk is never rebuilt.**

---

## Updating CONTENT (no deploy)

Guides / knowledge base are created & edited in the portal's own **admin UI** (incl.
AI-draft) and stored in `it-hub-postgres`. Changes are live immediately — no commands.

---

## How to ask Claude (so it's fast)

| You want to… | It's… | What happens |
|---|---|---|
| Add / edit a guide | content | Do it in the admin UI — no code, no deploy |
| Change portal UI / add a feature | code | Claude edits `src/`, pushes to `main`, gives you the rebuild command |
| Change server / API behavior | code | Claude edits `server/`, pushes, rebuild `it-hub-server` |
| Re-enable Onboarding / Offboarding | code | Re-add `"Onboarding","Offboarding"` to the `links` array in `src/app.jsx` (Nav component — there's a comment marking the spot), push, rebuild |
| Hide / show a nav item | code | Edit the `links` array in `src/app.jsx` |
| Rotate / re-pair the module | ops | Reconnect 167 in the hub → pair curl on the mini → restart it-hub-server (see below) |
| Make embedded AI answers work | needs slicedesk | Add a key-accepting `/api/ext/ai/proxy` to the `~/it-catalog` (slicedesk) repo — give Claude access to that repo |

**When asking for a code change, just say what you want** ("make the search bar bigger",
"add a Devices nav tab", "re-enable onboarding"). Claude edits the `it-hub` source,
pushes to `main`, and hands you the rebuild command (or nothing, if auto-deploy is set up).

---

## Auth modes (`AUTH_MODE` env on it-hub-server, in `~/it-catalog/docker-compose.yml`)

| Mode | Behavior |
|---|---|
| `dual` *(current default)* | hub_token when embedded **+** slicedesk cookie when direct |
| `hub` | hub_token only (pure module) |
| `slicedesk` | cookie only (legacy) |

---

## Re-pairing (only if creds are lost / rotated / you clicked Reconnect)

```bash
# 1. Hub UI → Module Manager → IT Portal (167) → Reconnect → copy the 6-digit code
# 2. On the mini (single line; codes expire in 5 min):
curl -sS -X POST https://slicedesk.slice.services/api/modules/pair -H 'Content-Type: application/json' -d '{"code":"PASTE_CODE"}' -o ~/it-hub/server/.module-state.json
# 3. Restart so the server reloads the creds:
cd ~/it-catalog && docker compose restart it-hub-server
```

Sanity-check the file: `python3 -c "import json;d=json.load(open('/Users/itadmin/it-hub/server/.module-state.json'));print(bool(d.get('apiKey')), len(d.get('embedSecret') or ''), (d.get('module') or {}).get('id'))"` → want `True 64 167`.

---

## Rollback

```bash
cd ~/it-hub && git log --oneline -5     # find the last good commit
git checkout <good-sha>                 # run the older version
cd ~/it-catalog && docker compose up -d --build it-hub-server it-hub-client
# later, after pushing a proper fix:  git checkout main
```

---

## Gotchas

- **Module URL must keep the trailing slash:** `https://slicedesk.slice.services/portal/` (nginx `location /portal/`).
- `.module-state.json` is **gitignored** — it lives only on the mini (created by pairing), never in git.
- On the mini's shell (zsh), paste **single-line** commands — multi-line `\` continuations and `#` comments can break on paste.
- `URL_PREFIX=/portal2` in it-catalog is stale vs the `/portal/` route but harmless (the upload prefix is taken from the request Referer).
- Embedded **AI answers are retrieval-only** until slicedesk exposes a module-key AI proxy; direct `/portal/` users keep full AI via the cookie.

---

## Optional: auto-deploy (not set up yet)

A small watcher on the mini can poll `main` and redeploy within ~1 min of a push, so
**code** updates need zero mini commands. Ask Claude to set it up.
