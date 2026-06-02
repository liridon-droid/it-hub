import React from 'react';
import * as ReactDOM from 'react-dom/client';
import './styles.css';

// In production the app is served at /portal2/ and slicedesk's nginx
// only proxies /portal2/api/* → it-hub-server. The 30+ fetch('/api/…')
// calls scattered through app.jsx all need rewriting to '/portal2/api/…'.
// Doing that at the network layer here keeps every component oblivious
// to the deploy path, so dev (no prefix) and prod (/portal2 prefix)
// share one source. Set window.IT_HUB_BASE='' to disable.
//
// Both fetch AND XHR get the patch: the screenshot/image upload uses
// XHR (for progress + abort), and without this XHR open() would skip
// the prefix and 404 in production.
(function patchNetworkForApiCalls() {
  // Base-path rewrite: in prod the app is mounted at /portal/ and slicedesk's
  // nginx only proxies /portal/api/* → it-hub-server, so every /api/… and
  // /uploads/… call needs the prefix. Set window.IT_HUB_BASE='' to disable.
  const base = (typeof window !== 'undefined' && window.IT_HUB_BASE !== undefined)
    ? String(window.IT_HUB_BASE)
    : (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  const shouldHandle = (p) => typeof p === 'string' && (p.startsWith('/api/') || p.startsWith('/uploads/'));

  // Module mode: the hub embeds us cross-origin in an iframe and appends
  // ?hub_token=… — a short-lived HMAC token identifying the signed-in user.
  // Forward it as X-Hub-Token on every API call; the server's hubAuth
  // middleware verifies it (server/middleware/hubAuth.js). Read it live each
  // call — the hub refreshes the token ~hourly by updating the iframe URL.
  // (Note: this runs even when base is empty, so token forwarding works no
  // matter where the module is mounted.)
  const hubToken = () => {
    try { return new URLSearchParams(window.location.search).get('hub_token') || ''; }
    catch { return ''; }
  };

  const origFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const tok = hubToken();
    if (typeof input === 'string' && shouldHandle(input)) {
      if (base) input = base + input;
      if (tok) {
        const h = new Headers((init && init.headers) || {});
        if (!h.has('X-Hub-Token')) h.set('X-Hub-Token', tok);
        init = { ...init, headers: h };
      }
    } else if (input instanceof Request && input.url.startsWith(window.location.origin)) {
      const p = input.url.slice(window.location.origin.length);
      if (shouldHandle(p) && (base || tok)) {
        const req = new Request(window.location.origin + (base ? base + p : p), input);
        if (tok && !req.headers.has('X-Hub-Token')) req.headers.set('X-Hub-Token', tok);
        input = req;
      }
    }
    return origFetch(input, init);
  };

  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    this.__itHubApiCall = shouldHandle(url);
    if (this.__itHubApiCall && base) arguments[1] = base + url;
    return origOpen.apply(this, arguments);
  };
  const origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (...args) {
    if (this.__itHubApiCall) {
      const tok = hubToken();
      if (tok) { try { this.setRequestHeader('X-Hub-Token', tok); } catch {} }
    }
    return origSend.apply(this, args);
  };
})();

// The bundle's JSX uses React.useState, ReactDOM.createPortal, etc., as if
// they were globals (because in the standalone bundle they are). Expose them
// on window before importing App so the JSX inside app.jsx finds them.
window.React = React;
window.ReactDOM = ReactDOM;
window.useState = React.useState;
window.useEffect = React.useEffect;
window.useRef = React.useRef;
window.useMemo = React.useMemo;
window.useCallback = React.useCallback;
window.useReducer = React.useReducer;
window.useContext = React.useContext;
window.useLayoutEffect = React.useLayoutEffect;

import App from './app.jsx';

// Hydrate the current user before mounting. Two modes:
//  • module mode — the hub embeds us in an iframe with a ?hub_token=… that
//    identifies the user. We decode it for instant identity (display only —
//    the server verifies the HMAC signature) and never redirect; the hub
//    owns auth, so a 401 just means the token is missing/expired.
//  • legacy same-origin mode — no hub_token; /api/me resolves the slicedesk
//    session and a 401 bounces to the Slice SSO page.
// Wrapped in an IIFE (not top-level await) so esbuild can target older browsers.
const LOGIN_URL = '/portal/login';

function decodeHubToken() {
  try {
    const t = new URLSearchParams(window.location.search).get('hub_token');
    if (!t) return null;
    const payload = t.split('.')[0];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch { return null; }
}

(async function bootstrap() {
  const hub = decodeHubToken();
  if (hub) {
    if (hub.name)  window.PORTAL_CURRENT_USER  = hub.name;
    if (hub.email) window.PORTAL_CURRENT_EMAIL = hub.email;
    if (hub.role)  window.PORTAL_CURRENT_ROLE  = hub.role;
  }

  let authed = false;
  try {
    const r = await fetch('/api/me', { credentials: 'include', cache: 'no-store' });
    if (r.ok) {
      authed = true;
      const j = await r.json();
      if (j?.name)  window.PORTAL_CURRENT_USER  = j.name;
      if (j?.email) window.PORTAL_CURRENT_EMAIL = j.email;
      if (j?.role)  window.PORTAL_CURRENT_ROLE  = j.role;
    } else if (r.status === 401 && !hub) {
      // Legacy mode only: bounce to the Slice SSO page. The `next=` param is
      // preserved through OneLogin so the user lands back here after sign-in.
      // In module mode we never redirect — we render with the decoded token
      // identity and let the hub refresh the token in the iframe URL.
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.replace(`${LOGIN_URL}?next=${next}`);
      return;
    }
  } catch {
    // Network error or auth-server unreachable. Don't lock anyone out
    // on a transient failure — render with placeholder identity.
  }

  if (!authed) {
    if (!window.PORTAL_CURRENT_USER)  window.PORTAL_CURRENT_USER  = hub?.name  || 'Slice IT';
    if (!window.PORTAL_CURRENT_EMAIL) window.PORTAL_CURRENT_EMAIL = hub?.email || 'it@slice.com';
  }

  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<App />);
})();
