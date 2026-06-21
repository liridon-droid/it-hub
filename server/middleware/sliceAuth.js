// sliceAuth — validate the slicedesk session for it-hub.
//
// it-hub doesn't run its own login flow. Every incoming request that
// needs auth gets verified by calling slicedesk's /api/me with the
// caller's cookies. The response (or 401) is the source of truth for
// who the user is and what role they have.
//
// To keep the round-trips cheap we cache /api/me responses keyed by
// the session cookie value for AUTH_CACHE_TTL_MS (default 60s). That
// means a logout on slicedesk takes up to a minute to be visible on
// it-hub, which is fine for an internal IT tool.
//
// Configuration (set in docker-compose env or .env):
//   SLICEDESK_API_URL    — base URL to reach slicedesk's /api/me from
//                          inside the container. On the same docker
//                          network this is e.g. http://it-catalog-server:3001
//                          From the host LAN: http://srv-ny-01:3001
//   SLICEDESK_LOGIN_URL  — full URL of slicedesk's login page; used
//                          to bounce unauthenticated browsers
//   AUTH_CACHE_TTL_MS    — optional, default 60000
//   DEV_BYPASS_AUTH      — when truthy, skip all auth (local Mac Mini
//                          dev only — never set in production)

const SLICEDESK_API_URL = (process.env.SLICEDESK_API_URL || '').replace(/\/$/, '');
const SLICEDESK_LOGIN_URL = process.env.SLICEDESK_LOGIN_URL || '/login';
const AUTH_CACHE_TTL_MS = Number(process.env.AUTH_CACHE_TTL_MS || 60_000);
const DEV_BYPASS_AUTH = ['1', 'true', 'yes'].includes(
  String(process.env.DEV_BYPASS_AUTH || '').toLowerCase(),
);

const cache = new Map(); // cookie → { user, expiresAt }

function getSessionCookie(req) {
  const raw = req.headers.cookie || '';
  // Both `it_session` (main slicedesk session) and `portal_session` (legacy
  // portal2 — about to be retired but still in flight). Accept either so
  // the demo works regardless of which session the user already has.
  const m = raw.match(/(?:^|;\s*)(?:it_session|portal_session)=([^;]+)/);
  return m ? m[1] : null;
}

async function fetchSliceUser(cookieHeader) {
  if (!SLICEDESK_API_URL) {
    throw new Error('SLICEDESK_API_URL is not configured');
  }
  const res = await fetch(`${SLICEDESK_API_URL}/api/me`, {
    headers: {
      Cookie: cookieHeader,
      Accept: 'application/json',
      'Cache-Control': 'no-store',
    },
    redirect: 'manual',
  });
  if (res.status === 401 || res.status === 302 || res.status === 303) return null;
  if (!res.ok) throw new Error(`slicedesk /api/me returned ${res.status}`);
  return res.json();
}

export async function verifySliceSession(req) {
  if (DEV_BYPASS_AUTH) {
    return {
      id: 'dev',
      name: 'Dev User',
      email: 'dev@local',
      role: 'super_admin',
      roleLabel: 'Super Admin',
      _dev: true,
    };
  }
  const cookie = getSessionCookie(req);
  if (!cookie) return null;

  const cached = cache.get(cookie);
  if (cached && cached.expiresAt > Date.now()) return cached.user;

  let user = null;
  try {
    user = await fetchSliceUser(req.headers.cookie || '');
  } catch (err) {
    // If slicedesk is down, fall through to "no user" rather than throwing.
    // Better to bounce people to login than to 500 on every request.
    console.warn('[sliceAuth] /api/me lookup failed:', err.message);
    return null;
  }

  if (user) {
    cache.set(cookie, { user, expiresAt: Date.now() + AUTH_CACHE_TTL_MS });
    if (cache.size > 5000) {
      const cutoff = Date.now();
      for (const [k, v] of cache) if (v.expiresAt < cutoff) cache.delete(k);
    }
  }
  return user;
}

// Express middleware: attach req.user if the request carries a valid
// slicedesk session, otherwise leave req.user undefined. Doesn't reject —
// pair with requireSliceUser / requireSliceAdmin to enforce.
export async function attachSliceUser(req, _res, next) {
  try {
    const user = await verifySliceSession(req);
    if (user) req.user = user;
  } catch { /* fall through with no user */ }
  next();
}

// Reject unauthenticated requests. For HTML navigations (Accept: text/html),
// 302-redirect to slicedesk's login. For API calls, 401 JSON.
export function requireSliceUser(req, res, next) {
  if (req.user) return next();
  const accept = String(req.headers.accept || '');
  if (accept.includes('text/html')) {
    const next_ = encodeURIComponent(req.originalUrl || '/');
    return res.redirect(302, `${SLICEDESK_LOGIN_URL}?next=${next_}`);
  }
  res.set('Cache-Control', 'no-store');
  return res.status(401).json({ error: 'Not authenticated', login: SLICEDESK_LOGIN_URL });
}

// Reject unless the user is a slicedesk super_admin. The IT Hub admin side
// (guide management, uploads, AI edit, insights/stats, status) is restricted
// to super_admins only — a plain 'admin' is NOT enough. Mirrors hubAuth's
// requireAdmin so the boundary is identical in cookie and module mode.
export function requireSliceAdmin(req, res, next) {
  if (!req.user) return requireSliceUser(req, res, next);
  const role = req.user.role || 'employee';
  if (role === 'super_admin') return next();
  res.set('Cache-Control', 'no-store');
  return res.status(403).json({ error: 'Super admin role required' });
}
