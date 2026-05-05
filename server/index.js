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
// In production this app is mounted under /portal/ on the slicedesk
// domain, so any URLs we hand back (image upload URLs, etc.) need to
// include that prefix or the browser will resolve them against the
// origin root and 404. Empty string in dev (no prefix) is fine.
const URL_PREFIX = (process.env.URL_PREFIX || '').replace(/\/$/, '');

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
    res.json({ url: `${URL_PREFIX}/uploads/${final}`, bytes: buf.length });
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

// ────────────────────────────────────────────────────────────────────────
// AI editor + insights actions, all through slicedesk's /api/ai/proxy.
//
// Single endpoint with an `action` discriminator so the admin UI doesn't
// need a dozen routes. Each action maps to a system prompt + a message
// shape; the proxy hands back Claude's raw response and we extract the
// text. Image actions accept a base64 data URL (same shape the existing
// uploader uses) and route it to Claude via the vision message format.
// ────────────────────────────────────────────────────────────────────────

const AI_PROMPTS = {
  improve:    "Tighten and polish the user's text. Keep the voice. Don't change meaning. Output ONLY the rewritten text — no preamble, no explanation, no markdown fence.",
  shorter:    "Rewrite the user's text to be roughly half the length while preserving every fact and step. Output ONLY the shorter text.",
  longer:     "Expand the user's text with concrete details, examples, and edge cases relevant to internal-IT users. Keep the same structure. Output ONLY the expanded text.",
  grammar:    "Fix grammar, spelling, and punctuation in the user's text. Don't restructure or re-word. Output ONLY the corrected text.",
  'tone-pro': "Rewrite the user's text in a crisp, neutral, business-ready tone. Keep the same content. Output ONLY the rewritten text.",
  'tone-friendly': "Rewrite the user's text in a warm, conversational tone — like a senior IT teammate explaining it. Output ONLY the rewritten text.",
  bullets:    "Convert the user's text into a tight bullet list. Each bullet one idea. Output ONLY the markdown bullet list.",
  steps:      "You're rewriting an IT-support guide for non-technical employees. Convert the user's text into numbered markdown steps. Rules:\n  - Each step starts with an imperative verb (Open, Click, Enter, Confirm, Verify, Wait for…).\n  - One action per step — split combined sentences.\n  - If a step requires something first (e.g. 'Connected to VPN' or 'Admin role'), add a `> Before you start:` line above the list.\n  - If a step commonly fails, add a sub-bullet under it starting with `If you don't see…` or `If this fails…`.\n  - Use **bold** for any UI label, button name, menu item, or keyboard shortcut the reader has to find.\n  - Don't add steps that aren't in the source; preserve every fact.\nOutput ONLY the numbered markdown list, plus the optional `> Before…` quote line.",
  'steps-from-title': "You're drafting an IT-support guide from scratch. Given the guide title, output a numbered markdown list of 4–8 steps a non-technical employee can follow to accomplish it. Same rules as the 'steps' transform: imperative verbs, one action per step, **bold** UI labels, optional `> Before you start:` line above, optional `If this fails…` sub-bullets where relevant. Output ONLY the markdown list (and optional Before-you-start line).",
  categorize: "You're tagging an internal IT support guide. Look at the title and body and output a single JSON object on one line, no markdown fence: {\"category\":\"...\",\"tags\":[\"...\",\"...\",\"...\"]}\n  - category: one short phrase, lowercase except first letter (examples: \"Passwords & MFA\", \"Networking\", \"Hardware\", \"Email & calendar\", \"Onboarding\", \"Apps & licenses\", \"VPN & remote access\")\n  - tags: 3–6 lowercase keywords a user might search for (examples: \"onelogin\", \"sso\", \"reset\", \"locked-out\")\nOutput ONLY the JSON object.",
  'topic-cluster': "You're an IT-support analyst looking at the questions employees recently asked the IT-Hub chatbot. Group them into topics and rank GAPS — topics that don't have a good existing guide.\n\nQuestion lines come tagged with signals:\n- '👎' = the user thumbs-down'd the answer they got (confirmed gap)\n- '🚫no-match' = the chatbot found no matching guide at all\nBoth signals weigh much heavier than raw frequency — surface these topics first.\n\nOnly include a topic in your output if it represents a GAP (covered=false). Skip topics where an existing guide clearly answers the question.\n\nOutput a single JSON object on one line, no markdown fence:\n  {\"topics\":[{\"topic\":\"...\",\"count\":N,\"thumbs_down\":N,\"no_match\":N,\"sample_questions\":[\"...\",\"...\"],\"covered\":false,\"suggested_guide_title\":\"...\",\"why_gap\":\"...\"}]}\n- topic: short noun phrase (e.g. 'macOS keychain reset after password change')\n- count: how many questions belong to this cluster\n- thumbs_down: count of 👎-flagged questions in this cluster (0 if none)\n- no_match: count of 🚫-flagged questions in this cluster (0 if none)\n- sample_questions: 1–3 verbatim user questions, prioritise the flagged ones\n- covered: always false (this list is gaps only)\n- suggested_guide_title: short, action-oriented title for the new guide\n- why_gap: one sentence explaining why no existing guide covers this — refer to the existing guide titles where helpful\nReturn 5–12 topics, sorted by (thumbs_down + no_match * 2) desc, then by count desc.",
  'did-you-mean': "An IT employee asked the chatbot a question that didn't have a confident answer in the knowledge base. Look at their question and the list of every existing guide title, and pick the 2–3 guides MOST LIKELY to be useful even if they don't directly answer it (e.g. cover the same app, the same workflow, or a common neighbouring problem). For each, give a one-sentence reason in plain language an employee would understand.\nOutput a single JSON object on one line, no markdown fence:\n  {\"suggestions\":[{\"guide_title\":\"...\",\"reason\":\"...\"}]}\nIf nothing in the list is even tangentially related, output {\"suggestions\":[]}. Do not invent guides — only use titles from the provided list.",
  table:      "If the user's text has a 'X | Y | Z' / list / labelled-pair structure, convert it to a markdown table. Otherwise return the input unchanged. Output ONLY the table or the original.",
  summary:    "Write a one-paragraph TL;DR of the user's text — what it's for, when to use it, the single most important step. Output ONLY the paragraph.",
  continue:   "Continue the user's text in the same voice and structure. Add 2–4 sentences max. Output ONLY the continuation, no overlap with the existing text.",
  brainstorm: "The user is starting a guide titled below. Output a markdown bullet list of 6–10 section headings (## level) the guide should cover. No prose, just the headings.",
  // Image-only actions
  'image-alt':     "Look at this screenshot from an internal IT support guide. Write one short sentence (max ~140 chars) describing what the screenshot shows — focus on the UI element or app and the key piece of info visible. Output ONLY the alt text, no quotes.",
  'image-extract': "Look at this screenshot. Extract any visible text, error messages, button labels, or step indicators. Output as plain text in the order they appear, top-to-bottom. If the image has no text, output ONE LINE describing what's shown.",
  // Help-page triage: turn a free-form user query into 2–3 tailored
  // multiple-choice clarifying questions so the chatbot's downstream
  // answer can target the actual problem instead of a generic bucket.
  clarify: "You're an IT support triage assistant for Slice employees. The user typed a problem into the help page. Generate 2–3 short multiple-choice clarifying questions that pin down the exact issue, in order of importance:\n  1. SUBJECT — which device / app / account / item is affected (skip this if the query already names it specifically)\n  2. SYMPTOM — what's actually happening (won't connect, no audio, error message, slow, crashing, …)\n  3. CONTEXT — when it started, what changed, what they've already tried (only if it would actually steer the fix)\n\nSlice environment — these are the ONLY tools you should reference in options. Never invent vendors that aren't in this list:\n  - SSO / identity: **OneLogin** (NOT Okta, NOT Azure AD, NOT Google SSO directly)\n  - MFA app: **OneLogin Protect** (NOT Duo, NOT Authy, NOT Google Authenticator)\n  - Email + calendar: **Gmail** and **Google Workspace** — Slice does **NOT** use Outlook, Microsoft 365, Hotmail, or Exchange. Never offer those as options.\n  - Devices: MacBooks (provisioned by **Jamf**) and Windows laptops (provisioned by **Microsoft Intune**).\n  - Mac login uses a **local password set at provisioning** (NOT OneLogin). Windows login uses **OneLogin**.\n  - VPN: **GlobalProtect** (NOT Cisco AnyConnect, NOT WARP, NOT NordLayer).\n  - Team chat: **Slack** (NOT Teams).\n  - Shared passwords: **1Password** (NOT LastPass, NOT Bitwarden).\n  - Headsets: **Jabra USB** (wired USB, not Bluetooth).\n  - Customer-support agents use **Amazon Connect inside Salesforce** — the soft-phone is **CCP**.\n  - Internal ticket portal: https://it.slicelife.com (referred to as **Support**).\n\nRules:\n  - Each question is type 'choice' with 3–5 options, plus an 'Other / not sure' option as the LAST option (id 'other').\n  - Each option has: id (short kebab-case), label (short noun phrase or clause), and an OPTIONAL hint (one short clarifying phrase, ≤ 6 words).\n  - Use plain employee-friendly language. No jargon, no 'have you considered'.\n  - Do NOT ask questions whose answer is already obvious from the user's query.\n  - If the query is already extremely specific, return ONLY 1–2 questions (skip context).\n  - Never ask about urgency or severity — that's not useful for routing the fix.\n  - When listing apps/services as options, ONLY use names from the Slice environment list above. If the relevant tool isn't there (e.g. user mentions a third-party SaaS like Figma or Notion), you may use that name verbatim from the user's query.\n\nOutput ONE JSON object on one line, no markdown fence:\n  {\"questions\":[{\"id\":\"subject\",\"label\":\"...\",\"type\":\"choice\",\"options\":[{\"id\":\"...\",\"label\":\"...\",\"hint\":\"...\"}]}]}",
  // Admin: full guide draft from a structured spec. The user fills out a
  // small form (topic, app/device, audience, type, tone, length, extras);
  // the spec is sent here as JSON and Claude produces a Slice-flavoured
  // markdown draft + suggested metadata.
  'ai-write-guide': "You're drafting an internal IT-support guide for Slice (the pizzeria platform). The user message is a single JSON object with the spec.\n\nSlice environment — assume these unless the spec says otherwise:\n- Devices: MacBooks (Apple Silicon) and Windows laptops/desktops are both common.\n- MDM: **Jamf** provisions MacBooks; **Microsoft Intune** provisions Windows. The IT Team uses these to push apps, policies, and updates.\n- Login on the laptop:\n  - **Windows (Intune)**: users sign in with their **OneLogin** credentials.\n  - **macOS (Jamf)**: users sign in with a **local password set at provisioning** (NOT OneLogin). Keychain may need refreshing after a OneLogin password change.\n- Email + productivity: **Gmail** and **Google Workspace** (Drive, Docs, Sheets, Calendar). Slice does **NOT** use Outlook or Microsoft 365 — never suggest those.\n- Shared / team passwords: **1Password** vaults. Never recommend pasting credentials in Slack or Google Docs.\n- Team chat: **Slack** is the company-wide chat.\n- Headphones: Jabra USB headsets (wired USB, not Bluetooth) are standard.\n- VPN: GlobalProtect on both macOS and Windows.\n- Customer-support agents also use Amazon Connect inside Salesforce — the soft-phone is the **CCP** (Contact Control Panel).\n- AI tooling: **Claude** (chat) and **Claude Code** (engineering CLI) are the company AI tools.\n- Internal IT team is just **the IT Team** — no sub-teams. When you mention escalation, always say 'the IT Team'.\n- Internal IT ticket portal: https://it.slicelife.com — refer to it as **Support**.\n\nWriting rules:\n- Match the requested type (howto / troubleshoot / runbook / faq / announcement / incident) and tone (friendly / professional / concise / detailed) and length (short ~150w / medium ~400w / long ~800w).\n- Use ## sub-headings, numbered steps for sequences, and **bold** for UI labels and shortcuts.\n- Each step starts with an imperative verb (Open, Click, Enter, Verify…), one action per step.\n- Include a `> Before you start:` line above the first list when prerequisites apply (signed in, on VPN, etc.).\n- Add `If this fails…` sub-bullets under steps that commonly break.\n- Reference specific Slice tools when relevant (GlobalProtect, Jabra USB, CCP in Salesforce, Slack).\n- End with a short troubleshooting / escalation section that points to **Support** as a markdown link to https://it.slicelife.com — always direct users to the IT Team there, not any other team name.\n- Don't include the leading `# Title` — title is stored separately.\n\nOutput ONE JSON object on one line, no markdown fence:\n  {\"title\":\"...\",\"category\":\"...\",\"tags\":[\"...\",\"...\"],\"sourceType\":\"guide|runbook|faq|announcement\",\"body\":\"... markdown ...\"}\nThe body uses real newlines (\\n). Keep tags lowercase, 3–6 of them.",
};

