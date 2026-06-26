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

// SliceDesk portal feed row → IT Hub guide shape.
function toGuide(g, { withBody = false } = {}) {
  return {
    id: g.slug, // stable opaque id the Portal frontend already passes through
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
      res.json((rows || []).map((g) => toGuide(g)));
    } catch (e) { next(e); }
  });

  // DETAIL (id === SliceDesk slug)
  app.get('/api/guides/:id', requireSliceUser, async (req, res, next) => {
    try {
      const g = await hubFetch(`/api/ext/portal/howto/${encodeURIComponent(req.params.id)}`);
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
      const r = await hubFetch(`/api/ext/portal/howto/${encodeURIComponent(req.params.id)}/feedback`, {
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
      const g = await hubFetch(`/api/ext/portal/howto/${encodeURIComponent(req.params.id)}`);
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
