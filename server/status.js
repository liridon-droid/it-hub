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

// Release a response body we don't need to read, so a server that returns a
// body on HEAD (or the GET fallback) doesn't leave a socket dangling.
function drain(r) {
  try { r.body?.cancel?.(); } catch { /* already consumed / no body */ }
}

// Defense-in-depth: source_url is admin-set, but never let the poller be aimed
// at loopback / link-local / private ranges or non-HTTP schemes. Returns an
// error string when the URL should not be fetched, or null when it's allowed.
const PRIVATE_IP_RE = /^(?:127\.|10\.|169\.254\.|192\.168\.|::1$|fe80:|fc00:|fd00:|172\.(?:1[6-9]|2\d|3[01])\.)/i;
const IPV4_RE = /^\d{1,3}(?:\.\d{1,3}){3}$/;
function probeUrlBlockedReason(rawUrl) {
  let u;
  try { u = new URL(rawUrl); } catch { return 'invalid URL'; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return 'only http/https allowed';
  // Strip the [..] wrapper URL uses for IPv6 literals so [::1] tests as ::1.
  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) return 'internal host blocked';
  // Only apply the private-range test to actual IP literals — otherwise a public
  // domain that merely starts with "10." (e.g. 10.example.com) would be blocked.
  const isIpLiteral = IPV4_RE.test(host) || host.includes(':');
  if (isIpLiteral && PRIVATE_IP_RE.test(host)) return 'private/loopback address blocked';
  return null;
}

async function probeHttp(service) {
  if (!service.source_url) {
    return { state: 'down', error: 'no source_url configured' };
  }
  const blocked = probeUrlBlockedReason(service.source_url);
  if (blocked) return { state: 'down', error: blocked };
  const t0 = Date.now();
  try {
    // HEAD first — many vendor status pages refuse HEAD, so fall back to GET.
    let r = await fetchWithTimeout(service.source_url, { method: 'HEAD' });
    if (r.status === 405 || r.status === 501 || r.status === 403) {
      drain(r);
      r = await fetchWithTimeout(service.source_url, { method: 'GET' });
    }
    const dt = Date.now() - t0;
    // 5xx = down. 408/429 (overloaded) and most 4xx = degraded. 401/403 mean the
    // endpoint is up but auth-gated, so they count as operational — a healthy
    // service behind auth shouldn't read as "degraded" forever. Slow = degraded.
    let state = 'operational';
    if (r.status >= 500) state = 'down';
    else if (r.status === 408 || r.status === 429) state = 'degraded';
    else if (r.status >= 400 && r.status !== 401 && r.status !== 403) state = 'degraded';
    else if (dt >= PROBE_DEGRADED_MS) state = 'degraded';
    drain(r);
    return { state, response_ms: dt, http_status: r.status };
  } catch (err) {
    return { state: 'down', error: err.message || 'fetch failed' };
  }
}

// Atlassian Statuspage.io summary.json — used by hundreds of vendors. Slack
// publishes a slightly different shape at slack-status.com/api/v2.0.0/current
// (status: "ok|active|incident") so we sniff and handle both.
function parseStatuspageSummary(json) {
  if (!json || typeof json !== 'object') return { state: 'operational' };

  // Slack-style — { status: "ok" | "active" | "incident" }
  if (typeof json.status === 'string' && ['ok', 'active', 'incident'].includes(json.status)) {
    if (json.status === 'incident') return { state: 'degraded', state_note: 'Active incident reported' };
    return { state: 'operational' };
  }

  // Heroku v4 — { status: [ { system, status: "green"|"yellow"|"red" }, … ] }.
  // Worst component wins. (This shape was previously misread as always-up.)
  if (Array.isArray(json.status)) {
    const colors = json.status.map((c) => String(c && c.status || '').toLowerCase());
    if (colors.includes('red'))    return { state: 'down', state_note: 'Vendor reports a major outage' };
    if (colors.some((c) => c === 'yellow' || c === 'orange')) return { state: 'degraded', state_note: 'Vendor reports degraded service' };
    return { state: 'operational' };
  }

  // Atlassian Statuspage.io summary.json — { status: { indicator, description } }.
  // When the top-level indicator is clean, fall back to the worst component so a
  // partial outage that hasn't tripped the overall indicator still shows.
  const indicator = json?.status?.indicator;
  let description = json?.status?.description || null;
  if (indicator === 'minor')                       return { state: 'degraded', state_note: description };
  if (indicator === 'major' || indicator === 'critical') return { state: 'down', state_note: description };
  if (indicator === 'none' || indicator == null) {
    const comps = Array.isArray(json.components) ? json.components : [];
    const bad = comps.filter((c) => c && c.status && c.status !== 'operational' && !/_maintenance$/.test(c.status));
    if (bad.some((c) => /major_outage|partial_outage/.test(c.status))) {
      return { state: 'down', state_note: `${bad[0].name}: ${bad[0].status.replace(/_/g, ' ')}` };
    }
    if (bad.length) {
      return { state: 'degraded', state_note: `${bad[0].name}: ${bad[0].status.replace(/_/g, ' ')}` };
    }
    return { state: 'operational', state_note: description };
  }
  return { state: 'operational', state_note: description };
}

