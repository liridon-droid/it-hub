// hubAuth — module-mode authentication.
//
// When it-hub runs as a paired SliceDesk *module* it's embedded cross-origin
// in an iframe, so the shared slicedesk session cookie that sliceAuth.js relies
// on is no longer available. Instead the hub appends a signed `hub_token` to
// the iframe URL (HMAC-SHA256 over the base64url payload, keyed by our
// embed_secret). Identity + role come from that token.
//
// This module mirrors sliceAuth.js's interface (attachUser / requireUser /
// requireAdmin) so server/index.js can swap implementations through
// middleware/auth.js with no call-site changes.
import crypto from 'node:crypto';
import { moduleConfig } from '../module-config.js';

const DEV_BYPASS_AUTH = ['1', 'true', 'yes'].includes(
  String(process.env.DEV_BYPASS_AUTH || '').toLowerCase(),
);

// The client injects X-Hub-Token on every /api call (see the network shim in
// src/main.jsx). Fall back to the ?hub_token= query param (the very first HTML
// load, or direct hits) and finally a Bearer header.
function getToken(req) {
  const header = req.get('x-hub-token');
  if (header) return header;
  if (req.query && req.query.hub_token) return String(req.query.hub_token);
  const auth = req.get('authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

// Verify a hub_token and return its payload, or null if invalid/expired.
// Payload shape: { sub, name, email, role, mod, iat, exp }.
export function verifyHubToken(token, secret = moduleConfig.embedSecret) {
  if (!token || !secret) return null;
  const parts = String(token).split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');

  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

// Map a verified token payload onto the req.user shape the rest of the app
// expects (same fields sliceAuth produced: id/name/email/role/roleLabel).
function toUser(payload) {
  const role = payload.role || 'employee';
  const roleLabel =
    { employee: 'Employee', admin: 'Admin', super_admin: 'Super Admin' }[role] || role;
  return {
    id: payload.sub,
    name: payload.name || '',
    email: payload.email || '',
    role,
    roleLabel,
    _hub: true,
  };
}

// Attach req.user when the request carries a valid hub_token; never rejects.
// Pair with requireUser / requireAdmin to enforce.
export async function attachUser(req, _res, next) {
  if (DEV_BYPASS_AUTH) {
    req.user = {
      id: 'dev',
      name: 'Dev User',
      email: 'dev@local',
      role: 'super_admin',
      roleLabel: 'Super Admin',
      _dev: true,
    };
    return next();
  }
  const payload = verifyHubToken(getToken(req));
  if (payload) req.user = toUser(payload);
  next();
}

// Reject unauthenticated API requests. Unlike sliceAuth there's no redirect to
// a login page — a module can't drive SSO; the hub authenticates the user
// before it ever loads us in the iframe. A missing/invalid token means the
// page wasn't opened through the hub.
export function requireUser(req, res, next) {
  if (req.user) return next();
  res.set('Cache-Control', 'no-store');
  return res.status(401).json({
    error: 'Not authenticated',
    hint: 'Open this module from the SliceDesk hub (missing or invalid hub_token).',
  });
}

export function requireAdmin(req, res, next) {
  if (!req.user) return requireUser(req, res, next);
  const role = req.user.role || 'employee';
  if (role === 'admin' || role === 'super_admin') return next();
  res.set('Cache-Control', 'no-store');
  return res.status(403).json({ error: 'Admin role required' });
}
