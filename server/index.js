import express from 'express';
import pg from 'pg';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import {
  attachSliceUser,
  requireSliceUser,
  requireSliceAdmin,
} from './middleware/sliceAuth.js';

const PORT = Number(process.env.PORT) || 3001;
// Claude calls are proxied to slicedesk's /api/ai/proxy — it-hub never holds
// its own Anthropic key. CHAT_MODEL is sent in the proxy payload so the LLM
// version can be tuned per-app without re-deploying slicedesk.
const CHAT_MODEL = process.env.CHAT_MODEL || 'claude-sonnet-4-5';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://portal2:portal2@postgres:5432/portal2';

const pool = new pg.Pool({ connectionString: DATABASE_URL });

async function initDb() {
  const schema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
  for (let i = 0; i < 30; i++) {
    try {
      await pool.query(schema);
      console.log('[server] DB schema ready (FTS mode)');
      return;
    } catch (e) {
      console.log(`[server] DB not ready (${e.message}), retry ${i + 1}/30`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error('DB never became ready');
}

function fixedChunks(text, size, overlap) {
  if (text.length <= size) return [text];
  const out = [];
  const step = size - overlap;
  for (let i = 0; i < text.length; i += step) {
    out.push(text.slice(i, i + size));
    if (i + size >= text.length) break;
  }
  return out;
}

function chunkText(text, size = 800, overlap = 100) {
  const sections = text.split(/(?=^#{1,3} )/gm).filter((s) => s.trim());
  if (sections.length <= 1) return fixedChunks(text, size, overlap);
  const out = [];
  for (const section of sections) {
    if (section.length <= size * 1.5) out.push(section.trim());
    else out.push(...fixedChunks(section, size, overlap));
  }
  return out;
}

await initDb();

const app = express();
app.use(express.json({ limit: '10mb' }));

// ── Auth (slicedesk session bridge) ─────────────────────────────────────
// Every /api/* request gets req.user attached if the caller carries a
// valid slicedesk session cookie. Individual routes opt into hard
// enforcement via requireSliceUser / requireSliceAdmin below. /api/health
// stays open so the load-balancer / monitoring can reach it without
// shaking hands with slicedesk.
app.use('/api', attachSliceUser);

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    retrieval: 'postgres-fts',
    chat_model: CHAT_MODEL,
    slicedesk_proxy: !!process.env.SLICEDESK_API_URL,
  });
});

// /api/me-style endpoint scoped to it-hub — useful for the React app to
// learn who's logged in without reaching back to slicedesk directly.
app.get('/api/me', requireSliceUser, (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    role: req.user.role,
    roleLabel: req.user.roleLabel,
  });
});

app.get('/api/guides', requireSliceUser, async (req, res, next) => {
  try {
    const r = await pool.query(
      `SELECT id, title, category, tags, source_type, metadata,
              helpful_count, unhelpful_count, created_at, updated_at
         FROM guides
        WHERE deleted_at IS NULL
        ORDER BY updated_at DESC`,
    );
    res.json(r.rows);
  } catch (e) { next(e); }
});

// Trashed guides — newest-deleted first.
app.get('/api/admin/trash', requireSliceAdmin, async (req, res, next) => {
  try {
    const r = await pool.query(
      `SELECT id, title, category, tags, source_type,
              helpful_count, unhelpful_count, created_at, updated_at, deleted_at
         FROM guides
        WHERE deleted_at IS NOT NULL
        ORDER BY deleted_at DESC`,
    );
    res.json(r.rows);
  } catch (e) { next(e); }
});

app.get('/api/guides/:id', requireSliceUser, async (req, res, next) => {
  try {
    const r = await pool.query(
      'SELECT * FROM guides WHERE id = $1 AND deleted_at IS NULL',
      [req.params.id],
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'not found' });
    res.json(r.rows[0]);
  } catch (e) { next(e); }
});

