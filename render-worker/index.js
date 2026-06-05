// it-hub render worker — headless monitoring for JS-only status pages.
//
// Some vendors (e.g. Adyen) render their status page entirely client-side and
// publish no JSON / RSS / Atom / webhook. There's no feed to poll, and the raw
// HTML carries no status text — it only exists after JavaScript runs. This
// worker is the answer: it loads each flagged page in a headless browser, reads
// the rendered status, and POSTs the result to the hub's inbound webhook — i.e.
// it behaves exactly like a vendor that *did* have webhooks. The hub treats it
// like any other webhook push (state + incident timeline + Slack), so nothing in
// the main app needs to know about rendering. Runs as its own container so the
// lean it-hub-server never carries Chromium.
//
// Targets are discovered from the DB: any status_services row with
// source = 'render' (set in the admin) that has a webhook_token + page URL.

import pg from 'pg';
import { chromium } from 'playwright';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://portal2:portal2@it-hub-postgres:5432/portal2';
const HUB_INTERNAL_URL = (process.env.HUB_INTERNAL_URL || 'http://it-hub-server:3001').replace(/\/$/, '');
const INTERVAL_MS = Number(process.env.RENDER_INTERVAL_MS || 5 * 60 * 1000); // rendering is heavy → slow cadence
const NAV_TIMEOUT_MS = Number(process.env.RENDER_TIMEOUT_MS || 30_000);
const SETTLE_MS = Number(process.env.RENDER_SETTLE_MS || 1500); // let late XHR-driven status paint
// Extra "all clear" phrases for vendors whose wording differs, '|'-separated.
const EXTRA_OK = (process.env.RENDER_OK_PHRASES || '').split('|').map((s) => s.trim().toLowerCase()).filter(Boolean);

// A page is operational only if it shows an explicit all-clear banner. We anchor
// on the positive phrase on purpose: status-page *legends* contain every severity
// word ("Operational", "Degraded performance", "Severely degraded performance"),
// so a plain keyword scan would always false-positive. The full all-clear phrase
// never appears in a legend, so its presence is a reliable green and its absence
// means an incident is being shown.
const OK_PHRASES = [
  'all services are operational',
  'all systems operational',
  'all systems are operational',
  'all systems go',
  'no incidents reported',
  'no known issues',
  ...EXTRA_OK,
];

const STATUS_MAP = { operational: 'operational', degraded: 'degraded_performance', down: 'major_outage' };
const pool = new pg.Pool({ connectionString: DATABASE_URL });

function deriveState(text) {
  const t = (text || '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (!t) return { state: 'degraded', reason: 'empty render' };
  if (OK_PHRASES.some((p) => t.includes(p))) return { state: 'operational', reason: 'all-clear banner present' };
  // No all-clear banner → something is being reported. Severity can't be told
  // apart reliably from page text (legends pollute keyword scans), so we report
  // 'degraded' — an honest "something's up, check the page" rather than a guessed
  // red/green. (Per-target severity rules can come later.)
  return { state: 'degraded', reason: 'no all-clear banner' };
}

async function postToHub(token, name, state) {
  const newStatus = STATUS_MAP[state] || 'operational';
  // Statuspage component-event shape — the hub's webhook parser already handles it.
  const body = {
    component: { name, status: newStatus },
    component_update: { new_status: newStatus },
    _source: 'it-hub-render-worker',
  };
  const r = await fetch(`${HUB_INTERNAL_URL}/api/status/webhook/${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`hub webhook HTTP ${r.status}`);
}

async function renderText(browser, url) {
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (compatible; Slice-IT-Hub render-worker)',
    viewport: { width: 1280, height: 900 },
  });
  try {
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: NAV_TIMEOUT_MS });
    if (SETTLE_MS) await page.waitForTimeout(SETTLE_MS);
    return await page.evaluate(() => (document.body ? document.body.innerText : ''));
  } finally {
    await ctx.close().catch(() => {});
  }
}

async function runPass(browser) {
  const { rows } = await pool.query(
    `SELECT id, name, source_url, webhook_token
       FROM status_services
      WHERE source = 'render' AND webhook_token IS NOT NULL AND source_url IS NOT NULL`,
  );
  if (!rows.length) { console.log('[render] no render targets'); return; }
  for (const s of rows) {
    try {
      const text = await renderText(browser, s.source_url);
      const { state, reason } = deriveState(text);
      await postToHub(s.webhook_token, s.name, state);
      console.log(`[render] ${s.name} → ${state} (${reason})`);
    } catch (e) {
      // A transient render/nav failure shouldn't page everyone, so we DON'T push
      // 'down' — the hub simply keeps the last known state until the next pass.
      console.warn(`[render] ${s.name} failed: ${e.message}`);
    }
  }
}

async function launch() {
  return chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
}

async function main() {
  console.log(`[render] worker up — every ${Math.round(INTERVAL_MS / 1000)}s → ${HUB_INTERNAL_URL}`);
  let browser = await launch();
  let stopped = false;

  const tick = async () => {
    if (stopped) return;
    try {
      if (!browser.isConnected()) browser = await launch();
      await runPass(browser);
    } catch (e) { console.warn('[render] pass failed:', e.message); }
  };

  await tick();
  const handle = setInterval(tick, INTERVAL_MS);

  for (const sig of ['SIGINT', 'SIGTERM']) {
    process.on(sig, async () => {
      if (stopped) return;
      stopped = true;
      clearInterval(handle);
      await browser.close().catch(() => {});
      await pool.end().catch(() => {});
      process.exit(0);
    });
  }
}

main().catch((e) => { console.error('[render] fatal:', e); process.exit(1); });
