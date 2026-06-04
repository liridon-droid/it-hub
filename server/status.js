// ─── Status platform ───────────────────────────────────────────────────────
// Owns the service catalog, pollers, incidents, and HTTP routes for the
// /status surfaces (public + admin). Replaces the old localStorage-only mock
// and the StatusGator-integration that never actually polled anything.
//
// Three poll sources are supported:
//   - 'manual'     IT toggles state in admin; we do not poll.
//   - 'probe'      HTTP HEAD/GET against any URL (your own services or any
//                  third-party endpoint that returns a meaningful status code).
//   - 'statuspage' Atlassian Statuspage.io summary.json. Cloudflare, GitHub,
//                  Slack, Zoom, Figma, OneLogin, Notion, GitLab, npm, Stripe
//                  and ~hundreds of other vendors expose this exact shape, so
//                  one parser covers most of the SaaS world.

// Default catalog — used the first time the server boots into an empty DB.
// Mirrors what the old localStorage mock seeded so users don't see the
// /status surface visibly reset on the deploy.
const DEFAULT_GROUPS = [
  {
    slug: 'identity', label: 'Identity & secrets',
    services: [
      { name: 'OneLogin',  vendor: 'SSO',     domain: 'onelogin.com',  source: 'manual' },
      { name: '1Password', vendor: 'Secrets', domain: '1password.com', source: 'manual' },
    ],
  },
  {
    slug: 'network', label: 'Network',
    services: [
      { name: 'Cloudflare', vendor: 'CDN / VPN', domain: 'cloudflare.com',
        source: 'statuspage', source_url: 'https://www.cloudflarestatus.com/api/v2/summary.json' },
      { name: 'GlobalProtect (Slice VPN)', vendor: 'VPN', domain: 'paloaltonetworks.com',
        source: 'manual' },
    ],
  },
  {
    slug: 'productivity', label: 'Productivity',
    services: [
      { name: 'Google Workspace', vendor: 'Mail & calendar', domain: 'workspace.google.com',
        source: 'manual' },
      { name: 'Slack', vendor: 'Chat', domain: 'slack.com',
        source: 'statuspage', source_url: 'https://slack-status.com/api/v2.0.0/current' },
      { name: 'Zoom', vendor: 'Meetings', domain: 'zoom.us',
        source: 'statuspage', source_url: 'https://www.zoomstatus.com/api/v2/summary.json' },
    ],
  },
  {
    slug: 'dev', label: 'Build & design',
    services: [
      { name: 'GitHub', vendor: 'Source control', domain: 'github.com',
        source: 'statuspage', source_url: 'https://www.githubstatus.com/api/v2/summary.json' },
      { name: 'Figma',  vendor: 'Design', domain: 'figma.com',
        source: 'statuspage', source_url: 'https://www.figmastatus.com/api/v2/summary.json' },
    ],
  },
];

