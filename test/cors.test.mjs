/**
 * Exercises the CORS policy with a plain node:http server, so it runs without
 * installing express or standing up Postgres.
 *
 * The middleware is lifted out of server/index.js by reading the file and
 * evaluating just that block, so this tests the SHIPPED source rather than a
 * copy that can drift.
 */
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';

const src = fs.readFileSync(new URL('../server/index.js', import.meta.url), 'utf8');
const start = src.indexOf('const CORS_ORIGINS =');
const end = src.indexOf('});', src.indexOf("app.use('/api', (req, res, next) => {")) + 3;
assert.ok(start > 0 && end > start, 'could not find the CORS block in server/index.js');
const block = src.slice(start, end);

const ALLOWED = 'chrome-extension://abcdefghijklmnopabcdefghijklmnop';
process.env.CORS_ORIGINS = `${ALLOWED}, https://example.test/`;   // trailing slash on purpose

// Minimal express-ish shim: only what the block touches.
const mw = [];
const app = { use: (_path, fn) => mw.push(fn) };
// eslint-disable-next-line no-new-func
new Function('app', 'process', 'console', block)(app, process, { log() {} });
assert.equal(mw.length, 1, 'expected exactly one middleware');
const cors = mw[0];

const server = http.createServer((req, res) => {
  res.setHeader = res.setHeader.bind(res);
  res.sendStatus = (c) => { res.statusCode = c; res.end(); };
  cors(req, res, () => { res.statusCode = 200; res.end('fell through'); });
});
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;

const call = (method, origin, extra = {}) => new Promise((resolve) => {
  const req = http.request(`${base}/api/guides`, { method, headers: { ...(origin ? { origin } : {}), ...extra } }, (res) => {
    let b = ''; res.on('data', (d) => { b += d; });
    res.on('end', () => resolve({ status: res.statusCode, h: res.headers, body: b }));
  });
  req.end();
});

let pass = 0, fail = 0;
const t = async (n, f) => { try { await f(); console.log('  ok  ' + n); pass++; }
  catch (e) { console.log('FAIL  ' + n + '\n      ' + e.message); fail++; } };

console.log('\nit-hub CORS policy\n');

await t('an allowed origin is echoed, never *', async () => {
  const r = await call('GET', ALLOWED);
  assert.equal(r.h['access-control-allow-origin'], ALLOWED);
  assert.notEqual(r.h['access-control-allow-origin'], '*', 'wildcard is illegal with credentials');
  assert.equal(r.h['access-control-allow-credentials'], 'true');
  assert.equal(r.body, 'fell through', 'a GET must continue to the route');
});

await t('Vary: Origin is set (or a cache leaks one caller\'s access to another)', async () => {
  assert.equal((await call('GET', ALLOWED)).h.vary, 'Origin');
});

await t('an unknown origin gets no CORS headers and is NOT blocked outright', async () => {
  const r = await call('GET', 'https://evil.test');
  assert.equal(r.h['access-control-allow-origin'], undefined);
  assert.equal(r.h.vary, 'Origin', 'must still vary, or a refusal gets cached for an allowed origin');
  assert.equal(r.body, 'fell through', 'the browser enforces this, not the server');
});

await t('preflight answers 204 and STOPS (never reaches the auth middleware)', async () => {
  const r = await call('OPTIONS', ALLOWED, { 'access-control-request-headers': 'content-type, x-extension-version' });
  assert.equal(r.status, 204);
  assert.equal(r.body, '', 'a preflight that falls through 401s and Chrome reports it as a CORS error');
  assert.match(r.h['access-control-allow-methods'], /GET/);
  assert.equal(r.h['access-control-allow-headers'], 'content-type, x-extension-version',
    'requested headers must be echoed, not guessed');
  assert.equal(r.h['access-control-max-age'], '600');
});

await t('a same-origin request (no Origin header) is untouched', async () => {
  const r = await call('GET', null);
  assert.equal(r.h['access-control-allow-origin'], undefined);
  assert.equal(r.h.vary, undefined);
  assert.equal(r.body, 'fell through');
});

await t('a trailing slash in config still matches', async () => {
  assert.equal((await call('GET', 'https://example.test')).h['access-control-allow-origin'], 'https://example.test');
});

await t('with CORS_ORIGINS empty, behaviour is exactly as before this change', async () => {
  process.env.CORS_ORIGINS = '';
  const mw2 = [];
  // eslint-disable-next-line no-new-func
  new Function('app', 'process', 'console', block)({ use: (_p, fn) => mw2.push(fn) }, process, { log() {} });
  const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, sendStatus() { throw new Error('should not preflight'); } };
  let next = false;
  mw2[0]({ method: 'GET', headers: { origin: ALLOWED } }, res, () => { next = true; });
  assert.ok(next, 'must fall through');
  assert.equal(res.headers['Access-Control-Allow-Origin'], undefined, 'no allow header when unconfigured');
});

server.close();
console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