app.post('/api/guides', requireSliceAdmin, async (req, res, next) => {
  const { title, category, body, tags, source_type, metadata } = req.body ?? {};
  if (!title || !body) return res.status(400).json({ error: 'title and body required' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const g = await client.query(
      `INSERT INTO guides (title, category, body, tags, source_type, metadata)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb) RETURNING *`,
      [
        title,
        category ?? null,
        body,
        Array.isArray(tags) ? tags : [],
        source_type || 'guide',
        JSON.stringify(metadata ?? {}),
      ],
    );
    const guide = g.rows[0];
    const chunks = chunkText(body);
    for (let i = 0; i < chunks.length; i++) {
      await client.query(
        'INSERT INTO guide_chunks (guide_id, chunk_index, content) VALUES ($1, $2, $3)',
        [guide.id, i, chunks[i]],
      );
    }
    await client.query('COMMIT');
    res.json({ ...guide, chunk_count: chunks.length });
  } catch (e) {
    await client.query('ROLLBACK');
    next(e);
  } finally {
    client.release();
  }
});

app.put('/api/guides/:id', requireSliceAdmin, async (req, res, next) => {
  const { title, category, body, tags, source_type, metadata } = req.body ?? {};
  if (!title || !body) return res.status(400).json({ error: 'title and body required' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const g = await client.query(
      `UPDATE guides
          SET title=$1, category=$2, body=$3, tags=$4, source_type=$5, metadata=$6::jsonb, updated_at=NOW()
        WHERE id=$7 RETURNING *`,
      [
        title,
        category ?? null,
        body,
        Array.isArray(tags) ? tags : [],
        source_type || 'guide',
        JSON.stringify(metadata ?? {}),
        req.params.id,
      ],
    );
    if (g.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'not found' });
    }
    await client.query('DELETE FROM guide_chunks WHERE guide_id=$1', [req.params.id]);
    const chunks = chunkText(body);
    for (let i = 0; i < chunks.length; i++) {
      await client.query(
        'INSERT INTO guide_chunks (guide_id, chunk_index, content) VALUES ($1, $2, $3)',
        [req.params.id, i, chunks[i]],
      );
    }
    await client.query('COMMIT');
    res.json({ ...g.rows[0], chunk_count: chunks.length });
  } catch (e) {
    await client.query('ROLLBACK');
    next(e);
  } finally {
    client.release();
  }
});

// DELETE is soft by default — sets deleted_at. The chunks stay so a Restore is
// instant. Pass ?hard=1 to permanently purge a row that's already in the trash;
// ON DELETE CASCADE on guide_chunks handles index cleanup.
app.delete('/api/guides/:id', requireSliceAdmin, async (req, res, next) => {
  try {
    if (req.query.hard === '1') {
      const r = await pool.query(
        'DELETE FROM guides WHERE id = $1 AND deleted_at IS NOT NULL RETURNING id',
        [req.params.id],
      );
      if (r.rows.length === 0) {
        return res.status(409).json({ error: 'permanent delete requires the guide to be in trash first' });
      }
      return res.json({ ok: true, hard: true });
    }
    const r = await pool.query(
      `UPDATE guides SET deleted_at = NOW()
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING id`,
      [req.params.id],
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'not found' });
    res.json({ ok: true, soft: true });
  } catch (e) { next(e); }
});

app.post('/api/guides/:id/restore', requireSliceAdmin, async (req, res, next) => {
  try {
    const r = await pool.query(
      `UPDATE guides SET deleted_at = NULL, updated_at = NOW()
        WHERE id = $1 AND deleted_at IS NOT NULL
        RETURNING id, title`,
      [req.params.id],
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'not in trash' });
    res.json({ ok: true, ...r.rows[0] });
  } catch (e) { next(e); }
});

app.post('/api/guides/:id/duplicate', requireSliceAdmin, async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orig = await client.query('SELECT * FROM guides WHERE id=$1 AND deleted_at IS NULL', [req.params.id]);
    if (orig.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'not found' });
    }
    const o = orig.rows[0];
    const g = await client.query(
      `INSERT INTO guides (title, category, body, tags, source_type, metadata)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb) RETURNING *`,
      [o.title + ' (copy)', o.category, o.body, o.tags || [], o.source_type, JSON.stringify(o.metadata || {})],
    );
    const copy = g.rows[0];
    const chunks = chunkText(copy.body);
    for (let i = 0; i < chunks.length; i++) {
      await client.query(
        'INSERT INTO guide_chunks (guide_id, chunk_index, content) VALUES ($1, $2, $3)',
        [copy.id, i, chunks[i]],
      );
    }
    await client.query('COMMIT');
    res.json({ ...copy, chunk_count: chunks.length });
  } catch (e) {
    await client.query('ROLLBACK');
    next(e);
  } finally {
    client.release();
  }
});

