// Guide editor island — React + Lexical mounted into the otherwise-vanilla
// admin console (public/admin.html).
//
// admin.html is a static file with no build step and no React (zero
// react/createRoot/jsx references across all 12k lines). Rather than convert
// it, we expose a small imperative API on `window` that its existing vanilla
// code can drive the same way it drove the TipTap instance:
//
//   const handle = window.GuideEditor.mount(el, { value, onChange, onUpload });
//   handle.getValue();  handle.setValue(v);  handle.destroy();
//
// That mirrors the shape admin.html already expects (editor.getHTML() /
// setContent() / destroy() at :8465-8471, :11212, :11217), so replacing the
// implementation underneath does not ripple into the eight non-editor admin
// screens — none of which touch the editor at all.
//
// Content format is Lexical EditorState JSON (a string), matching what
// slicedesk stores in how_to_guides.content. No Markdown conversion anywhere:
// that is the entire reason for standardising on Lexical.
import { createRoot } from 'react-dom/client';
import { useRef, useCallback } from 'react';
import LexicalEditor from './lexical/LexicalEditor';
import LexicalViewer from './lexical/LexicalViewer';
import { isLexicalJson, plainTextToLexical, lexicalToPlainText } from './lexical/lexicalUtils';
import { markdownToLexicalJson } from './lexical/markdownImport';
import { setUploader } from './lexical/uploadAdapter';
import './editor.css';

// NOTE: no <StrictMode>. It double-invokes effects, and Lexical's editor
// instance is created in one — under Strict the second pass reinitialises the
// editor and the initial value is lost. Upstream mounts it unwrapped too.
function GuideEditorRoot({ initialValue, placeholder, onChange, toolbarTarget, onAiAction, getTitle }) {
  // Lexical's `value` prop is read on mount only; keeping it in a ref (rather
  // than state) means a parent re-render cannot clobber what the user is typing.
  const initial = useRef(initialValue);
  const handleChange = useCallback((json) => { onChange?.(json); }, [onChange]);
  return (
    <div className="guide-editor-root">
      <LexicalEditor
        value={initial.current}
        onChange={handleChange}
        placeholder={placeholder}
        minHeight="420px"
        // surface='page' is required for the full toolbar: the component does
        // `useState(surface !== 'page')` for its collapsed flag (:365), so the
        // default 'card' ships a collapsed toolbar meant for small inline
        // fields. The guide editor is a full-page authoring surface.
        surface="page"
        fillHeight
        // Hides the markdown cheat-sheet strip under the toolbar
        // ("# H1  ## H2  - list …"). It duplicates what the toolbar buttons
        // already do, and in the sticky header it costs a permanent row of
        // vertical space on every guide.
        showKeyboardHints={false}
        // Renders the toolbar into the host page's own sticky header slot
        // instead of inline above the content — where the previous TipTap
        // toolbar lived. Via a React portal, so the toolbar stays in this
        // component's tree and keeps its Lexical context.
        toolbarPortalTarget={toolbarTarget}
        // Host-provided AI bridge; see mount()'s onAiAction option.
        onAiAction={onAiAction}
        getTitle={getTitle}
      />
    </div>
  );
}

/**
 * Mount the editor into `el`.
 *
 * @param {HTMLElement} el          target container
 * @param {string}   [opts.value]   Lexical JSON string, or plain text (migrated)
 * @param {Function} [opts.onChange] (json) => void, fired on every edit
 * @param {Function} [opts.onUpload] (file) => Promise<url>, for image inserts
 * @param {string}   [opts.placeholder]
 * @returns {{getValue: Function, setValue: Function, destroy: Function, toPlainText: Function}}
 */