async function probeStatuspage(service) {
  if (!service.source_url) {
    return { state: 'down', error: 'no source_url configured' };
  }
  const blocked = probeUrlBlockedReason(service.source_url);
  if (blocked) return { state: 'down', error: blocked };
  const t0 = Date.now();
  try {
    const r = await fetchWithTimeout(service.source_url, {
      method: 'GET',
      headers: { 'Accept': 'application/json', 'User-Agent': 'Slice-IT-Hub/1.0 status-poller' },
    });
    const dt = Date.now() - t0;
    if (!r.ok) {
      drain(r);
      return { state: 'degraded', response_ms: dt, http_status: r.status, error: `HTTP ${r.status}` };
    }
    const json = await r.json();
    const parsed = parseStatuspageSummary(json);
    return { ...parsed, response_ms: dt, http_status: r.status };
  } catch (err) {
    return { state: 'down', error: err.message || 'fetch failed' };
  }
}

// How many consecutive agreeing readings we need before flipping the effective
// state. With a 60s cadence this rides out a single transient blip (a one-off
// timeout won't show the whole company a red banner) but confirms a real change
// within ~2 minutes. This is the flap-resistance an industry monitor expects.
const CONFIRM_SAMPLES = 2;

async function pollOne(pool, service) {
  // Manual services are admin-owned — we never probe them, but we still record
  // a heartbeat sample of their current state so the 10-day bars + uptime are
  // populated for them too (otherwise they'd read as "no data" forever).
  if (service.source === 'manual') {
    await pool.query(
      `INSERT INTO status_checks (service_id, state) VALUES ($1, $2)`,
      [service.id, service.state],
    );
    return;
  }
  const observed =
    service.source === 'statuspage' ? await probeStatuspage(service) :
    service.source === 'probe'      ? await probeHttp(service) :
    null;
  if (!observed) return;
  await applyState(pool, service, observed);
}

// Record the raw observation, then promote it to the effective state only once
// CONFIRM_SAMPLES consecutive readings agree. On a confirmed transition, open or
// resolve an auto-incident so monitoring drives the public timeline.
async function applyState(pool, service, observed) {
  await pool.query(
    `INSERT INTO status_checks (service_id, state, response_ms, http_status, error)
     VALUES ($1, $2, $3, $4, $5)`,
    [service.id, observed.state, observed.response_ms || null, observed.http_status || null, observed.error || null],
  );

  const recent = await pool.query(
    `SELECT state FROM status_checks WHERE service_id = $1 ORDER BY checked_at DESC LIMIT $2`,
    [service.id, CONFIRM_SAMPLES],
  );
  const confirmed =
    recent.rows.length >= CONFIRM_SAMPLES && recent.rows.every((r) => r.state === observed.state);
  const effective = confirmed ? observed.state : service.state;
  // Operational → no note. If the effective state matches what we just observed,
  // use the fresh note. If we're holding a prior (still-bad) state because the
  // new reading isn't confirmed yet, keep the prior note rather than blanking it.
  const note = effective === 'operational'
    ? null
    : (effective === observed.state ? (observed.state_note || null) : (service.state_note || null));

  await pool.query(
    `UPDATE status_services
        SET state = $2, state_note = $3, response_ms = $4,
            last_checked_at = NOW(), last_error = $5, updated_at = NOW()
      WHERE id = $1`,
    [service.id, effective, note, observed.response_ms || null, observed.error || null],
  );

  if (effective !== service.state) {
    await handleAutoIncident(pool, service, service.state, effective);
  }
}

const isBadState = (s) => s === 'degraded' || s === 'down';

