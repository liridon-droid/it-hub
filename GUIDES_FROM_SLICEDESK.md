# Cutover: Guides → SliceDesk Docs (single source of truth)

Repoints the IT Hub's guide **read + feedback** at SliceDesk Docs (`how_to_guides`)
so guides + feedback live in one place. Authoring moves to SliceDesk Docs (`/docs`);
the local `portal2.guides` CRUD is retired.

## What's in this branch
- `server/guides-slicedesk.js` — drop-in router: `/api/guides` (list), `/api/guides/:id`
  (detail, with Markdown `body`), `/api/guides/:id/feedback`, `/api/guides/:id/feedback-detail`,
  and 409s for the create/update/delete/restore/duplicate routes (management moved).

## SliceDesk side (already deployed there)
- `how_to_guides` mirrors the Hub model: `helpful_count`, `unhelpful_count`, `source_type`
  (guide|faq|runbook), `tags`.
- Portal feed `/api/ext/portal/howto[/:slug]` returns those fields plus a Markdown `body`
  (rendered from Lexical), gated to **public + active + tagged `IT`**.
- Feedback: `POST /api/ext/portal/howto/:slug/feedback {rating: 1|-1}` bumps the shared counters.

## Integrate (server/index.js)
1. **Remove** the inline `app.get/post/put/delete('/api/guides'...)` handlers (list, detail,
   create, update, delete, restore, duplicate, feedback, feedback-detail).
2. Add near the other route setup, after the auth middleware is defined:
   ```js
   import { registerGuideRoutes } from './guides-slicedesk.js';
   // ...
   registerGuideRoutes(app, { requireSliceUser, requireSliceAdmin });
   ```
3. **Frontend (`src/app.jsx`):** hide the guide-management admin affordances (New guide,
   Export-as-management, edit/delete/duplicate) — those now 409. Read + feedback views are
   unchanged (the server returns the same shapes; `id` is now the SliceDesk slug, which the
   frontend already treats as opaque).

## Prerequisites
- The module's SliceDesk **API key must have the `portal` scope** (Module Manager → Scopes).
- Run the one-time data migration first (below) so existing guides exist in SliceDesk.

## One-time data migration (run on a SliceDesk host)
Moves `portal2.guides` → SliceDesk `how_to_guides` (content Markdown→Lexical, tags,
source_type, feedback counts; auto-tags `IT`; idempotent by slug):
```
# in the slicedesk repo, on a host that can reach portal2:
PORTAL2_DATABASE_URL=postgres://USER:PASS@HOST:5432/portal2 \
  node server/scripts/import-portal-guides.js --dry-run   # preview
PORTAL2_DATABASE_URL=... node server/scripts/import-portal-guides.js   # apply
```

## Verify on the box (after deploy)
1. Portal Guides list renders (sourced from SliceDesk).
2. Open a guide → Markdown renders.
3. 👍/👎 a guide → the same count appears in SliceDesk Docs (`/docs`) and re-fetches here.
4. Editing a guide happens in SliceDesk Docs; the change shows in the Portal on reload.

## Rollback
Revert the `index.js` change (restore the inline `/api/guides*` handlers); `portal2.guides`
is untouched by this branch, so the old behavior returns immediately.
