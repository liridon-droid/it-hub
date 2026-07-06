// guides-slicedesk.js
// ─────────────────────────────────────────────────────────────────────────
// Repoints the IT Hub's guide READ + FEEDBACK endpoints at SliceDesk Docs
// (how_to_guides) so SliceDesk is the single source of truth. Guide
// authoring/management now lives in SliceDesk Docs (/docs); the local
// portal2.guides CRUD is disabled here.
//
// Content: SliceDesk stores Lexical JSON but its portal feed also returns a
// Markdown `body` (rendered server-side), so the Portal's existing Markdown
// renderer keeps working unchanged.
//
// Identity: SliceDesk guides are addressed by `slug`. We surface the slug as
// the opaque `id` the Portal frontend already passes around — no frontend
// change needed for read/feedback.
//
// Auth: calls SliceDesk /api/ext/portal/* with the module key
// (Authorization: Bearer <moduleConfig.apiKey>). That key MUST have the
// `portal` scope on SliceDesk. Only public + active + IT-tagged docs are
// returned (the SliceDesk-side gate).
//
// Integration (in server/index.js):
//   1. DELETE the inline `app.*('/api/guides...'` route handlers.
//   2. import { registerGuideRoutes } from './guides-slicedesk.js';
//   3. After auth middleware is defined:
//        registerGuideRoutes(app, { requireSliceUser, requireSliceAdmin });
//
// NOTE: not testable from a standalone SliceDesk checkout — verify on the box
// after deploy (list renders, a guide opens with Markdown, 👍/👎 increments
// and the same count shows in SliceDesk Docs).

import { moduleConfig } from './module-config.js';

const CRUD_MOVED = {
  error: 'Guide management moved to SliceDesk Docs. Create/edit guides at <slicedesk>/docs.',
};

