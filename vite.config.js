import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In prod the app is served behind nginx at https://it.slice.services/portal/.
// Setting `base: '/portal/'` makes Vite emit asset URLs like
// `/portal/assets/index.abcdef.js` so they resolve correctly through the
// proxy. Override with VITE_BASE_PATH=/ when developing locally with the
// Vite dev server on port 5173.
const BASE = process.env.VITE_BASE_PATH ?? '/portal/';

export default defineConfig({
  base: BASE,
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    // Proxy /api requests to the IT Hub server on localhost:3001 if you have
    // it running locally (`cd ../server && npm run dev`). Without it, fetches
    // to /api/* simply 404 and the page falls back to the placeholder data.
    // ⚠️ BASE defaults to '/portal/', and main.jsx's network shim prefixes
    // import.meta.env.BASE_URL onto every /api/ and /uploads/ call — in dev
    // too. So the browser actually requests '/portal/api/…', which the bare
    // '/api' rules below never matched: the request fell through to Vite's
    // SPA fallback and came back as 200 text/html, which every caller then
    // failed to parse as JSON. The documented "run the server and reload to
    // get real data" flow in README/DEV.md could not have worked by default.
    // Match the prefixed paths too, stripping the base before proxying.
    proxy: (() => {
      const target = process.env.API_PROXY || 'http://localhost:3001';
      const rules = {
        '/api':     { target, changeOrigin: true },
        '/uploads': { target, changeOrigin: true },
      };
      const prefix = BASE.replace(/\/$/, '');
      if (prefix) {
        const strip = (path) => path.slice(prefix.length);
        rules[prefix + '/api']     = { target, changeOrigin: true, rewrite: strip };
        rules[prefix + '/uploads'] = { target, changeOrigin: true, rewrite: strip };
      }
      return rules;
    })(),
  },
});
