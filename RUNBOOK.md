# Running it-hub as a SliceDesk module (embed test)

This runs the portal **standalone** (its own Postgres + nginx), paired to the
hub as module **167 ("IT Portal")**, and embeds it in the hub via a tunnel.

## Prereqs
- Docker Desktop running
- A tunnel tool: [`cloudflared`](https://github.com/cloudflare/cloudflared) or [`ngrok`](https://ngrok.com)
- The module is already paired — `server/.module-state.json` holds the
  `apiKey` + `embedSecret` (gitignored; mounted read-only into the server).

## 1. Build + run the stack
```bash
cd "<this repo>"
docker compose up --build -d
```
This builds the client at base `/` (`VITE_BASE_PATH=/`), runs the server in
`AUTH_MODE=hub`, and brings up Postgres. The client is on **http://localhost:8080**.

Sanity check (should both work locally):
```bash
curl -s localhost:8080/api/health        # {"ok":true,...}
curl -s localhost:8080/ | head -c 200     # the SPA HTML
```

## 2. Expose it over HTTPS (the hub is HTTPS → the iframe must be too)
```bash
cloudflared tunnel --url http://localhost:8080
#   or:  ngrok http 8080
```
Copy the `https://…` URL it prints (e.g. `https://abc-123.trycloudflare.com`).

## 3. Point the hub at it  *(admin action — the API key can't do this)*
In the hub → **Settings → Module Manager → IT Portal (167) → Overview**, set
**Module URL** to the `https://…` tunnel URL and save.

## 4. Open it
Click **IT Portal** in the hub's top nav (or go to `/modules/167`). It loads in
the iframe; the hub appends `?hub_token=…`, the client forwards it as
`X-Hub-Token`, and the server verifies it. You should see your name, and
guides/search working.

> **AI features** (chat answers, ai-edit, screenshot triage) stay in their
> "unavailable"/retrieval-only fallback until the hub exposes an AI proxy that
> accepts the module key — see the AI note in the conversation. Everything else
> works.

## Troubleshooting
- **Blank / refused iframe** → the Module URL must be `https://` (the tunnel),
  not `http://localhost` — an HTTPS page can't embed an HTTP iframe.
- **401 "Not authenticated"** → `embed_secret` mismatch (re-pair if the module
  was reconnected) or `AUTH_MODE` isn't `hub`. Check `docker compose logs it-hub-server`.
- **Not in the nav** → module must be `active` and your role must match its
  access rules (admins by default).

## Revert to legacy (slicedesk cookie) mode
Set in `docker-compose.yml` (server env): `AUTH_MODE=slicedesk` and
`SLICEDESK_API_URL=<hub>` (+ `SLICEDESK_LOGIN_URL`). Rebuild the client with
`VITE_BASE_PATH=/portal/` if serving behind the outer nginx.