export function mount(el, { value = '', onChange, onUpload, placeholder, toolbarTarget = null, onAiAction = null, getTitle = null } = {}) {
  if (!el) throw new Error('GuideEditor.mount: target element is required');

  // Legacy rows hold Markdown, not Lexical JSON. Convert with Lexical's own
  // Markdown importer so `**bold**`, headings and lists become real nodes —
  // plainTextToLexical() would keep them as literal characters, and re-saving
  // would then persist the asterisks and destroy the formatting for good.
  // plainTextToLexical stays the last resort for content that is genuinely
  // plain (or where the import fails).
  const normalise = (v) => {
    if (isLexicalJson(v)) return v;
    return markdownToLexicalJson(v) || plainTextToLexical(v || '');
  };

  // Kept outside React so getValue() is synchronous — admin.html reads the body
  // inside its save handler and cannot await a state flush.
  let latest = normalise(value);
  let root = createRoot(el);
  let destroyed = false;
  // Extra update subscribers, so the vanilla host can react to edits the same
  // way it used TipTap's editor.on('update', …).
  const listeners = new Set();

  setUploader(onUpload);

  const emit = (json) => {
    latest = json;
    onChange?.(json);
    listeners.forEach((fn) => { try { fn(json); } catch (e) { console.error('[GuideEditor] listener threw:', e); } });
  };

  const render = (initialValue) => {
    root.render(
      <GuideEditorRoot
        initialValue={initialValue}
        placeholder={placeholder}
        onChange={emit}
        toolbarTarget={toolbarTarget}
        onAiAction={onAiAction}
        getTitle={getTitle}
      />,
    );
  };
  render(latest);

  /** Heading nodes, for the editor's outline / scroll-spy sidebar. */
  const headings = () => {
    try {
      const parsed = JSON.parse(latest);
      return (parsed.root?.children || [])
        .map((n, i) => ({ node: n, i }))
        .filter(({ node }) => node.type === 'heading')
        .map(({ node, i }) => ({
          level: Number(String(node.tag || 'h2').replace('h', '')) || 2,
          text: (node.children || []).map((c) => c.text || '').join('').trim(),
          index: i,
        }))
        .filter((h) => h.text);
    } catch { return []; }
  };

  return {
    getValue: () => latest,
    /** Replace the document. Remounts, because Lexical only reads `value` once. */
    setValue: (v) => {
      if (destroyed) return;
      latest = normalise(v);
      root.unmount();
      root = createRoot(el);
      render(latest);
    },
    /** Plain text of the current document — for word counts, search indexing. */
    toPlainText: () => lexicalToPlainText(latest),
    /** Word count over the plain-text projection (TipTap had characterCount). */
    wordCount: () => {
      const t = lexicalToPlainText(latest).trim();
      return t ? t.split(/\s+/).length : 0;
    },
    /**
     * True when the document has no visible text.
     *
     * Needed because callers cannot test emptiness on the serialised value any
     * more: an untouched Lexical document is still a non-empty JSON string
     * ({"root":{"children":[{"type":"paragraph"…}]}}), so the old
     * `body.trim().length > 0` checks in admin.html were always true and
     * auto-saved a draft for every editor that was merely opened.
     */
    isEmpty: () => lexicalToPlainText(latest).trim().length === 0,
    headings,
    /** Scroll the Nth top-level block into view — backs outline navigation. */
    scrollToBlock: (index) => {
      const ce = el.querySelector('[contenteditable="true"]');
      const child = ce?.children?.[index];
      if (child) child.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    focus: () => { el.querySelector('[contenteditable="true"]')?.focus(); },
    /** Subscribe to edits. Returns an unsubscribe fn. */
    on: (event, fn) => {
      if (event !== 'update' || typeof fn !== 'function') return () => {};
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    get isDestroyed() { return destroyed; },
    // Deferred: React warns when unmounting synchronously from inside a React
    // event handler, and admin.html's navigate() calls destroy() during a click.
    destroy: () => {
      destroyed = true;
      listeners.clear();
      setUploader(null);
      setTimeout(() => { try { root.unmount(); } catch { /* already gone */ } }, 0);
    },
  };
}

/**
 * Mount a READ-ONLY render of a guide body — used by the admin editor's preview
 * pane. Deliberately the same LexicalViewer the portal reader uses
 * (src/app.jsx GuideBody), so the preview is a true preview: if it renders here
 * it renders there, and a node type the reader cannot display shows up as
 * missing at authoring time rather than after publish.
 *
 * @returns {{destroy: Function}}
 */
export function mountViewer(el, value) {
  if (!el) throw new Error('GuideEditor.mountViewer: target element is required');
  const root = createRoot(el);
  root.render(
    <div className="guide-lexical-body">
      <LexicalViewer value={isLexicalJson(value) ? value : plainTextToLexical(value || '')} />
    </div>,
  );
  return { destroy: () => { setTimeout(() => { try { root.unmount(); } catch { /* gone */ } }, 0); } };
}

export const version = '0.3.0-lexical';