// =========== Image upload (base64 → file) ===========
const UPLOAD_DIR = '/app/uploads';
await mkdir(UPLOAD_DIR, { recursive: true }).catch(() => {});
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d', immutable: true }));

app.post('/api/uploads', requireSliceAdmin, async (req, res, next) => {
  try {
    const { dataUrl, filename } = req.body ?? {};
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
      return res.status(400).json({ error: 'dataUrl must be an image data URL' });
    }
    const m = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!m) return res.status(400).json({ error: 'malformed data URL' });
    const ext = (m[1].split('/')[1] || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
    const buf = Buffer.from(m[2], 'base64');
    if (buf.length > 8 * 1024 * 1024) return res.status(413).json({ error: 'image too large (8 MB max)' });
    const safe = String(filename || 'image').replace(/[^a-z0-9._-]/gi, '_').slice(0, 40).replace(/\.[^.]*$/, '');
    const final = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe || 'image'}.${ext}`;
    await writeFile(path.join(UPLOAD_DIR, final), buf);
    res.json({ url: `/uploads/${final}`, bytes: buf.length });
  } catch (e) { next(e); }
});

app.post('/api/guides/:id/feedback', requireSliceUser, async (req, res, next) => {
  const { rating } = req.body ?? {};
  if (rating !== 1 && rating !== -1) return res.status(400).json({ error: 'rating must be 1 or -1' });
  try {
    const col = rating === 1 ? 'helpful_count' : 'unhelpful_count';
    const r = await pool.query(
      `UPDATE guides SET ${col} = ${col} + 1 WHERE id = $1 AND deleted_at IS NULL
       RETURNING id, helpful_count, unhelpful_count`,
      [req.params.id],
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'guide not found' });
    res.json(r.rows[0]);
  } catch (e) { next(e); }
});

app.get('/api/chats/:id', requireSliceUser, async (req, res, next) => {
  try {
    const chat = await pool.query('SELECT * FROM chat_logs WHERE id=$1', [req.params.id]);
    if (chat.rows.length === 0) return res.status(404).json({ error: 'not found' });
    const fb = await pool.query(
      'SELECT rating, comment, created_at FROM chat_feedback WHERE chat_log_id=$1 ORDER BY created_at',
      [req.params.id],
    );
    const chunkIds = chat.rows[0].retrieved_chunk_ids ?? [];
    let chunks = [];
    if (chunkIds.length > 0) {
      const cs = await pool.query(
        `SELECT gc.id, gc.guide_id, gc.chunk_index, gc.content, g.title, g.source_type
           FROM guide_chunks gc JOIN guides g ON g.id=gc.guide_id
          WHERE gc.id = ANY($1::int[])`,
        [chunkIds],
      );
      const byId = new Map(cs.rows.map((r) => [r.id, r]));
      chunks = chunkIds.map((id) => byId.get(id)).filter(Boolean);
    }
    res.json({ ...chat.rows[0], feedback: fb.rows, chunks });
  } catch (e) { next(e); }
});

// =========== /api/chat — Postgres FTS ===========
async function ftsSearch(query) {
  // Strip non-word chars except spaces, then build a tsquery.
  const tokens = query.toLowerCase().replace(/[^\w\s'-]/g, ' ').split(/\s+/).filter((w) => w.length >= 2);
  if (tokens.length === 0) return [];

  // First try strict (all stems must match).
  const strict = await pool.query(
    `SELECT gc.id AS chunk_id, gc.content, gc.guide_id,
            g.title, g.category, g.source_type, g.helpful_count,
            ts_rank_cd(gc.tsv, q) AS rank
       FROM plainto_tsquery('english', $1) q,
            guide_chunks gc
       JOIN guides g ON g.id = gc.guide_id
      WHERE gc.tsv @@ q AND g.deleted_at IS NULL
      ORDER BY rank DESC, g.helpful_count DESC, gc.id ASC
      LIMIT 5`,
    [query],
  );
  if (strict.rows.length > 0) return strict.rows;

  // Fallback: any-word match (OR), boosted by helpful_count.
  const orQuery = tokens.map((t) => t.replace(/[^\w]/g, '')).filter(Boolean).join(' | ');
  if (!orQuery) return [];
  const loose = await pool.query(
    `SELECT gc.id AS chunk_id, gc.content, gc.guide_id,
            g.title, g.category, g.source_type, g.helpful_count,
            ts_rank_cd(gc.tsv, q) AS rank
       FROM to_tsquery('english', $1) q,
            guide_chunks gc
       JOIN guides g ON g.id = gc.guide_id
      WHERE gc.tsv @@ q AND g.deleted_at IS NULL
      ORDER BY rank DESC, g.helpful_count DESC, gc.id ASC
      LIMIT 5`,
    [orQuery],
  );
  if (loose.rows.length > 0) return loose.rows;

  // Last resort: trigram similarity on titles (catches typos / fragments).
  const trgm = await pool.query(
    `SELECT gc.id AS chunk_id, gc.content, gc.guide_id,
            g.title, g.category, g.source_type, g.helpful_count,
            similarity(g.title, $1) AS rank
       FROM guides g
       JOIN guide_chunks gc ON gc.guide_id = g.id AND gc.chunk_index = 0
      WHERE g.title % $1 AND g.deleted_at IS NULL
      ORDER BY rank DESC, g.helpful_count DESC
      LIMIT 5`,
    [query],
  );
  return trgm.rows;
}

app.post('/api/chat', requireSliceUser, async (req, res, next) => {
  const { query } = req.body ?? {};
  if (!query) return res.status(400).json({ error: 'query required' });
  try {
    const matches = await ftsSearch(query);

    const citations = matches.map((r, i) => ({
      index: i + 1,
      chunk_id: r.chunk_id,
      guide_id: r.guide_id,
      title: r.title,
      category: r.category,
      source_type: r.source_type,
      helpful_count: r.helpful_count,
      content_preview: r.content.length > 280 ? r.content.slice(0, 280) + '…' : r.content,
    }));

    let answer = null;
    let usage = null;
    let mode = 'retrieval';

    // Claude calls go through slicedesk's /api/ai/proxy — that endpoint
    // owns the Anthropic API key, billing, and audit logs. We just POST
    // the messages payload and forward the user's session cookie so
    // slicedesk can authenticate the call.
    const SLICEDESK_API_URL = (process.env.SLICEDESK_API_URL || '').replace(/\/$/, '');
    if (SLICEDESK_API_URL && matches.length > 0) {
      const context = matches
        .map((r, i) => `[${i + 1}] from "${r.title}" (guide #${r.guide_id}, category: ${r.category ?? 'general'})\n${r.content}`)
        .join('\n\n---\n\n');
      try {
        const upstream = await fetch(`${SLICEDESK_API_URL}/api/ai/proxy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
            // Forward the caller's slicedesk session cookie so the
            // proxy's requireAuth middleware lets us through.
            Cookie: req.headers.cookie || '',
          },
          body: JSON.stringify({
            model: CHAT_MODEL,
            max_tokens: 1024,
            system:
              "You are a helpful IT support assistant for an internal company knowledge base. " +
              "When the user asks a question, the user message will include <knowledge_base> excerpts. " +
              "Answer using ONLY those excerpts. Cite sources with [N] notation matching the excerpt headers. " +
              "If the excerpts don't contain the answer, say so plainly and suggest filing a ticket. " +
              "Keep responses short and actionable — IT users want steps, not essays.",
            messages: [
              {
                role: 'user',
                content:
                  `<knowledge_base>\n${context}\n</knowledge_base>\n\n` +
                  `<question>\n${query}\n</question>`,
              },
            ],
          }),
        });
        if (upstream.ok) {
          const msg = await upstream.json();
          answer = (msg.content || [])
            .filter((b) => b.type === 'text')
            .map((b) => b.text)
            .join('\n');
          usage = msg.usage || null;
          mode = 'llm';
        } else {
          console.warn('[chat] slicedesk proxy', upstream.status, await upstream.text().catch(() => ''));
        }
      } catch (err) {
        // Slicedesk unreachable / proxy error → fall back to retrieval-only
        // mode so the chatbot still returns the citations rather than 500.
        console.warn('[chat] slicedesk proxy failed:', err.message);
      }
    }

    const log = await pool.query(
      `INSERT INTO chat_logs (query, answer, retrieved_chunk_ids, citations, mode)
       VALUES ($1, $2, $3, $4::jsonb, $5) RETURNING id`,
      [query, answer, matches.map((r) => r.chunk_id), JSON.stringify(citations), mode],
    );

    res.json({
      chat_log_id: log.rows[0].id,
      mode,
      answer,
      citations,
      usage,
    });
  } catch (e) { next(e); }
});

app.post('/api/chat/:id/feedback', requireSliceUser, async (req, res, next) => {
  const { rating, comment } = req.body ?? {};
  if (rating !== 1 && rating !== -1) return res.status(400).json({ error: 'rating must be 1 or -1' });
  try {
    await pool.query(
      `INSERT INTO chat_feedback (chat_log_id, rating, comment) VALUES ($1, $2, $3)`,
      [req.params.id, rating, comment ?? null],
    );
    const log = await pool.query(`SELECT citations FROM chat_logs WHERE id = $1`, [req.params.id]);
    if (log.rows[0]) {
      const guideIds = (log.rows[0].citations ?? []).map((c) => c.guide_id).filter(Boolean);
      if (guideIds.length > 0) {
        const col = rating === 1 ? 'helpful_count' : 'unhelpful_count';
        await pool.query(`UPDATE guides SET ${col} = ${col} + 1 WHERE id = ANY($1::int[])`, [guideIds]);
      }
    }
    res.json({ ok: true });
  } catch (e) { next(e); }
});

app.get('/api/admin/insights', requireSliceAdmin, async (req, res, next) => {
  try {
    const [
      topAsked, noMatch, downvoted, wordsRes,
      daily, underperforming, gapWordsRes,
    ] = await Promise.all([
      pool.query(`
        SELECT lower(trim(query)) AS q, COUNT(*)::int AS n,
               MAX(created_at) AS last_seen
          FROM chat_logs
         WHERE length(trim(query)) > 0
         GROUP BY lower(trim(query))
         ORDER BY n DESC, MAX(created_at) DESC
         LIMIT 15
      `),
      pool.query(`
        SELECT lower(trim(query)) AS q, COUNT(*)::int AS n,
               MAX(created_at) AS last_seen
          FROM chat_logs
         WHERE coalesce(array_length(retrieved_chunk_ids, 1), 0) = 0
         GROUP BY lower(trim(query))
         ORDER BY n DESC, MAX(created_at) DESC
         LIMIT 10
      `),
      pool.query(`
        SELECT lower(trim(cl.query)) AS q,
               COUNT(*)::int AS n_neg,
               MAX(cl.created_at) AS last_seen
          FROM chat_logs cl
          JOIN chat_feedback cf ON cf.chat_log_id = cl.id
         WHERE cf.rating = -1
         GROUP BY lower(trim(cl.query))
         ORDER BY n_neg DESC, MAX(cl.created_at) DESC
         LIMIT 10
      `),
      pool.query({
        text: "SELECT word, ndoc::int AS docs FROM ts_stat($1) WHERE length(word) > 2 ORDER BY ndoc DESC, word ASC LIMIT 30",
        values: [`SELECT to_tsvector('english', coalesce(query, '')) FROM chat_logs`],
      }).catch(() => ({ rows: [] })),
      // 14-day stacked timeseries: per day, count chats by outcome bucket.
      // generate_series gives us a row even on zero-volume days so the chart
      // doesn't collapse holes. The per-chat bucket is decided once via a
      // sub-aggregation, then bucket counts are pivoted.
      pool.query(`
        WITH days AS (
          SELECT generate_series(
            (date_trunc('day', NOW()) - INTERVAL '13 days')::date,
            date_trunc('day', NOW())::date,
            INTERVAL '1 day'
          )::date AS day
        ),
        chat_buckets AS (
          SELECT
            date_trunc('day', cl.created_at)::date AS day,
            CASE
              WHEN COALESCE(array_length(cl.retrieved_chunk_ids, 1), 0) = 0 THEN 'no_match'
              WHEN COALESCE(SUM(cf.rating), 0) > 0 THEN 'helpful'
              WHEN COALESCE(SUM(cf.rating), 0) < 0 THEN 'unhelpful'
              ELSE 'no_feedback'
            END AS bucket
            FROM chat_logs cl
       LEFT JOIN chat_feedback cf ON cf.chat_log_id = cl.id
           WHERE cl.created_at >= NOW() - INTERVAL '14 days'
        GROUP BY cl.id, day, cl.retrieved_chunk_ids
        )
        SELECT
          d.day,
          COUNT(*) FILTER (WHERE cb.bucket = 'helpful')::int     AS helpful,
          COUNT(*) FILTER (WHERE cb.bucket = 'unhelpful')::int   AS unhelpful,
          COUNT(*) FILTER (WHERE cb.bucket = 'no_feedback')::int AS no_feedback,
          COUNT(*) FILTER (WHERE cb.bucket = 'no_match')::int    AS no_match
        FROM days d
        LEFT JOIN chat_buckets cb ON cb.day = d.day
        GROUP BY d.day
        ORDER BY d.day
      `),
      // Underperforming guides: ≥5 total ratings AND helpful share < 60%.
      // Ranked by raw downvote count so the most-flagged sit on top — that
      // matches operator intuition ("which guides are hurting users most").
      pool.query(`
        SELECT id, title, source_type, helpful_count, unhelpful_count,
               ROUND((helpful_count::numeric / NULLIF(helpful_count + unhelpful_count, 0)) * 100)::int AS helpful_pct,
               (helpful_count + unhelpful_count) AS total_ratings
          FROM guides
         WHERE deleted_at IS NULL
           AND (helpful_count + unhelpful_count) >= 5
           AND helpful_count::numeric / NULLIF(helpful_count + unhelpful_count, 0) < 0.6
         ORDER BY unhelpful_count DESC, total_ratings DESC
         LIMIT 10
      `),
      // Word cloud over no-match queries only — surfaces what the corpus is
      // missing rather than what users ask in general.
      pool.query({
        text: "SELECT word, ndoc::int AS docs FROM ts_stat($1) WHERE length(word) > 2 ORDER BY ndoc DESC, word ASC LIMIT 30",
        values: [`SELECT to_tsvector('english', coalesce(query, '')) FROM chat_logs WHERE COALESCE(array_length(retrieved_chunk_ids, 1), 0) = 0`],
      }).catch(() => ({ rows: [] })),
    ]);
    res.json({
      most_asked: topAsked.rows,
      no_match: noMatch.rows,
      downvoted: downvoted.rows,
      trending_words: wordsRes.rows,
      daily: daily.rows,
      underperforming: underperforming.rows,
      gap_words: gapWordsRes.rows,
    });
  } catch (e) { next(e); }
});

app.get('/api/admin/stats', requireSliceAdmin, async (req, res, next) => {
  try {
    const [guideCount, trashCount, chunkCount, chatCount, recentChats, topGuides, lowGuides] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS n FROM guides WHERE deleted_at IS NULL'),
      pool.query('SELECT COUNT(*)::int AS n FROM guides WHERE deleted_at IS NOT NULL'),
      pool.query(`SELECT COUNT(*)::int AS n FROM guide_chunks gc
                    JOIN guides g ON g.id = gc.guide_id
                   WHERE g.deleted_at IS NULL`),
      pool.query('SELECT COUNT(*)::int AS n FROM chat_logs'),
      pool.query(`
        SELECT cl.id, cl.query, cl.mode, cl.created_at,
               COALESCE(SUM(cf.rating), 0)::int AS net_rating,
               COUNT(cf.id)::int AS feedback_count,
               COALESCE(array_length(cl.retrieved_chunk_ids, 1), 0)::int AS chunk_count,
               (cl.citations->0->>'title') AS top_citation_title,
               NULLIF(cl.citations->0->>'guide_id','')::int AS top_citation_guide_id
          FROM chat_logs cl LEFT JOIN chat_feedback cf ON cf.chat_log_id = cl.id
         GROUP BY cl.id ORDER BY cl.created_at DESC LIMIT 200`),
      pool.query(`SELECT id, title, helpful_count FROM guides
                   WHERE helpful_count > 0 AND deleted_at IS NULL
                   ORDER BY helpful_count DESC LIMIT 10`),
      pool.query(`SELECT id, title, unhelpful_count FROM guides
                   WHERE unhelpful_count > 0 AND deleted_at IS NULL
                   ORDER BY unhelpful_count DESC LIMIT 10`),
    ]);
    res.json({
      counts: {
        guides: guideCount.rows[0].n,
        trash: trashCount.rows[0].n,
        chunks: chunkCount.rows[0].n,
        chats: chatCount.rows[0].n,
      },
      recent_chats: recentChats.rows,
      most_helpful: topGuides.rows,
      most_unhelpful: lowGuides.rows,
    });
  } catch (e) { next(e); }
});

app.use((err, req, res, _next) => {
  console.error('[server]', err);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, '0.0.0.0', () => console.log(`[server] FTS listening on :${PORT}`));
