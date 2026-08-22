/**
 * Helpers shared between LexicalEditor and LexicalViewer.
 */

/**
 * Detect whether a string is a serialised Lexical EditorState JSON.
 */
export function isLexicalJson(value) {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trimStart();
  if (!trimmed.startsWith('{')) return false;
  try {
    const obj = JSON.parse(trimmed);
    return obj && typeof obj === 'object' && obj.root !== undefined;
  } catch {
    return false;
  }
}

/**
 * Convert a plain-text string into a minimal Lexical EditorState JSON string.
 * Each line becomes its own paragraph node.
 */
export function plainTextToLexical(text) {
  const lines = String(text || '').split('\n');
  const children = lines.map((line) => ({
    type: 'paragraph',
    version: 1,
    direction: 'ltr',
    format: '',
    indent: 0,
    children: line
      ? [{ type: 'text', version: 1, text: line, format: 0, mode: 'normal', style: '', detail: 0 }]
      : [],
  }));

  return JSON.stringify({
    root: {
      type: 'root',
      version: 1,
      direction: 'ltr',
      format: '',
      indent: 0,
      children,
    },
  });
}

/**
 * Extract plain text from a Lexical JSON string (for search / fallback).
 */
export function lexicalToPlainText(value) {
  if (!isLexicalJson(value)) return value || '';
  try {
    const obj = JSON.parse(value);
    const texts = [];
    function walk(node) {
      if (node.text) texts.push(node.text);
      if (node.children) node.children.forEach(walk);
    }
    walk(obj.root);
    return texts.join(' ');
  } catch {
    return value || '';
  }
}
