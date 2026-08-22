/** @type {import('tailwindcss').Config} */
//
// Tailwind ONLY for the guide-editor island. it-hub itself uses no Tailwind
// (the SPA styles with inline style={{}} objects and src/styles.css; admin.html
// has ~2,900 lines of hand-written CSS). The ported Lexical editor from
// slicedesk has 122 className sites against slicedesk's custom token names, so
// bringing the token layer over is far cheaper than rewriting all of them.
//
// This config is referenced inline from vite.editor.config.js — deliberately
// NOT via a root postcss.config.js, which Vite would apply to the main SPA
// build too.
export default {
  // Scoped to the island. Everything else in the repo is invisible to Tailwind,
  // so the utility layer stays small (only classes actually used get emitted).
  content: ['./src/guide-editor/**/*.{js,jsx}'],
  corePlugins: {
    // CRITICAL: Tailwind's base reset is global and unscoped. admin.html is a
    // fully hand-styled page; letting preflight in would restyle its buttons,
    // headings, tables and lists everywhere. The editor does not need it —
    // lexicalTheme.css already normalises what it renders.
    preflight: false,
  },
  theme: {
    extend: {
      // Mirrors slicedesk/client/tailwind.config.js. Values resolve from the
      // --color-*-rgb custom properties defined in src/guide-editor/editor.css,
      // which are scoped to .guide-editor-root rather than :root so they cannot
      // leak into admin.html's own cascade.
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--color-primary-rgb) / <alpha-value>)',
          hover: 'rgb(var(--color-primary-hover-rgb) / <alpha-value>)',
          light: 'rgb(var(--color-primary-light-rgb) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'rgb(var(--color-success-rgb) / <alpha-value>)',
          bg: 'rgb(var(--color-success-bg-rgb) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'rgb(var(--color-warning-rgb) / <alpha-value>)',
          bg: 'rgb(var(--color-warning-bg-rgb) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'rgb(var(--color-danger-rgb) / <alpha-value>)',
          bg: 'rgb(var(--color-danger-bg-rgb) / <alpha-value>)',
        },
        surface: {
          DEFAULT: 'rgb(var(--color-surface-rgb) / <alpha-value>)',
          raised: 'rgb(var(--color-surface-raised-rgb) / <alpha-value>)',
          subtle: 'rgb(var(--color-surface-subtle-rgb) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'rgb(var(--color-border-rgb) / <alpha-value>)',
          strong: 'rgb(var(--color-border-strong-rgb) / <alpha-value>)',
        },
        'text-primary': 'rgb(var(--color-text-rgb) / <alpha-value>)',
        'text-secondary': 'rgb(var(--color-text-secondary-rgb) / <alpha-value>)',
        'text-muted': 'rgb(var(--color-text-muted-rgb) / <alpha-value>)',
        bg: 'rgb(var(--color-bg-rgb) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['"Archivo"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
