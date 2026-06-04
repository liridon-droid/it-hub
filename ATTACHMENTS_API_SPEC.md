# Spec: expose ticket attachments on the Ticket Module API

**For:** the owner of the SliceDesk **ticket module** (the service that implements `/api/module/tickets/*`).
**Requested by:** IT Portal (paired module 167) so it can show attachments on a ticket.
**Type:** additive — no changes to existing endpoints.

---

## Problem

The ticket module **accepts** attachment uploads:

```
POST /api/module/tickets/:id/attachments
{ file_name, mime_type, content_base64, uploaded_by, uploaded_by_name }
```

…but provides **no way to read attachments back through the module API**. Confirmed against a live ticket:

- `GET /api/module/tickets/:id` returns the full ticket (comments, tags, assignments, activity, form/fulfillment responses) but **no `attachments` field**, and comments carry no attachments either.
- `GET /api/module/tickets/:id/attachments` → **404** (doesn't exist).
- Opening an attachment from the ticket UI returns `{"error":"Authentication required"}` → the download is **session-gated**, so an external caller (or another module) can't fetch the file.

Net: any consumer other than the ticket UI itself can attach files but can never display them. The IT Portal needs to show them.

---

## What to add (2 endpoints)

Both are normal **module API** routes — same auth as the rest of `/api/module/*` (module API key / the hub's `X-Hub-Forward-Token`). No browser session.

### 1. Return attachment metadata on read

Include an `attachments` array in **`GET /api/module/tickets/:id`** (empty array when none):

```jsonc
{
  "id": 142,
  "ticket_number": "INC-86913",
  // …existing fields…
  "attachments": [
    {
      "id": 12,                         // attachment id (used in the content URL below)
      "file_name": "screenshot.png",
      "mime_type": "image/png",
      "file_size": 84213,               // bytes (optional but helpful)
      "uploaded_by": "user-jane-456",   // optional
      "uploaded_by_name": "Jane Smith", // optional
      "created_at": "2026-06-03T17:15:07.000Z"
    }
  ]
}
```

(A separate `GET /api/module/tickets/:id/attachments` returning `{ "attachments": [...] }` is fine too, but inlining on the ticket is all the portal needs.)

### 2. Stream the bytes via a key-authed content endpoint

```
GET /api/module/tickets/:id/attachments/:attId/content
```

- **Auth:** the same module-key / hub-forward-token auth as every other `/api/module/*` route — **not** a browser session. (This is the key fix: the current download is session-only, hence "Authentication required" for external callers.)
- **Read scope** (same access as `GET /tickets/:id`). `404` if missing, `403` if the caller can't read that ticket.
- **Behavior:** if the file lives in Google Drive, download it **server-side** using the module's own Drive credentials and stream it back. The caller never needs Drive access.
- **Response:** raw bytes with:
  - `Content-Type: <mime_type>` (e.g. `image/png`)
  - `Content-Disposition: inline; filename="<file_name>"`
  - optionally `Content-Length`, `Cache-Control: private, max-age=3600`

> **Alternative if streaming bytes is awkward:** instead of the bytes, return `{ "download_url": "<short-lived, no-auth signed URL>" }` (e.g. a time-limited Drive link). The portal can use that directly. Returning bytes is simpler and avoids exposing Drive URLs — pick whichever fits your stack.

---

## How the portal consumes it (the full chain, for context)

Everything the portal does goes through the **hub's inter-module proxy** with the portal's `ith_` key:

```
1. GET /api/ext/modules/101/api/module/tickets/:id
   → reads the ticket incl. the new `attachments` array → renders names + image thumbnails

2. GET /api/ext/modules/101/api/module/tickets/:id/attachments/:attId/content
   → portal fetches the bytes (authenticated by its module key), then re-serves them
     same-origin to the browser, so <img src> renders past the auth gate
```

So the chain is: **ticket module (owns files in Drive) → hub proxy (module key) → portal (same-origin image)**. Nothing is duplicated; the module stays the single source of truth.

> **One thing to verify on the hub side:** the inter-module proxy (`/api/ext/modules/:id/...`) must pass a **binary** response through unchanged (don't assume/force JSON) for the content endpoint. If that's a problem, use the `download_url` alternative above and no binary crosses the proxy.

---

## Acceptance criteria

With a module API key (and again through the hub proxy):

1. `GET /api/module/tickets/<id>` returns `attachments: [...]` for a ticket that has uploads; `[]` when it has none.
2. `GET /api/module/tickets/<id>/attachments/<attId>/content` returns the **file bytes** with the correct `Content-Type` (e.g. `image/png`) — **not** an HTML page and **not** `{"error":"Authentication required"}`.
3. Both succeed through the hub proxy:
   `GET /api/ext/modules/101/api/module/tickets/<id>` and `…/attachments/<attId>/content`.
4. The existing `POST …/attachments` upload is unchanged.

## Also

Please update **MODULE_API.md** to document the attachment read shape (the "Get ticket" section currently lists what it returns and omits attachments, plus there's no read endpoint — that gap is what caused this).

---

Once these land and deploy, the portal change is small (an authenticated proxy + field mapping, mostly already built) and attachments — including ones added on the SliceDesk side — show inline in the portal automatically.
