// Legacy Markdown → Lexical EditorState JSON.
//
// Guide bodies written before the Lexical switch are Markdown. Opening one in
// the editor used to go through plainTextToLexical(), which treats the whole
// document as plain text — so `**Step** 1:` rendered as literal asterisks, and
// re-saving that guide would have *stored* the asterisks as text and destroyed
// the formatting permanently. That is a one-way data loss on every legacy guide
// an admin happens to open and save.
//
// This uses Lexical's own Markdown importer ($convertFromMarkdownString with
// the standard TRANSFORMERS) driven by a headless editor, rather than any
// hand-rolled parsing. Headings, bold/italic, lists, checklists, quotes, code
// fences, links and inline code all become real nodes.
//
// Images are handled by IMAGE_TRANSFORMERS (imageTransformer.js) rather than by
// the default set, which has no image support at all: ImageNode is
// app-specific, and the legacy corpus embeds raw `<img …>` HTML rather than
// markdown image syntax. Without those, every screenshot in every legacy guide
// survived only as literal visible text.
import { createEditor } from 'lexical';
import { $convertFromMarkdownString, TRANSFORMERS } from '@lexical/markdown';
import { NODES } from './LexicalEditor';
import { IMAGE_TRANSFORMERS } from './imageTransformer';

// Image transformers go FIRST: @lexical/markdown tries transformers in order,
// and a raw `<img …>` line would otherwise be consumed as plain paragraph text
// before ours ever sees it.
const GUIDE_TRANSFORMERS = [...IMAGE_TRANSFORMERS, ...TRANSFORMERS];

/**
 * @param {string} markdown
 * @returns {string|null} Lexical EditorState JSON, or null if conversion failed
 *                        (callers should fall back to plainTextToLexical).
 */
export function markdownToLexicalJson(markdown) {
  const src = String(markdown || '');
  if (!src.trim()) return null;
  try {
    // Headless: no DOM, no root element attached. onError must throw nothing —
    // a single unregistered node would otherwise take down the whole import.
    const editor = createEditor({ nodes: NODES, onError: () => {} });
    let json = null;
    // discrete: true forces the update to flush synchronously, so the state is
    // readable immediately rather than on the next microtask.
    editor.update(
      () => { $convertFromMarkdownString(src, GUIDE_TRANSFORMERS); },
      { discrete: true },
    );
    json = JSON.stringify(editor.getEditorState().toJSON());
    // A conversion that yields an empty root means the transformers matched
    // nothing useful; let the caller decide rather than returning a blank doc.
    const parsed = JSON.parse(json);
    if (!parsed?.root?.children?.length) return null;
    return json;
  } catch (err) {
    console.error('[GuideEditor] Markdown import failed, falling back to plain text:', err);
    return null;
  }
}