async function hubFetch(path, { method = 'GET', body } = {}) {
  if (!moduleConfig.hubApiBase || !moduleConfig.apiKey) {
    const e = new Error('module not paired with the hub (hubApiBase/apiKey missing)');
    e.status = 503;
    throw e;
  }
  const res = await fetch(`${moduleConfig.hubApiBase}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${moduleConfig.apiKey}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const e = new Error(`hub ${res.status}`);
    e.status = res.status;
    throw e;
  }
  return res.json();
}

const parseTags = (t) => {
  if (Array.isArray(t)) return t;
  try { return JSON.parse(t || '[]'); } catch { return []; }
};

// The Portal frontend addresses guides by NUMERIC id (it only loads content when
// /^\d+$/ matches). SliceDesk's portal feed is keyed by slug, so we expose the
// numeric how_to_guides id and keep an id→slug map (populated from the list) to
// resolve detail/feedback calls back to the slug.
let _idToSlug = new Map();
async function slugForId(id) {
  const key = String(id);
  if (_idToSlug.has(key)) return _idToSlug.get(key);
  const rows = await hubFetch('/api/ext/portal/howto'); // refresh the map
  _idToSlug = new Map((rows || []).map((g) => [String(g.id), g.slug]));
  return _idToSlug.get(key) || null;
}

// SliceDesk portal feed row → IT Hub guide shape.
function toGuide(g, { withBody = false } = {}) {
  return {
    id: g.id, // numeric how_to_guides id — the Portal frontend requires /^\d+$/
    title: g.title,
    category: g.category,
    tags: parseTags(g.tags),
    source_type: g.source_type || 'guide',
    helpful_count: g.helpful_count || 0,
    unhelpful_count: g.unhelpful_count || 0,
    created_at: g.created_at,
    updated_at: g.updated_at,
    metadata: {},
    ...(withBody ? { body: g.body || '' } : {}),
  };
}

export function registerGuideRoutes(app, { requireSliceUser, requireSliceAdmin }) {
  // LIST
  app.get('/api/guides', requireSliceUser, async (req, res, next) => {
    try {
      const qs = req.query.search ? `?search=${encodeURIComponent(req.query.search)}` : '';
      const rows = await hubFetch(`/api/ext/portal/howto${qs}`);
      // Keep the id→slug map warm so guide detail/feedback resolve without a refetch.
      _idToSlug = new Map((rows || []).map((g) => [String(g.id), g.slug]));
      res.json((rows || []).map((g) => toGuide(g)));
    } catch (e) { next(e); }
  });

  // PINS — proxied to the SHARED SliceDesk pin list (user_pinned_docs), so
  // pinning here shows up in SliceDesk Docs / profile / home widget and
  // vice versa. Registered BEFORE /api/guides/:id so 'pins' isn't captured
  // as a guide id.
  app.get("/api/guides/pins", requireSliceUser, async (req, res, next) => {
    try {
      const rows = await hubFetch(`/api/ext/portal/pins?user_id=${encodeURIComponent(String(req.user.id))}`);
      for (const g of rows || []) _idToSlug.set(String(g.id), g.slug);
      res.json((rows || []).map((g) => toGuide(g)));
    } catch (e) { next(e); }
  });

  app.post("/api/guides/:id/pin", requireSliceUser, async (req, res, next) => {
    try {
      const slug = await slugForId(req.params.id);
      if (!slug) return res.status(404).json({ error: "not found" });
      await hubFetch("/api/ext/portal/pins", { method: "POST", body: { user_id: String(req.user.id), slug } });
      res.status(201).json({ pinned: true });
    } catch (e) { next(e); }
  });

  app.delete("/api/guides/:id/pin", requireSliceUser, async (req, res, next) => {
    try {
      const slug = await slugForId(req.params.id);
      if (!slug) return res.status(404).json({ error: "not found" });
      await hubFetch(`/api/ext/portal/pins?user_id=${encodeURIComponent(String(req.user.id))}&slug=${encodeURIComponent(slug)}`, { method: "DELETE" });
      res.json({ pinned: false });
    } catch (e) { next(e); }
  });

  // EXPORT — md | html | pdf, generated by SliceDesk and streamed through.
  app.get("/api/guides/:id/export", requireSliceUser, async (req, res, next) => {
    try {
      const slug = await slugForId(req.params.id);
      if (!slug) return res.status(404).json({ error: "not found" });
      const fmt = encodeURIComponent(String(req.query.format || "md"));
      const upstream = await fetch(`${moduleConfig.hubApiBase}/api/ext/portal/howto/${encodeURIComponent(slug)}/export?format=${fmt}`, {
        headers: { Authorization: `Bearer ${moduleConfig.apiKey}` },
      });
      if (!upstream.ok) {
        const body = await upstream.json().catch(() => ({}));
        return res.status(upstream.status).json({ error: body.error || `hub ${upstream.status}` });
      }
      res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/octet-stream");
      res.setHeader("Content-Disposition", upstream.headers.get("content-disposition") || "attachment");
      res.send(Buffer.from(await upstream.arrayBuffer()));
    } catch (e) { next(e); }
  });

  // DETAIL (id === numeric how_to_guides id → resolve to slug)
  app.get('/api/guides/:id', requireSliceUser, async (req, res, next) => {
    try {
      const slug = await slugForId(req.params.id);
      if (!slug) return res.status(404).json({ error: 'not found' });
      const g = await hubFetch(`/api/ext/portal/howto/${encodeURIComponent(slug)}`);
      res.json(toGuide(g, { withBody: true }));
    } catch (e) {
      if (e.status === 404) return res.status(404).json({ error: 'not found' });
      next(e);
    }
  });

  // FEEDBACK → shared SliceDesk counters (single source of truth)
  app.post('/api/guides/:id/feedback', requireSliceUser, async (req, res, next) => {
    const { rating } = req.body ?? {};
    if (rating !== 1 && rating !== -1) return res.status(400).json({ error: 'rating must be 1 or -1' });
    try {
      const slug = await slugForId(req.params.id);
      if (!slug) return res.status(404).json({ error: 'guide not found' });
      const r = await hubFetch(`/api/ext/portal/howto/${encodeURIComponent(slug)}/feedback`, {
        method: 'POST', body: { rating },
      });
      res.json({ id: req.params.id, helpful_count: r.helpful_count, unhelpful_count: r.unhelpful_count });
    } catch (e) {
      if (e.status === 404) return res.status(404).json({ error: 'guide not found' });
      next(e);
    }
  });

  // FEEDBACK DETAIL — SliceDesk tracks aggregate counters only (no per-vote log).
  app.get('/api/guides/:id/feedback-detail', requireSliceUser, async (req, res, next) => {
    try {
      const slug = await slugForId(req.params.id);
      if (!slug) return res.status(404).json({ error: 'guide not found' });
      const g = await hubFetch(`/api/ext/portal/howto/${encodeURIComponent(slug)}`);
      res.json({ helpful_count: g.helpful_count || 0, unhelpful_count: g.unhelpful_count || 0, items: [] });
    } catch (e) {
      if (e.status === 404) return res.status(404).json({ error: 'guide not found' });
      next(e);
    }
  });

  // Management has moved to SliceDesk Docs — disable local guide CRUD so the
  // two stores can't diverge. (Hide the corresponding admin buttons in the UI.)
  const moved = (_req, res) => res.status(409).json(CRUD_MOVED);
  app.post('/api/guides', requireSliceAdmin, moved);
  app.put('/api/guides/:id', requireSliceAdmin, moved);
  app.delete('/api/guides/:id', requireSliceAdmin, moved);
  app.post('/api/guides/:id/restore', requireSliceAdmin, moved);
  app.post('/api/guides/:id/duplicate', requireSliceAdmin, moved);
}
