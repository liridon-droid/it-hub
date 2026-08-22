// "@" picker that links one guide to another.
//
// Type @ then part of a title; picking an entry inserts a MentionNode carrying
// that guide's id. Mirrors the slash-command plugin's trigger detection in this
// same file (input event → read the selection → require start-of-word), so the
// two behave consistently.
//
// The guide list is INJECTED (`searchGuides`), not fetched here: the admin
// console already holds it in memory, and hardcoding an endpoint would tie the
// editor to one host — the same reason uploads and AI are injected.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $createTextNode,
  KEY_ENTER_COMMAND,
  KEY_TAB_COMMAND,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ESCAPE_COMMAND,
  COMMAND_PRIORITY_HIGH,
} from 'lexical';
import { $createMentionNode } from './MentionNode';

const MAX_RESULTS = 6;

export default function MentionPlugin({ searchGuides }) {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [results, setResults] = useState([]);

  // Only the open flag needs to be readable from the input handler, whose
  // effect deliberately does not re-subscribe on every keystroke.
  const openRef = useRef(false);
  openRef.current = open;

  const enabled = typeof searchGuides === 'function';

  const close = useCallback(() => { setOpen(false); setQuery(''); setCursor(0); }, []);

  // Replace the "@query" the author typed with the chip.
  const insert = useCallback((guide, typedQuery) => {
    const consumed = String(typedQuery ?? '').length + 1; // +1 for the "@"
    editor.update(() => {
      const sel = $getSelection();
      if (!$isRangeSelection(sel)) return;
      const node = sel.anchor.getNode();
      const offset = sel.anchor.offset;
      if (typeof node.spliceText === 'function' && offset >= consumed) {
        // Remove the trigger text, then drop the chip in its place.
        node.spliceText(offset - consumed, consumed, '', true);
      }
      const mention = $createMentionNode(guide.id, guide.title);
      const spacer = $createTextNode(' ');
      const after = $getSelection();
      if ($isRangeSelection(after)) after.insertNodes([mention, spacer]);
    });
    close();
  }, [editor, close]);

  useEffect(() => {
    if (!enabled) return undefined;
    const rootEl = editor.getRootElement();
    if (!rootEl) return undefined;

    const refresh = (q) => {
      try {
        const hits = searchGuides(q) || [];
        setResults(hits.slice(0, MAX_RESULTS));
      } catch (err) {
        console.error('[MentionPlugin] searchGuides threw:', err);
        setResults([]);
      }
    };

    const onInput = (e) => {
      // Defer so Lexical has committed the character before we read it.
      setTimeout(() => {
        editor.getEditorState().read(() => {
          const sel = $getSelection();
          if (!$isRangeSelection(sel)) return;
          const node = sel.anchor.getNode();
          const text = node.getTextContent();
          const offset = sel.anchor.offset;

          if (!openRef.current) {
            if (e.data !== '@') return;
            // Only at a word boundary, so emails and handles mid-word are safe.
            const prev = offset >= 2 ? text[offset - 2] : '';
            if (offset >= 1 && text[offset - 1] === '@' && (offset === 1 || /\s/.test(prev))) {
              const nativeSel = window.getSelection();
              if (nativeSel && nativeSel.rangeCount > 0) {
                const rect = nativeSel.getRangeAt(0).getBoundingClientRect();
                const rootRect = rootEl.getBoundingClientRect();
                setPos({ top: rect.bottom - rootRect.top + 4, left: rect.left - rootRect.left });
              }
              setQuery('');
              setCursor(0);
              refresh('');
              setOpen(true);
            }
            return;
          }

          // Already open: re-read everything after the "@" as the query.
          const at = text.lastIndexOf('@', Math.max(0, offset - 1));
          if (at === -1) { close(); return; }
          const q = text.slice(at + 1, offset);
          // A space ends the mention attempt, as does deleting past the "@".
          if (/\s/.test(q) || q.length > 40) { close(); return; }
          setQuery(q);
          setCursor(0);
          refresh(q);
        });
      }, 0);
    };

    rootEl.addEventListener('input', onInput);
    return () => rootEl.removeEventListener('input', onInput);
  }, [editor, enabled, searchGuides, close]);

  // Keyboard nav goes through Lexical's COMMANDS, not a DOM keydown listener.
  //
  // A raw listener on the root element does not work here: Lexical attaches its
  // own root handlers when the editor mounts — before this effect runs — so its
  // Enter handling wins and the picker's selection was ignored (clicking an
  // entry worked, pressing Enter did nothing). Registering at
  // COMMAND_PRIORITY_HIGH and returning true both takes precedence and tells
  // Lexical the key is consumed, so no stray newline is inserted.
  //
  // Re-registers whenever the list or cursor changes so the handlers always see
  // current values.
  useEffect(() => {
    if (!open) return undefined;
    const stop = (fn) => (e) => { e?.preventDefault?.(); fn(); return true; };
    const unregister = [
      editor.registerCommand(KEY_ARROW_DOWN_COMMAND,
        stop(() => setCursor((c) => Math.min(c + 1, results.length - 1))), COMMAND_PRIORITY_HIGH),
      editor.registerCommand(KEY_ARROW_UP_COMMAND,
        stop(() => setCursor((c) => Math.max(c - 1, 0))), COMMAND_PRIORITY_HIGH),
      editor.registerCommand(KEY_ESCAPE_COMMAND, stop(close), COMMAND_PRIORITY_HIGH),
      // Enter/Tab only claim the key when there is something to pick; otherwise
      // return false so Lexical handles them normally.
      // Enter/Tab only claim the key when there is something to pick; otherwise
      // return false so Lexical inserts a newline as usual.
      editor.registerCommand(KEY_ENTER_COMMAND, (e) => {
        const pick = results[cursor];
        if (!pick) return false;
        e?.preventDefault?.();
        insert(pick, query);
        return true;
      }, COMMAND_PRIORITY_HIGH),
      editor.registerCommand(KEY_TAB_COMMAND, (e) => {
        const pick = results[cursor];
        if (!pick) return false;
        e?.preventDefault?.();
        insert(pick, query);
        return true;
      }, COMMAND_PRIORITY_HIGH),
    ];
    return () => unregister.forEach((u) => u());
  }, [editor, open, results, cursor, query, insert, close]);

  if (!open || !enabled) return null;

  return (
    <div className="lexical-mention-menu" style={{ top: pos.top, left: pos.left }}>
      {results.length === 0 ? (
        <div className="lexical-mention-empty">
          {query ? `No guide matching “${query}”` : 'Type to search guides…'}
        </div>
      ) : results.map((g, i) => (
        <button
          key={g.id}
          type="button"
          className={`lexical-mention-item${i === cursor ? ' is-active' : ''}`}
          onMouseEnter={() => setCursor(i)}
          // mousedown, not click: click fires after the editor has already lost
          // the selection we need in order to splice out the trigger text.
          onMouseDown={(ev) => { ev.preventDefault(); insert(g, query); }}
        >
          <span className="lexical-mention-title">{g.title}</span>
          {g.category ? <span className="lexical-mention-cat">{g.category}</span> : null}
        </button>
      ))}
    </div>
  );
}
