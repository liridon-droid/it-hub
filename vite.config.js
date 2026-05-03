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
    proxy: {
      '/api':     { target: process.env.API_PROXY || 'http://localhost:3001', changeOrigin: true },
      '/uploads': { target: process.env.API_PROXY || 'http://localhost:3001', changeOrigin: true },
    },
  },
});
