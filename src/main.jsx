import React from 'react';
import * as ReactDOM from 'react-dom/client';
import './styles.css';

// In production the app is served at /portal2/ and slicedesk's nginx
// only proxies /portal2/api/* → it-hub-server. The 30+ fetch('/api/…')
// calls scattered through app.jsx all need rewriting to '/portal2/api/…'.
// Doing that at the network layer here keeps every component oblivious
// to the deploy path, so dev (no prefix) and prod (/portal2 prefix)
// share one source. Set window.IT_HUB_BASE='' to disable.
(function patchFetchForBasePath() {
  const base = (typeof window !== 'undefined' && window.IT_HUB_BASE !== undefined)
    ? String(window.IT_HUB_BASE)
    : (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  if (!base) return;
  const orig = window.fetch.bind(window);
  window.fetch = (input, init) => {
    if (typeof input === 'string') {
      if (input.startsWith('/api/') || input.startsWith('/uploads/')) {
        input = base + input;
      }
    } else if (input instanceof Request) {
      const u = input.url;
      if (u.startsWith(window.location.origin)) {
        const p = u.slice(window.location.origin.length);
        if (p.startsWith('/api/') || p.startsWith('/uploads/')) {
          input = new Request(window.location.origin + base + p, input);
        }
      }
    }
    return orig(input, init);
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

// Hydrate the current user from /api/me (which proxies to slicedesk's
// session) before mounting. If the user isn't authenticated we redirect
// to the Slice-branded /portal/login page instead of rendering — the
// React tree never mounts for logged-out visitors. Wrapped in an IIFE
// rather than top-level await so esbuild can target older browsers
// without complaint.
const LOGIN_URL = '/portal/login';
(async function bootstrap() {
  let authed = false;
  try {
    const r = await fetch('/api/me', { credentials: 'include', cache: 'no-store' });
    if (r.ok) {
      authed = true;
      const j = await r.json();
      if (j?.name)  window.PORTAL_CURRENT_USER  = j.name;
      if (j?.email) window.PORTAL_CURRENT_EMAIL = j.email;
      if (j?.role)  window.PORTAL_CURRENT_ROLE  = j.role;
    } else if (r.status === 401) {
      // Unauthenticated → bounce to the Slice-branded SSO page. The
      // `next=` param is preserved through OneLogin so the user lands
      // back here after sign-in.
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.replace(`${LOGIN_URL}?next=${next}`);
      return;
    }
  } catch {
    // Network error or auth-server unreachable. Don't lock anyone out
    // on a transient failure — render with placeholder identity.
  }

  if (!authed) {
    if (!window.PORTAL_CURRENT_USER)  window.PORTAL_CURRENT_USER  = 'Slice IT';
    if (!window.PORTAL_CURRENT_EMAIL) window.PORTAL_CURRENT_EMAIL = 'it@slice.com';
  }

  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<App />);
})();
