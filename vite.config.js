import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
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
