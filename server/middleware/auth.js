// auth — picks the auth implementation based on AUTH_MODE and re-exports it
// under the names server/index.js already imports (attachSliceUser /
// requireSliceUser / requireSliceAdmin), so switching modes is a one-line
// change with zero changes at the ~15 call sites.
//
//   AUTH_MODE=dual       (default) accept the iframe hub_token when present
//                        (embedded module mode); otherwise fall back to the
//                        slicedesk session cookie (direct /portal visits) —
//                        so /portal keeps working both ways.
//   AUTH_MODE=hub        hub_token only (pure module).
//   AUTH_MODE=slicedesk  slicedesk cookie only (legacy).
import crypto from 'node:crypto';
import { moduleConfig } from '../module-config.js';
import * as hub from './hubAuth.js';
import * as slice from './sliceAuth.js';

// Prefer the hub_token; if it's absent/invalid, fall back to the slicedesk
// cookie. Both attach helpers are no-throw, so an unconfigured side just
// yields "no user" rather than erroring.
async function attachDual(req, res, next) {
  await hub.attachUser(req, res, () => {}); // sets req.user from a valid hub_token (or DEV bypass)
  if (req.user) return next();
  return slice.attachSliceUser(req, res, next); // otherwise try the slicedesk session
}

const impls = {
  hub:       { attachUser: hub.attachUser,        requireUser: hub.requireUser,        requireAdmin: hub.requireAdmin },
  slicedesk: { attachUser: slice.attachSliceUser, requireUser: slice.requireSliceUser, requireAdmin: slice.requireSliceAdmin },
  dual:      { attachUser: attachDual,            requireUser: hub.requireUser,        requireAdmin: hub.requireAdmin },
};
const impl = impls[moduleConfig.authMode] || impls.dual;

console.log(`[auth] mode = ${moduleConfig.authMode}`);

export const attachSliceUser = impl.attachUser;
export const requireSliceUser = impl.requireUser;
export const requireSliceAdmin = impl.requireAdmin;

// ── Bot service token ───────────────────────────────────────────────────────
// Lets a trusted server-to-server caller (the IT Hub Slack bot) hit selected
// endpoints with `Authorization: Bearer $BOT_SERVICE_TOKEN` instead of a user
// session. When the bot token isn't used it falls through to normal user auth,
// so the same route keeps working for signed-in humans. Disabled entirely
// unless BOT_SERVICE_TOKEN is set in the environment.
function bearerToken(req) {
  const a = (req.get && req.get('authorization')) || '';
  const m = String(a).match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}
function tokensMatch(a, b) {
  if (!a || !b) return false;
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}
function botUser() {
  const email = process.env.BOT_DEFAULT_EMAIL || 'it-hub-slackbot@slice.com';
  return { id: 'bot:' + email, name: 'IT Hub Slackbot', email, role: 'employee', roleLabel: 'Service account', _bot: true };
}

export function requireBotOrUser(req, res, next) {
  const botToken = process.env.BOT_SERVICE_TOKEN;
  const tok = bearerToken(req);
  if (tok && botToken) {
    if (tokensMatch(tok, botToken)) { req.user = botUser(); return next(); }
    // A Bearer was supplied and a bot token is configured but it didn't match —
    // and it isn't a valid hub_token either → it's a bad bot credential. (A real
    // hub_token in the Bearer slot still falls through to normal user auth.)
    if (!hub.verifyHubToken(tok)) {
      res.set('Cache-Control', 'no-store');
      return res.status(401).json({ error: 'Invalid bot token' });
    }
  }
  return requireSliceUser(req, res, next);
}
