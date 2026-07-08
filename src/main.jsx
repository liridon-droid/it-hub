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

// ── Dev-only Knowledge-base fixtures ────────────────────────────────────────
// The KB loads from the hub (/api/guides). In `npm run dev` there's no backend,
// so those calls fail (the Vite proxy can't reach :3001) and the Knowledge page
// renders empty — nothing to iterate on. This shim serves a couple of sample
// guides, but ONLY in dev AND ONLY when the real API is unavailable or returns
// no rows, so a real dev backend still wins. import.meta.env.DEV is false in
// production builds, so this whole block is dropped from the shipped bundle —
// prod always shows real guides only.
if (import.meta.env.DEV) {
  const md = (lines) => lines.join('\n');
  const DEV_SAMPLE_GUIDES = [
    {
      id: 90001,
      title: 'Set up Slice email on your phone',
      category: 'Email',
      tags: ['email', 'mobile', 'outlook'],
      source_type: 'guide',
      helpful_count: 42, unhelpful_count: 3,
      created_at: '2026-05-02T09:00:00.000Z',
      updated_at: '2026-06-28T14:30:00.000Z',
      metadata: {},
      body: md([
        'Add your Slice email to the Outlook mobile app in a couple of minutes.',
        '',
        '## Before you start',
        '',
        '- Install **Microsoft Outlook** from the App Store or Google Play.',
        '- Have your OneLogin password handy.',
        '',
        '## Steps',
        '',
        '1. Open Outlook and tap **Add Account**.',
        '2. Enter your `name@slice.com` address and tap **Continue**.',
        "3. You'll be redirected to OneLogin — sign in and approve the MFA prompt.",
        '4. When asked to add another account, tap **Maybe Later**.',
        '',
        "That's it — mail, calendar, and contacts sync automatically.",
        '',
        '> Still stuck? File a ticket and IT will help you finish setup.',
      ]),
    },
    {
      id: 90002,
      title: 'Report a phishing email',
      category: 'Security',
      tags: ['security', 'phishing', 'email'],
      source_type: 'guide',
      helpful_count: 88, unhelpful_count: 1,
      created_at: '2026-04-11T11:15:00.000Z',
      updated_at: '2026-07-01T08:05:00.000Z',
      metadata: {},
      body: md([
        'See something suspicious? Reporting it takes seconds and keeps everyone safer.',
        '',
        '## How to report',
        '',
        '1. Open the suspicious email.',
        '2. Click the **Report Phishing** button in the toolbar.',
        '3. Confirm — it goes to the security team and leaves your inbox.',
        '',
        '## What counts as phishing?',
        '',
        '- Unexpected password-reset or invoice requests.',
        '- Links to look-alike login pages.',
        '- Urgent "act now" language from an unknown sender.',
        '',
        'If you already clicked a link or entered your password, **change it in OneLogin immediately** and file a ticket.',
      ]),
    },
  ];

  const jsonRes = (data) => new Response(JSON.stringify(data), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
  const baseFetch = window.fetch;
  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : '');
    const path = url.replace(window.location.origin, '');
    const isList = /\/api\/guides(?:\?|$)/.test(path);
    const idMatch = path.match(/\/api\/guides\/(\d+)(?:\?|$)/);
    if (!isList && !idMatch) return baseFetch(input, init);
    try {
      const res = await baseFetch(input, init);
      if (isList) {
        if (res.ok) {
          const data = await res.clone().json().catch(() => null);
          if (Array.isArray(data) && data.length) return res; // real guides win
        }
        return jsonRes(DEV_SAMPLE_GUIDES);
      }
      if (res.ok) return res;
      const g = DEV_SAMPLE_GUIDES.find((x) => String(x.id) === idMatch[1]);
      return g ? jsonRes(g) : res;
    } catch (e) {
      if (isList) return jsonRes(DEV_SAMPLE_GUIDES);
      const g = DEV_SAMPLE_GUIDES.find((x) => String(x.id) === idMatch[1]);
      if (g) return jsonRes(g);
      throw e;
    }
  };
}

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
// slicedesk owns auth and is served at the domain root (/), so its login is
// /login — NOT /portal/login (that path is the it-hub SPA, which would just
// re-bounce here → an infinite refresh loop on logout / when signed out).
const LOGIN_URL = '/login';

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
    if (hub.sub)   window.PORTAL_CURRENT_ID    = hub.sub;
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
      if (j?.id)    window.PORTAL_CURRENT_ID    = j.id;
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
