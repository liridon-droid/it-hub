import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import tailwindEditorConfig from './tailwind.editor.config.js';

// Second, separate build: the guide editor as a self-contained IIFE bundle.
//
// Why not make public/admin.html a Vite entry instead? Because Vite would then
// process the whole 12k-line file — rewriting its asset URLs and inline module
// scripts. admin.html hardcodes its /portal paths *precisely because* nothing
// processes it (see the comment at public/admin.html:9-11), and the file's own
// note at :3613 records that bundling it was attempted before and failed. So we
// leave that page a static passthrough and ship React/Lexical beside it.
//
// Output lands in public/assets/ so the existing static-serving path keeps
// working unchanged: Vite copies public/ verbatim into dist/ (main build), and
// nginx already serves /assets/ (nginx.client.conf:41).
//
//   npm run build:editor     one-shot
//   npm run watch:editor     rebuild on save (dev)
export default defineConfig({
  plugins: [react()],
  // outDir lives *inside* the default publicDir ('public'), so Vite would copy
  // public/ into public/assets/ on every build — which produced a stray 614 KB
  // duplicate of admin.html plus all the fonts. This build ships one JS file
  // and needs no static assets of its own.
  publicDir: false,
  // Lib mode does not define process.env.NODE_ENV, so React's dev build was
  // bundled with every invariant and warning intact (473 KB → 141 KB once set).
  define: { 'process.env.NODE_ENV': '"production"' },
  // PostCSS is declared INLINE rather than in a root postcss.config.js, because
  // Vite auto-loads that file for every build in the project — which would run
  // Tailwind over the main SPA too. The SPA uses no Tailwind and must stay
  // untouched. Scoping it here keeps Tailwind entirely inside this bundle.
  css: {
    postcss: {
      plugins: [tailwindcss(tailwindEditorConfig), autoprefixer()],
    },
  },
  build: {
    lib: {
      entry: 'src/guide-editor/index.jsx',
      name: 'GuideEditor',      // global the page calls: window.GuideEditor.mount()
      formats: ['iife'],        // no module loader needed — plain <script src>
      fileName: () => 'guide-editor.js',
    },
    // Lib mode names the extracted stylesheet 'style.css' by default, which is
    // far too generic for a shared public/assets/ directory. Pin it alongside
    // the JS so both are obviously one unit (and so .gitignore can name them).
    rollupOptions: {
      output: {
        assetFileNames: (info) => (
          info.name?.endsWith('.css') ? 'guide-editor.css' : '[name][extname]'
        ),
      },
    },
    outDir: 'public/assets',
    // public/assets/ already holds 7 fonts + slice-logo.png. Without this Vite
    // would wipe them, and the main build copies public/ straight into dist/.
    emptyOutDir: false,
    sourcemap: true,
    target: 'es2020',
  },
});
