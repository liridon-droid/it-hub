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
