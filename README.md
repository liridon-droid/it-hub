# /portal2 — Local Development

Self-contained Vite + React 18 project for the Slice IT Hub `/portal2` page.
Decoded from the live production bundle so it includes every patch we've
applied (real user wiring, sign out, layout fixes, modal headers, etc.).

## Quick start

```bash
npm install
npm run dev
```

Opens `http://localhost:5173` automatically. Hot-reload works on every save
inside `src/` and `public/`.

## Project layout

```
portal2-local/
├── index.html              # Vite entry point
├── package.json
├── vite.config.js          # /api proxy to localhost:3001 if you run the server
├── public/
│   └── assets/
│       ├── slice-logo.png  # the nav logo
│       └── <uuid>.woff2    # fonts (loaded by the bundle's CSS via UUID)
└── src/
    ├── main.jsx            # bootstraps React, exposes globals, mounts <App />
    ├── styles.css          # all the cheese/charcoal styles
    └── app.jsx             # ALL the JSX modules concatenated (~600 KB)
```

## What's in `src/app.jsx`

Every component from the standalone bundle, in dependency order:

`data → icons → device-art → slice-pickers → it-checklist → components →
profile → tweaks-panel → approval-cards → onboarding-history → onboarding →
offboarding → offboarding-steps → hub-pages → app`

Each section is delimited by a `// ─── name (uuid8) ─────` header.
The final line is `export default App;` so `main.jsx` can mount it.

## "I want each module in its own file"

You can split this file later. The mechanical move is:

1. For each `// ─── name ─────` section, create `src/name.jsx`
2. Move that section into the new file
3. At the top, add `import React from 'react';`
4. Export every top-level `function Foo()` (`export function Foo() {...}`)
5. In files that reference those functions, add the imports

Recommend splitting `onboarding.jsx` first since it's by far the largest. The
other modules are mostly self-contained.

## Connecting to the IT Hub backend

`vite.config.js` proxies `/api/*` to `http://localhost:3001`. To wire up real
data:

1. In a separate terminal: `cd ../server && npm install && npm run dev`
2. Reload `http://localhost:5173` — `fetch('/api/...')` now hits the real server
3. Auth bootstrap: by default `main.jsx` hardcodes `window.PORTAL_CURRENT_USER`
   to "Mergim Kelmendi". To get the real authenticated user, replace those
   lines with a real fetch:

   ```js
   const r = await fetch('/api/portal/auth/me', { credentials: 'include' });
   if (r.ok) {
     const u = await r.json();
     window.PORTAL_CURRENT_USER = u.name;
     window.PORTAL_CURRENT_EMAIL = u.email;
   }
   ```

## Differences from production

| Thing | Production (`/portal2`) | This local project |
|---|---|---|
| Auth | Real OneLogin + `it_session` cookie | Stubbed — hardcoded user in `main.jsx` |
| Backend | Express + SQLite | None unless you run `cd ../server && npm run dev` |
| Bundling | Self-unpacking standalone HTML | Standard Vite |
| Babel | Runtime, in-browser | Build-time |
| Fonts | UUID-keyed, served from blob URLs | Google Fonts CDN |
| First load | ~1.6 MB self-unpacking | ~normal Vite chunks |

## Re-syncing with the production bundle

When the live `/portal2` bundle changes (new design Claude export +
re-applied patches), regenerate this project from scratch:

```bash
# from the repo root
python3 ../work/build_local_project.py
```

Your local edits to `src/app.jsx` will be **overwritten** — so move important
changes into separate split files first, OR git-commit your edits before
regenerating.