// Apps monitored on /status in addition to the seeded catalog above. Added
// idempotently at boot by ensureStatusServices (matched by name — never
// duplicates or overwrites). Verified Statuspage.io feeds get live status; the
// rest are 'manual' (visible, IT-toggled) until a per-vendor parser exists.
const MONITORED_EXTRA = [
  { name: 'Anthropic',    domain: 'anthropic.com', source: 'statuspage', source_url: 'https://status.claude.com/api/v2/summary.json' },
  { name: 'Claude',       domain: 'claude.ai',     source: 'statuspage', source_url: 'https://status.claude.com/api/v2/summary.json' },
  { name: 'Twilio',       domain: 'twilio.com',    source: 'statuspage', source_url: 'https://status.twilio.com/api/v2/summary.json' },
  { name: 'Datadog',      domain: 'datadoghq.com', source: 'statuspage', source_url: 'https://status.datadoghq.com/api/v2/summary.json' },
  { name: 'Atlassian',    domain: 'atlassian.com', source: 'statuspage', source_url: 'https://status.atlassian.com/api/v2/summary.json' },
  { name: 'Segment',      domain: 'segment.com',   source: 'statuspage', source_url: 'https://status.segment.com/api/v2/summary.json' },
  { name: 'SendGrid',     domain: 'sendgrid.com',  source: 'statuspage', source_url: 'https://status.sendgrid.com/api/v2/summary.json' },
  { name: 'Stripe',       domain: 'stripe.com',    source: 'statuspage', source_url: 'https://www.stripestatus.com/api/v2/summary.json' },
  { name: 'Jamf',         domain: 'jamf.com',      source: 'statuspage', source_url: 'https://status.jamf.com/api/v2/summary.json' },
  { name: 'Mailgun',      domain: 'mailgun.com',   source: 'statuspage', source_url: 'https://status.mailgun.com/api/v2/summary.json' },
  { name: 'GoDaddy',      domain: 'godaddy.com',   source: 'statuspage', source_url: 'https://status.godaddy.com/api/v2/summary.json' },
  { name: 'ShareFile',    domain: 'sharefile.com', source: 'statuspage', source_url: 'https://status.sharefile.com/api/v2/summary.json' },
  { name: 'Cisco Meraki', domain: 'meraki.com',    source: 'statuspage', source_url: 'https://status.meraki.net/api/v2/summary.json' },
  // No clean machine-readable feed yet → manual (IT toggles). Real auto-status
  // for these needs a per-vendor parser (AWS Health / Google / Apple formats).
  { name: 'AWS',               domain: 'aws.amazon.com',      source: 'manual' },
  { name: 'App Store Connect', domain: 'developer.apple.com', source: 'manual' },
  { name: 'OneLogin EU',       domain: 'onelogin.com',        source: 'manual' },
  { name: 'Adyen',             domain: 'adyen.com',           source: 'manual' },
  { name: 'PayPal',            domain: 'paypal.com',          source: 'manual' },
  { name: 'Chowly',            domain: 'chowly.com',          source: 'manual' },
];

// Idempotently add MONITORED_EXTRA to the live catalog (matched by name — never
// duplicates or overwrites admin rows). New entries land in a "More services"
// group. Also repoints Zoom to its current feed.
export async function ensureStatusServices(pool) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let gr = await client.query(`SELECT id FROM status_groups WHERE slug = 'more'`);
    let groupId = gr.rows[0] && gr.rows[0].id;
    if (!groupId) {
      const ins = await client.query(
        `INSERT INTO status_groups (slug, label, position) VALUES ('more', 'More services', 99) RETURNING id`,
      );
      groupId = ins.rows[0].id;
    }
    let added = 0;
    for (const s of MONITORED_EXTRA) {
      const ex = await client.query(`SELECT 1 FROM status_services WHERE lower(name) = lower($1) LIMIT 1`, [s.name]);
      if (ex.rowCount) continue;
      await client.query(
        `INSERT INTO status_services (group_id, name, vendor, domain, source, source_url, position)
         VALUES ($1, $2, NULL, $3, $4, $5, 0)`,
        [groupId, s.name, s.domain || null, s.source || 'manual', s.source_url || null],
      );
      added++;
    }
    // Zoom moved its feed off status.zoom.us → repoint if a live row is stale.
    await client.query(
      `UPDATE status_services SET source_url = 'https://www.zoomstatus.com/api/v2/summary.json'
        WHERE name = 'Zoom' AND source_url LIKE '%status.zoom.us%'`,
    );
    await client.query('COMMIT');
    console.log(`[status] ensured monitored services (+${added} new)`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[status] ensure failed:', e.message);
  } finally {
    client.release();
  }
}