async function callClaudeProxy(req, { system, messages, max_tokens = 1024 }) {
  const SLICEDESK_API_URL = (process.env.SLICEDESK_API_URL || '').replace(/\/$/, '');
  if (!SLICEDESK_API_URL) throw new Error('SLICEDESK_API_URL not configured');
  const upstream = await fetch(`${SLICEDESK_API_URL}/api/ai/proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      Cookie: req.headers.cookie || '',
    },
    body: JSON.stringify({ model: CHAT_MODEL, max_tokens, system, messages }),
  });
  if (!upstream.ok) {
    const body = await upstream.text().catch(() => '');
    throw new Error(`proxy ${upstream.status}: ${body.slice(0, 200)}`);
  }
  const j = await upstream.json();
  const text = (j.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
  return { text, usage: j.usage || null };
}

app.post('/api/ai-edit', requireSliceAdmin, async (req, res, next) => {
  const { action, text, title, imageDataUrl } = req.body ?? {};
  if (!AI_PROMPTS[action]) {
    return res.status(400).json({ error: `unknown action: ${action}. valid: ${Object.keys(AI_PROMPTS).join(', ')}` });
  }
  const system = AI_PROMPTS[action];

  try {
    let messages;
    if (action.startsWith('image-')) {
      // Vision: parse data URL → { type: 'base64', media_type, data }
      const m = String(imageDataUrl || '').match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (!m) return res.status(400).json({ error: 'imageDataUrl must be a base64 image data URL' });
      messages = [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } },
          { type: 'text', text: 'Apply the system instructions to this image.' },
        ],
      }];
    } else if (action === 'brainstorm') {
      // Brainstorm uses the title (not the body) as input.
      const t = String(title || text || '').slice(0, 400);
      if (!t.trim()) return res.status(400).json({ error: 'title required for brainstorm' });
      messages = [{ role: 'user', content: `Guide title: ${t}` }];
    } else if (action === 'ai-write-guide') {
      // Spec-driven full draft. Body should be a JSON spec from the modal.
      const t = String(text || '').slice(0, 4000);
      if (!t.trim()) return res.status(400).json({ error: 'spec required' });
      messages = [{ role: 'user', content: t }];
    } else {
      const t = String(text || '').slice(0, 8000);
      if (!t.trim()) return res.status(400).json({ error: 'text required' });
      messages = [{ role: 'user', content: t }];
    }

    const tokenBudget =
      action === 'ai-write-guide' ? 2400 :
      (action === 'longer' || action === 'continue' || action === 'brainstorm') ? 1500 :
      800;
    const { text: outText, usage } = await callClaudeProxy(req, {
      system,
      messages,
      max_tokens: tokenBudget,
    });
    res.json({ text: outText, usage });
  } catch (err) {
    console.warn('[ai-edit]', action, err.message);
    res.status(502).json({ error: 'AI service unavailable', detail: err.message });
  }
});

app.post('/api/help/clarify', requireSliceUser, async (req, res) => {
  const q = String(req.body?.query || '').trim().slice(0, 500);
  if (!q) return res.status(400).json({ error: 'query required' });
  try {
    const { text } = await callClaudeProxy(req, {
      system: AI_PROMPTS.clarify,
      messages: [{ role: 'user', content: q }],
      max_tokens: 700,
    });
    // Tolerant JSON extract — strip code fences or stray prose.
    let parsed = null;
    try { parsed = JSON.parse(text); } catch {
      const m = text.match(/\{[\s\S]*\}/);
      if (m) { try { parsed = JSON.parse(m[0]); } catch {} }
    }
    const questions = Array.isArray(parsed?.questions) ? parsed.questions : [];
    // Defensive shape coercion — drop anything that won't render.
    const clean = questions
      .map((qst) => ({
        id: String(qst.id || '').slice(0, 32) || 'q',
        label: String(qst.label || '').slice(0, 200),
        type: qst.type === 'multi' ? 'multi' : 'choice',
        options: Array.isArray(qst.options)
          ? qst.options.slice(0, 6).map((o) => ({
              id: String(o.id || '').slice(0, 32) || 'o',
              label: String(o.label || '').slice(0, 120),
              hint: o.hint ? String(o.hint).slice(0, 80) : undefined,
            })).filter((o) => o.label)
          : [],
      }))
      .filter((qst) => qst.label && qst.options.length >= 2)
      .slice(0, 3);
    res.json({ questions: clean });
  } catch (err) {
    console.warn('[clarify]', err.message);
    // Soft-fail — client falls back to its hardcoded route questions.
    res.json({ questions: [], error: err.message });
  }
});

app.post('/api/chat', requireSliceUser, async (req, res, next) => {
  const { query } = req.body ?? {};
  if (!query) return res.status(400).json({ error: 'query required' });
  try {
    const matches = await ftsSearch(query);

    // Build a clean preview: strip leading markdown header marks so cards
    // don't show literal `## Step 4`, and collapse runs of whitespace.
    const previewFromContent = (raw) => {
      const cleaned = String(raw || '')
        .replace(/^#{1,6}\s*/gm, '')      // ## Heading → Heading
        .replace(/^>\s*/gm, '')            // > quote → quote
        .replace(/^[-*]\s+/gm, '• ')       // - bullet → • bullet
        .replace(/\*\*(.+?)\*\*/g, '$1')   // **bold** → bold
        .replace(/\s+/g, ' ')              // collapse newlines
        .trim();
      return cleaned.length > 220 ? cleaned.slice(0, 220) + '…' : cleaned;
    };
    const citations = matches.map((r, i) => ({
      index: i + 1,
      chunk_id: r.chunk_id,
      guide_id: r.guide_id,
      title: r.title,
      category: r.category,
      source_type: r.source_type,
      helpful_count: r.helpful_count,
      content_preview: previewFromContent(r.content),
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
              "You are the IT-support assistant for Slice (the pizzeria platform). Answer using ONLY the <knowledge_base> excerpts in the user message. Cite sources with [N] notation matching excerpt headers.\n\n" +
              "Slice environment — assume these unless the user says otherwise:\n" +
              "- Devices: MacBooks (Apple Silicon) and Windows laptops/desktops are both common.\n" +
              "- MDM: **Jamf** provisions MacBooks; **Microsoft Intune** provisions Windows machines. The IT Team uses these to push apps, policies, and updates.\n" +
              "- Login on the laptop itself:\n" +
              "  - **Windows (Intune)**: users sign in to the device with their **OneLogin** credentials (same identity as SSO).\n" +
              "  - **macOS (Jamf)**: users sign in to the device with a **local password they set up at provisioning** — NOT their OneLogin password. Resetting OneLogin does not reset the Mac login. macOS keychain may need updating after a OneLogin password change.\n" +
              "- Email + productivity: **Gmail** and **Google Workspace** (Drive, Docs, Sheets, Calendar). Slice does **NOT** use Outlook or Microsoft 365 — never suggest those.\n" +
              "- Shared / team passwords: **1Password**. Never recommend pasting credentials in Slack or Google Docs — share via 1Password vaults.\n" +
              "- Team chat: **Slack** is the company-wide chat (DMs, channels, huddles).\n" +
              "- Headphones: Jabra USB headsets (wired USB, not Bluetooth) are the standard.\n" +
              "- VPN: GlobalProtect on both macOS and Windows.\n" +
              "- Customer-support agents also use Amazon Connect inside Salesforce — the soft-phone is the **CCP** (Contact Control Panel).\n" +
              "- AI tooling: **Claude** is the company AI assistant (chat) and **Claude Code** is the CLI used by engineers.\n" +
              "- Internal IT team is just **the IT Team** — no sub-teams (no 'Network Operations', 'Identity & Access', etc.). When you mention escalation or who to contact, always say 'the IT Team'.\n" +
              "- Internal IT ticket portal: https://it.slicelife.com — refer to it as **Support**.\n\n" +
              "Tailor language to those tools when it would actually change the steps (e.g. say 'GlobalProtect', 'Jabra USB headset', 'CCP in Salesforce'); skip the qualifier when it doesn't help. Don't invent device-specific steps not in the excerpts.\n\n" +
              "Format:\n" +
              "- Short markdown. Numbered steps for sequences; plain prose for one-liners.\n" +
              "- **Bold** UI labels, button names, menu items, and shortcuts.\n" +
              "- Use [N] citations.\n" +
              "- Keep it tight — no preamble, no recap of the question.\n\n" +
              "Closing line — REQUIRED on every answer, on its own paragraph at the end (no bullet, no quote, no heading), using EXACTLY this text:\n" +
              "Still stuck? Submit a ticket at [Support](https://it.slicelife.com).",
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
          // Safety net: every chat answer must end with the Support link.
          // If the model forgot or rephrased, append the canonical line.
          const SUPPORT_LINE = 'Still stuck? Submit a ticket at [Support](https://it.slicelife.com).';
          if (answer && !/it\.slicelife\.com/i.test(answer)) {
            answer = answer.trimEnd() + '\n\n' + SUPPORT_LINE;
          }
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

    // "Did you mean…?" — when retrieval was empty OR Claude declined to
    // answer ("the excerpts don't contain…" / "I don't know"), ask Claude
    // a second time with the FULL list of guide titles to pick 2-3 that
    // might still be tangentially useful. Cheap second-pass fallback so
    // the user doesn't get a dead-end "no match" response.
    let suggestions = [];
    const looksLikeNoAnswer = !answer || /\b(don'?t (have|know)|doesn'?t (contain|cover|mention)|not (in|covered|available)|no (guide|info|information))\b/i.test(answer);
    if (matches.length === 0 || looksLikeNoAnswer) {
      const SLICEDESK_API_URL = (process.env.SLICEDESK_API_URL || '').replace(/\/$/, '');
      if (SLICEDESK_API_URL) {
        try {
          const allGuides = await pool.query(`SELECT title FROM guides WHERE deleted_at IS NULL ORDER BY title`);
          const titleList = allGuides.rows.map((g) => `- ${g.title}`).join('\n').slice(0, 5000);
          const upstream = await fetch(`${SLICEDESK_API_URL}/api/ai/proxy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: req.headers.cookie || '' },
            body: JSON.stringify({
              model: CHAT_MODEL,
              max_tokens: 600,
              system: AI_PROMPTS['did-you-mean'],
              messages: [{
                role: 'user',
                content: `User question: ${query}\n\nAvailable guide titles:\n${titleList}`,
              }],
            }),
          });
          if (upstream.ok) {
            const msg = await upstream.json();
            const txt = (msg.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
            const stripped = txt.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
            const parsed = JSON.parse(stripped);
            if (Array.isArray(parsed?.suggestions)) {
              // Look up guide ids by title so the UI can deep-link
              const titles = parsed.suggestions.map((s) => s.guide_title).filter(Boolean);
              if (titles.length) {
                const ids = await pool.query(
                  `SELECT id, title, category FROM guides
                    WHERE deleted_at IS NULL AND title = ANY($1::text[])`,
                  [titles],
                );
                const byTitle = new Map(ids.rows.map((r) => [r.title, r]));
                suggestions = parsed.suggestions.map((s) => {
                  const g = byTitle.get(s.guide_title);
                  return g ? { guide_id: g.id, title: g.title, category: g.category, reason: s.reason } : null;
                }).filter(Boolean);
              }
            }
          }
        } catch (err) {
          console.warn('[chat] did-you-mean failed:', err.message);
        }
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
      suggestions,
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

// Cluster recent chat questions into topics via Claude. The model
// receives the raw queries + the existing guide titles, returns a
// JSON list of topics with coverage gaps. Cached for 60s in-memory
// to avoid re-paying for the same expensive call when admins refresh.
let _topicsCache = { at: 0, data: null };
app.get('/api/admin/insights/topics', requireSliceAdmin, async (req, res, next) => {
  try {
    if (Date.now() - _topicsCache.at < 60_000 && _topicsCache.data) {
      return res.json({ ..._topicsCache.data, cached: true });
    }
    const [questions, guides] = await Promise.all([
      // Join with chat_feedback so questions that got a thumbs-down weigh
      // heavier — those are confirmed gaps, not just "asked once". The
      // 'unhelpful_count' field signals the topic-cluster prompt where
      // users actively complained the existing guide didn't help.
      pool.query(`
        SELECT
          cl.query,
          COUNT(*) AS cnt,
          COALESCE(SUM(CASE WHEN cf.rating = -1 THEN 1 ELSE 0 END), 0) AS unhelpful_count,
          COALESCE(SUM(CASE WHEN cl.mode = 'retrieval' AND cl.answer IS NULL THEN 1 ELSE 0 END), 0) AS no_match_count
        FROM chat_logs cl
        LEFT JOIN chat_feedback cf ON cf.chat_log_id = cl.id
        WHERE cl.created_at > NOW() - INTERVAL '60 days' AND COALESCE(cl.query, '') <> ''
        GROUP BY cl.query
        ORDER BY unhelpful_count DESC, no_match_count DESC, cnt DESC
        LIMIT 200`),
      pool.query(`SELECT title FROM guides WHERE deleted_at IS NULL ORDER BY title`),
    ]);
    if (questions.rows.length === 0) {
      const data = { topics: [], note: 'No chat questions in the last 60 days yet.' };
      _topicsCache = { at: Date.now(), data };
      return res.json(data);
    }
    const qText = questions.rows.map((r) => {
      // Mark each question with frequency + signal: 👎 for thumbs-down,
      // 🚫 for "no match found" responses. Both flags tell Claude this
      // topic is a higher-priority gap than a one-off curiosity ask.
      const flags = [];
      if (Number(r.unhelpful_count) > 0) flags.push(`${r.unhelpful_count}× 👎`);
      if (Number(r.no_match_count) > 0) flags.push(`${r.no_match_count}× 🚫no-match`);
      const flagStr = flags.length ? ` [${flags.join(', ')}]` : '';
      return `- (${r.cnt}× asked)${flagStr} ${r.query}`;
    }).join('\n').slice(0, 8000);
    const gText = guides.rows.map((g) => `- ${g.title}`).join('\n').slice(0, 4000);
    const SLICEDESK_API_URL = (process.env.SLICEDESK_API_URL || '').replace(/\/$/, '');
    if (!SLICEDESK_API_URL) {
      return res.status(503).json({ error: 'SLICEDESK_API_URL not configured' });
    }
    const upstream = await fetch(`${SLICEDESK_API_URL}/api/ai/proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: req.headers.cookie || '' },
      body: JSON.stringify({
        model: CHAT_MODEL,
        max_tokens: 1500,
        system: AI_PROMPTS['topic-cluster'],
        messages: [{
          role: 'user',
          content:
            `Recent user questions (with frequency):\n${qText}\n\n` +
            `Existing guide titles:\n${gText}`,
        }],
      }),
    });
    if (!upstream.ok) {
      const body = await upstream.text().catch(() => '');
      return res.status(502).json({ error: 'AI service unavailable', detail: body.slice(0, 200) });
    }
    const j = await upstream.json();
    const text = (j.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
    let parsed;
    try {
      // Strip a stray code-fence if Claude added one despite instructions
      const stripped = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
      parsed = JSON.parse(stripped);
    } catch (err) {
      return res.status(502).json({ error: 'AI returned invalid JSON', raw: text.slice(0, 400) });
    }
    _topicsCache = { at: Date.now(), data: parsed };
    res.json(parsed);
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