// Open an auto-incident when a monitored service drops, escalate it if the
// severity worsens, and auto-resolve it on recovery. Only auto-created
// incidents are touched here — admin-authored ones are never mutated.
async function handleAutoIncident(pool, service, fromState, toState) {
  const open = await pool.query(
    `SELECT id FROM status_incidents
      WHERE service_id = $1 AND auto_created = true AND resolved_at IS NULL
      ORDER BY started_at DESC LIMIT 1`,
    [service.id],
  );
  const openId = open.rows[0]?.id;

  if (isBadState(toState)) {
    const severity = toState === 'down' ? 'major' : 'minor';
    if (!openId) {
      const inc = await pool.query(
        `INSERT INTO status_incidents (service_id, title, severity, state, auto_created)
         VALUES ($1, $2, $3, 'investigating', true) RETURNING id`,
        [service.id, `${service.name} is ${toState}`, severity],
      );
      await pool.query(
        `INSERT INTO status_incident_updates (incident_id, label, body) VALUES ($1, 'Identified', $2)`,
        [inc.rows[0].id, `Automated monitoring detected ${service.name} is ${toState}. The IT Team has been alerted.`],
      );
    } else if (fromState !== toState) {
      await pool.query(
        `UPDATE status_incidents SET severity = $2, updated_at = NOW() WHERE id = $1`,
        [openId, severity],
      );
      await pool.query(
        `INSERT INTO status_incident_updates (incident_id, label, body) VALUES ($1, 'Update', $2)`,
        [openId, `${service.name} status changed to ${toState}.`],
      );
    }
  } else if (openId) {
    await pool.query(
      `UPDATE status_incidents SET state = 'resolved', resolved_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [openId],
    );
    await pool.query(
      `INSERT INTO status_incident_updates (incident_id, label, body) VALUES ($1, 'Resolved', $2)`,
      [openId, `Automated monitoring sees ${service.name} back to operational.`],
    );
  }
}

// A single shared in-flight pass. The 60s tick and the admin "poll now" / "Test"
// routes all funnel through here; if a pass is already running, callers join it
// instead of starting a second concurrent pass (which would double-write checks
// and race the auto-incident open/resolve logic).
let pollPassInFlight = null;
function runOnePollPass(pool) {
  if (pollPassInFlight) return pollPassInFlight;
  pollPassInFlight = (async () => {
    // Includes manual services so they get a heartbeat sample each pass.
    const { rows } = await pool.query(
      `SELECT id, name, source, source_url, state, state_note FROM status_services`,
    );
    if (rows.length === 0) return;
    // Parallel — each service has its own 6s timeout, so a single slow vendor
    // can't block the cycle. Promise.allSettled so one failure doesn't kill
    // the rest.
    await Promise.allSettled(rows.map((s) => pollOne(pool, s)));
  })().finally(() => { pollPassInFlight = null; });
  return pollPassInFlight;
}

// We only display a 10-day window (and the admin probe panel reads the last 50
// samples), so retaining far beyond that is pure waste. Keep 30 days for a
// little headroom in case the display window is widened later.
async function pruneOldChecks(pool) {
  await pool.query(`DELETE FROM status_checks WHERE checked_at < NOW() - INTERVAL '30 days'`);
}

export function runStatusPollers(pool, { intervalMs = 60_000 } = {}) {
  let stopped = false;
  let inProgress = false;
  let pruneCounter = 0;

  const tick = async () => {
    if (stopped || inProgress) return; // skip if the previous pass is still running
    inProgress = true;
    try {
      await runOnePollPass(pool);
      pruneCounter += 1;
      if (pruneCounter >= 60) { // hourly prune
        pruneCounter = 0;
        await pruneOldChecks(pool);
      }
    } catch (e) {
      console.warn('[status] poll cycle failed:', e.message);
    } finally {
      inProgress = false;
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
            i.state, i.started_at, i.resolved_at, i.auto_created,
            COALESCE(json_agg(json_build_object(
              'id', u.id, 'label', u.label, 'body', u.body, 'created_at', u.created_at
            ) ORDER BY u.created_at) FILTER (WHERE u.id IS NOT NULL), '[]'::json) AS updates
       FROM status_incidents i
       LEFT JOIN status_services s ON s.id = i.service_id
       LEFT JOIN status_incident_updates u ON u.incident_id = i.id
      WHERE i.started_at >= NOW() - INTERVAL '30 days'
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
      auto_created: i.auto_created || false,
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
      // probe/statuspage are useless without a URL to poll; manual never uses one.
      if (source !== 'manual' && !(b.source_url && String(b.source_url).trim())) {
        return res.status(400).json({ error: 'source_url is required for probe and vendor-status sources' });
      }
      const sourceUrl = source === 'manual' ? null : String(b.source_url).slice(0, 500);
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
          sourceUrl,
          state,
          b.state_note ? String(b.state_note).slice(0, 200) : null,
          Number(b.position) || 0,
        ],
      );
      // Seed an initial sample so the new service's history/uptime isn't blank.
      await pool.query(`INSERT INTO status_checks (service_id, state) VALUES ($1, $2)`, [r.rows[0].id, state]);
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
      const row = r.rows[0];
      if (row.source === 'manual') {
        // Manual services don't poll a URL — keep the field clean so the admin
        // UI and pollers don't get confused.
        if (row.source_url) {
          await pool.query(`UPDATE status_services SET source_url = NULL WHERE id = $1`, [req.params.id]);
          row.source_url = null;
        }
        // Record the admin's toggle as a sample so the history bar reflects it
        // immediately rather than waiting for the next heartbeat pass.
        if (state) await pool.query(`INSERT INTO status_checks (service_id, state) VALUES ($1, $2)`, [req.params.id, row.state]);
      }
      res.json(row);
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