export async function bootstrapStatusServices(pool) {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM status_services');
  if (rows[0].n > 0) return; // already seeded — never overwrite live data
  console.log('[status] seeding default service catalog');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (let gi = 0; gi < DEFAULT_GROUPS.length; gi++) {
      const g = DEFAULT_GROUPS[gi];
      const gr = await client.query(
        `INSERT INTO status_groups (slug, label, position) VALUES ($1, $2, $3) RETURNING id`,
        [g.slug, g.label, gi],
      );
      const groupId = gr.rows[0].id;
      for (let si = 0; si < g.services.length; si++) {
        const s = g.services[si];
        await client.query(
          `INSERT INTO status_services (group_id, name, vendor, domain, source, source_url, position)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [groupId, s.name, s.vendor || null, s.domain || null, s.source || 'manual', s.source_url || null, si],
        );
      }
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[status] seed failed:', e.message);
  } finally {
    client.release();
  }
}

// ── Pollers ────────────────────────────────────────────────────────────────

const PROBE_TIMEOUT_MS = 6000;
const PROBE_DEGRADED_MS = 2500;

async function fetchWithTimeout(url, opts = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs || PROBE_TIMEOUT_MS);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function probeHttp(service) {
  if (!service.source_url) {
    return { state: 'operational', error: 'no source_url configured' };
  }
  const t0 = Date.now();
  try {
    // HEAD first — many vendor status pages refuse HEAD, so fall back to GET.
    let r = await fetchWithTimeout(service.source_url, { method: 'HEAD' });
    if (r.status === 405 || r.status === 501) {
      r = await fetchWithTimeout(service.source_url, { method: 'GET' });
    }
    const dt = Date.now() - t0;
    let state = 'operational';
    if (r.status >= 500) state = 'down';
    else if (r.status >= 400 || dt >= PROBE_DEGRADED_MS) state = 'degraded';
    return { state, response_ms: dt, http_status: r.status };
  } catch (err) {
    return { state: 'down', error: err.message || 'fetch failed' };
  }
}

// Atlassian Statuspage.io summary.json — used by hundreds of vendors. Slack
// publishes a slightly different shape at slack-status.com/api/v2.0.0/current
// (status: "ok|active|incident") so we sniff and handle both.
function parseStatuspageSummary(json) {
  // Slack-style
  if (json && typeof json.status === 'string' && (json.status === 'ok' || json.status === 'active' || json.status === 'incident')) {
    if (json.status === 'ok' || json.status === 'active') return { state: 'operational' };
    return { state: 'degraded', state_note: 'Slack reports an active incident' };
  }
  // Statuspage.io summary.json — { status: { indicator, description } }
  const indicator = json?.status?.indicator;
  const description = json?.status?.description || null;
  if (indicator === 'none') return { state: 'operational', state_note: description };
  if (indicator === 'minor') return { state: 'degraded', state_note: description };
  if (indicator === 'major' || indicator === 'critical') return { state: 'down', state_note: description };
  return { state: 'operational', state_note: description };
}

async function probeStatuspage(service) {
  if (!service.source_url) {
    return { state: 'operational', error: 'no source_url configured' };
  }
  const t0 = Date.now();
  try {
    const r = await fetchWithTimeout(service.source_url, {
      method: 'GET',
      headers: { 'Accept': 'application/json', 'User-Agent': 'Slice-IT-Hub/1.0 status-poller' },
    });
    const dt = Date.now() - t0;
    if (!r.ok) {
      return { state: 'degraded', response_ms: dt, http_status: r.status, error: `HTTP ${r.status}` };
    }
    const json = await r.json();
    const parsed = parseStatuspageSummary(json);
    return { ...parsed, response_ms: dt, http_status: r.status };
  } catch (err) {
    return { state: 'down', error: err.message || 'fetch failed' };
  }
}

async function pollOne(pool, service) {
  if (service.source === 'manual') return; // admin-managed, never auto-poll
  const result =
    service.source === 'statuspage' ? await probeStatuspage(service) :
    service.source === 'probe'      ? await probeHttp(service) :
    null;
  if (!result) return;

  await pool.query(
    `INSERT INTO status_checks (service_id, state, response_ms, http_status, error)
     VALUES ($1, $2, $3, $4, $5)`,
    [service.id, result.state, result.response_ms || null, result.http_status || null, result.error || null],
  );
  await pool.query(
    `UPDATE status_services
        SET state = $2,
            state_note = $3,
            response_ms = $4,
            last_checked_at = NOW(),
            last_error = $5,
            updated_at = NOW()
      WHERE id = $1`,
    [service.id, result.state, result.state_note || null, result.response_ms || null, result.error || null],
  );
}

async function runOnePollPass(pool) {
  const { rows } = await pool.query(
    `SELECT id, source, source_url FROM status_services WHERE source IN ('probe','statuspage')`,
  );
  if (rows.length === 0) return;
  // Parallel — each service has its own 6s timeout, so a single slow vendor
  // can't block the cycle. Promise.allSettled so one failure doesn't kill
  // the rest.
  await Promise.allSettled(rows.map((s) => pollOne(pool, s)));
}

// Retain ~90 days of samples per service. One row/minute/service for ~30
// services = ~1.3M rows over 90 days, which is fine for Postgres but worth
// trimming so it doesn't grow unbounded.
async function pruneOldChecks(pool) {
  await pool.query(`DELETE FROM status_checks WHERE checked_at < NOW() - INTERVAL '90 days'`);
}

export function runStatusPollers(pool, { intervalMs = 60_000 } = {}) {
  let stopped = false;
  let pruneCounter = 0;

  const tick = async () => {
    if (stopped) return;
    try {
      await runOnePollPass(pool);
      pruneCounter += 1;
      if (pruneCounter >= 60) { // hourly prune
        pruneCounter = 0;
        await pruneOldChecks(pool);
      }
    } catch (e) {
      console.warn('[status] poll cycle failed:', e.message);
    }
  };

  // Kick one off ~3s after boot so the server is responsive first, then on
  // the configured interval.
  setTimeout(tick, 3000);
  const handle = setInterval(tick, intervalMs);
  return () => { stopped = true; clearInterval(handle); };
}

// ── Routes ────────────────────────────────────────────────────────────────

async function fetchStatusPayload(pool) {
  const groups = await pool.query(
    `SELECT id, slug, label, position FROM status_groups ORDER BY position, id`,
  );
  const services = await pool.query(
    `SELECT id, group_id, name, vendor, domain, icon_url, source, source_url,
            state, state_note, response_ms, last_checked_at, last_error, position
       FROM status_services
       ORDER BY group_id, position, id`,
  );
  // 10-day daily history per service — one cell per day, worst state of the
  // day wins so a single bad sample colors the bar. 0 = ok, 1 = degraded, 2 = down.
  const history = await pool.query(
    `SELECT service_id,
            (NOW()::date - checked_at::date)::int AS days_ago,
            MAX(CASE state WHEN 'down' THEN 2 WHEN 'degraded' THEN 1 ELSE 0 END) AS worst
       FROM status_checks
      WHERE checked_at >= NOW() - INTERVAL '10 days'
      GROUP BY service_id, days_ago`,
  );
  // Compute 10-day uptime per service: % of samples that were operational.
  const uptime = await pool.query(
    `SELECT service_id,
            COUNT(*)::int AS samples,
            SUM(CASE state WHEN 'operational' THEN 1 ELSE 0 END)::int AS ok
       FROM status_checks
      WHERE checked_at >= NOW() - INTERVAL '10 days'
      GROUP BY service_id`,
  );
  const incidents = await pool.query(
    `SELECT i.id, i.service_id, s.name AS service_name, i.title, i.severity,
            i.state, i.started_at, i.resolved_at,
            COALESCE(json_agg(json_build_object(
              'id', u.id, 'label', u.label, 'body', u.body, 'created_at', u.created_at
            ) ORDER BY u.created_at) FILTER (WHERE u.id IS NOT NULL), '[]'::json) AS updates
       FROM status_incidents i
       LEFT JOIN status_services s ON s.id = i.service_id
       LEFT JOIN status_incident_updates u ON u.incident_id = i.id
      WHERE i.started_at >= NOW() - INTERVAL '60 days'
      GROUP BY i.id, s.name
      ORDER BY i.started_at DESC`,
  );

  // Roll history rows up by service into a 10-element array (index 0 = today).
  // Days with no samples stay null so the UI can show "no data" honestly rather
  // than painting an un-checked day green.
  const HISTORY_DAYS = 10;
  const histByService = new Map();
  for (const r of history.rows) {
    const list = histByService.get(r.service_id) || new Array(HISTORY_DAYS).fill(null);
    if (r.days_ago >= 0 && r.days_ago < HISTORY_DAYS) list[r.days_ago] = r.worst;
    histByService.set(r.service_id, list);
  }
  const uptimeByService = new Map();
  for (const r of uptime.rows) {
    uptimeByService.set(r.service_id, r.samples > 0 ? (r.ok / r.samples) * 100 : null);
  }

  const groupsOut = groups.rows.map((g) => ({
    id: g.id,
    slug: g.slug,
    label: g.label,
    position: g.position,
    services: services.rows
      .filter((s) => s.group_id === g.id)
      .map((s) => ({
        id: s.id,
        name: s.name,
        vendor: s.vendor,
        domain: s.domain,
        icon_url: s.icon_url,
        source: s.source,
        source_url: s.source_url,
        state: s.state,
        state_note: s.state_note,
        response_ms: s.response_ms,
        last_checked_at: s.last_checked_at,
        last_error: s.last_error,
        position: s.position,
        // Reverse so index 0 = oldest, last = today (matches what the bars expect).
        history: (histByService.get(s.id) || new Array(HISTORY_DAYS).fill(null)).slice().reverse(),
        uptime: uptimeByService.get(s.id) ?? null,
      })),
  }));
  // Strays — services whose group was deleted — get bucketed at the end.
  const orphan = services.rows.filter((s) => !groupsOut.some((g) => g.id === s.group_id));
  if (orphan.length > 0) {
    groupsOut.push({
      id: 0, slug: 'other', label: 'Other', position: 9999,
      services: orphan.map((s) => ({
        id: s.id, name: s.name, vendor: s.vendor, domain: s.domain,
        icon_url: s.icon_url, source: s.source, source_url: s.source_url,
        state: s.state, state_note: s.state_note, response_ms: s.response_ms,
        last_checked_at: s.last_checked_at, last_error: s.last_error,
        position: s.position,
        history: (histByService.get(s.id) || new Array(HISTORY_DAYS).fill(null)).slice().reverse(),
        uptime: uptimeByService.get(s.id) ?? null,
      })),
    });
  }

  return {
    groups: groupsOut,
    incidents: incidents.rows.map((i) => ({
      id: i.id,
      service_id: i.service_id,
      service_name: i.service_name,
      title: i.title,
      severity: i.severity,
      state: i.state,
      started_at: i.started_at,
      resolved_at: i.resolved_at,
      updates: i.updates || [],
    })),
    server_time: new Date().toISOString(),
  };
}

const VALID_STATES = new Set(['operational', 'degraded', 'down']);
const VALID_SOURCES = new Set(['manual', 'probe', 'statuspage']);
const VALID_SEVERITIES = new Set(['minor', 'major', 'critical']);
const VALID_INC_STATES = new Set(['investigating', 'identified', 'monitoring', 'resolved']);

export function mountStatusRoutes(app, pool, { requireSliceUser, requireSliceAdmin }) {
  // Public-style read endpoint — anyone signed in can hit it.
  app.get('/api/status', requireSliceUser, async (req, res, next) => {
    try {
      res.set('Cache-Control', 'no-store');
      res.json(await fetchStatusPayload(pool));
    } catch (e) { next(e); }
  });

  // Manual on-demand re-poll (admin only) — runs one cycle and returns fresh data.
  app.post('/api/admin/status/poll', requireSliceAdmin, async (req, res, next) => {
    try {
      await runOnePollPass(pool);
      res.json(await fetchStatusPayload(pool));
    } catch (e) { next(e); }
  });

  // Group CRUD
  app.post('/api/admin/status/groups', requireSliceAdmin, async (req, res, next) => {
    try {
      const { slug, label, position } = req.body || {};
      if (!slug || !label) return res.status(400).json({ error: 'slug and label required' });
      const r = await pool.query(
        `INSERT INTO status_groups (slug, label, position) VALUES ($1, $2, $3) RETURNING *`,
        [String(slug).slice(0, 60), String(label).slice(0, 120), Number(position) || 0],
      );
      res.json(r.rows[0]);
    } catch (e) { next(e); }
  });
  app.patch('/api/admin/status/groups/:id', requireSliceAdmin, async (req, res, next) => {
    try {
      const { label, position } = req.body || {};
      const r = await pool.query(
        `UPDATE status_groups SET
           label = COALESCE($2, label),
           position = COALESCE($3, position)
         WHERE id = $1 RETURNING *`,
        [req.params.id, label != null ? String(label).slice(0, 120) : null,
         position != null ? Number(position) : null],
      );
      if (r.rows.length === 0) return res.status(404).json({ error: 'not found' });
      res.json(r.rows[0]);
    } catch (e) { next(e); }
  });
  app.delete('/api/admin/status/groups/:id', requireSliceAdmin, async (req, res, next) => {
    try {
      await pool.query(`DELETE FROM status_groups WHERE id = $1`, [req.params.id]);
      res.json({ ok: true });
    } catch (e) { next(e); }
  });

  // Service CRUD
  app.post('/api/admin/status/services', requireSliceAdmin, async (req, res, next) => {
    try {
      const b = req.body || {};
      if (!b.name) return res.status(400).json({ error: 'name required' });
      const source = VALID_SOURCES.has(b.source) ? b.source : 'manual';
      const state = VALID_STATES.has(b.state) ? b.state : 'operational';
      const r = await pool.query(
        `INSERT INTO status_services
           (group_id, name, vendor, domain, icon_url, source, source_url, state, state_note, position)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [
          b.group_id || null,
          String(b.name).slice(0, 120),
          b.vendor ? String(b.vendor).slice(0, 80) : null,
          b.domain ? String(b.domain).slice(0, 120) : null,
          b.icon_url ? String(b.icon_url).slice(0, 500) : null,
          source,
          b.source_url ? String(b.source_url).slice(0, 500) : null,
          state,
          b.state_note ? String(b.state_note).slice(0, 200) : null,
          Number(b.position) || 0,
        ],
      );
      res.json(r.rows[0]);
    } catch (e) { next(e); }
  });
  app.patch('/api/admin/status/services/:id', requireSliceAdmin, async (req, res, next) => {
    try {
      const b = req.body || {};
      const source = b.source != null && VALID_SOURCES.has(b.source) ? b.source : null;
      const state = b.state != null && VALID_STATES.has(b.state) ? b.state : null;
      const r = await pool.query(
        `UPDATE status_services SET
           group_id    = COALESCE($2, group_id),
           name        = COALESCE($3, name),
           vendor      = COALESCE($4, vendor),
           domain      = COALESCE($5, domain),
           icon_url    = COALESCE($6, icon_url),
           source      = COALESCE($7, source),
           source_url  = COALESCE($8, source_url),
           state       = COALESCE($9, state),
           state_note  = COALESCE($10, state_note),
           position    = COALESCE($11, position),
           updated_at  = NOW()
         WHERE id = $1 RETURNING *`,
        [
          req.params.id,
          b.group_id != null ? Number(b.group_id) : null,
          b.name ? String(b.name).slice(0, 120) : null,
          b.vendor != null ? String(b.vendor).slice(0, 80) : null,
          b.domain != null ? String(b.domain).slice(0, 120) : null,
          b.icon_url != null ? String(b.icon_url).slice(0, 500) : null,
          source,
          b.source_url != null ? String(b.source_url).slice(0, 500) : null,
          state,
          b.state_note != null ? String(b.state_note).slice(0, 200) : null,
          b.position != null ? Number(b.position) : null,
        ],
      );
      if (r.rows.length === 0) return res.status(404).json({ error: 'not found' });
      res.json(r.rows[0]);
    } catch (e) { next(e); }
  });
  app.delete('/api/admin/status/services/:id', requireSliceAdmin, async (req, res, next) => {
    try {
      await pool.query(`DELETE FROM status_services WHERE id = $1`, [req.params.id]);
      res.json({ ok: true });
    } catch (e) { next(e); }
  });

  // Incident composer
  app.post('/api/admin/status/incidents', requireSliceAdmin, async (req, res, next) => {
    try {
      const b = req.body || {};
      if (!b.title) return res.status(400).json({ error: 'title required' });
      const severity = VALID_SEVERITIES.has(b.severity) ? b.severity : 'minor';
      const state = VALID_INC_STATES.has(b.state) ? b.state : 'investigating';
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const inc = await client.query(
          `INSERT INTO status_incidents (service_id, title, severity, state)
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [b.service_id || null, String(b.title).slice(0, 200), severity, state],
        );
        // Optional first update so the timeline isn't empty on creation.
        if (b.first_update) {
          await client.query(
            `INSERT INTO status_incident_updates (incident_id, label, body) VALUES ($1, $2, $3)`,
            [inc.rows[0].id, 'Identified', String(b.first_update).slice(0, 1000)],
          );
        }
        await client.query('COMMIT');
        res.json(inc.rows[0]);
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    } catch (e) { next(e); }
  });
  app.patch('/api/admin/status/incidents/:id', requireSliceAdmin, async (req, res, next) => {
    try {
      const b = req.body || {};
      const severity = b.severity != null && VALID_SEVERITIES.has(b.severity) ? b.severity : null;
      const state = b.state != null && VALID_INC_STATES.has(b.state) ? b.state : null;
      const isResolving = state === 'resolved';
      const r = await pool.query(
        `UPDATE status_incidents SET
           title       = COALESCE($2, title),
           service_id  = COALESCE($3, service_id),
           severity    = COALESCE($4, severity),
           state       = COALESCE($5, state),
           resolved_at = CASE WHEN $6::boolean AND resolved_at IS NULL THEN NOW() ELSE resolved_at END,
           updated_at  = NOW()
         WHERE id = $1 RETURNING *`,
        [
          req.params.id,
          b.title ? String(b.title).slice(0, 200) : null,
          b.service_id != null ? Number(b.service_id) : null,
          severity,
          state,
          isResolving,
        ],
      );
      if (r.rows.length === 0) return res.status(404).json({ error: 'not found' });
      res.json(r.rows[0]);
    } catch (e) { next(e); }
  });
  app.delete('/api/admin/status/incidents/:id', requireSliceAdmin, async (req, res, next) => {
    try {
      await pool.query(`DELETE FROM status_incidents WHERE id = $1`, [req.params.id]);
      res.json({ ok: true });
    } catch (e) { next(e); }
  });
  // Add a timeline update to an existing incident (the "Post update" button).
  app.post('/api/admin/status/incidents/:id/updates', requireSliceAdmin, async (req, res, next) => {
    try {
      const b = req.body || {};
      if (!b.body) return res.status(400).json({ error: 'body required' });
      const label = String(b.label || 'Update').slice(0, 40);
      const r = await pool.query(
        `INSERT INTO status_incident_updates (incident_id, label, body) VALUES ($1, $2, $3) RETURNING *`,
        [req.params.id, label, String(b.body).slice(0, 1000)],
      );
      // Bump the parent so /api/status sorts correctly when this update lands.
      await pool.query(`UPDATE status_incidents SET updated_at = NOW() WHERE id = $1`, [req.params.id]);
      res.json(r.rows[0]);
    } catch (e) { next(e); }
  });

  // Probes panel — last 50 checks per service for the admin diagnostic view.
  app.get('/api/admin/status/probes', requireSliceAdmin, async (req, res, next) => {
    try {
      const r = await pool.query(
        `SELECT s.id, s.name, s.source, s.source_url, s.state, s.last_checked_at, s.last_error,
                (SELECT json_agg(row_to_json(t) ORDER BY t.checked_at DESC)
                   FROM (
                     SELECT state, response_ms, http_status, error, checked_at
                       FROM status_checks
                      WHERE service_id = s.id
                      ORDER BY checked_at DESC
                      LIMIT 50
                   ) t) AS recent
           FROM status_services s
          WHERE s.source IN ('probe','statuspage')
          ORDER BY s.name`,
      );
      res.json({ probes: r.rows });
    } catch (e) { next(e); }
  });
}
