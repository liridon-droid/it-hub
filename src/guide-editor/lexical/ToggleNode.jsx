// Collapsible / toggle block — a real <details> element, not a decoration.
//
// What this replaces: both the toolbar and the slash menu previously "inserted a
// toggle" by creating a QuoteNode and setting its text to the literal string
// "▸ Click to expand..." — which also destroyed whatever the author had
// selected. It did not collapse, it was indistinguishable from a quote on
// reload, and clicking it did nothing. This is the real thing.
//
// Built on native <details>/<summary>, so:
//   - collapsing works in the read-only portal with no JS at all
//   - it is keyboard accessible and screen-reader friendly for free
//   - `open` persists into the saved JSON, so the author's chosen default sticks
//
// Structure: ToggleNode (<details>) contains a ToggleSummaryNode (<summary>,
// the always-visible label) followed by any number of ordinary blocks, which
// are the collapsible body.
import { ElementNode, $createParagraphNode, $createTextNode, $getNodeByKey } from 'lexical';

// ── The <summary> label ───────────────────────────────────────────────────
export class ToggleSummaryNode extends ElementNode {
  static getType() { return 'toggle-summary'; }
  static clone(node) { return new ToggleSummaryNode(node.__key); }

  createDOM() {
    const el = document.createElement('summary');
    el.className = 'lexical-toggle-summary';
    return el;
  }

  updateDOM() { return false; }

  static importDOM() {
    return {
      summary: () => ({ conversion: () => ({ node: $createToggleSummaryNode() }), priority: 2 }),
    };
  }

  exportDOM() { return { element: this.createDOM() }; }

  static importJSON() { return $createToggleSummaryNode(); }

  exportJSON() {
    return { ...super.exportJSON(), type: 'toggle-summary', version: 1 };
  }

  // Enter in the summary moves into the body rather than creating a second
  // <summary> (which would be invalid HTML and render as plain text).
  insertNewAfter(_selection, restoreSelection) {
    const paragraph = $createParagraphNode();
    this.insertAfter(paragraph, restoreSelection);
    return paragraph;
  }

  canIndent() { return false; }
  canBeEmpty() { return true; }
  isShadowRoot() { return false; }
}

export function $createToggleSummaryNode() { return new ToggleSummaryNode(); }
export function $isToggleSummaryNode(node) { return node instanceof ToggleSummaryNode; }

// ── The <details> container ───────────────────────────────────────────────
export class ToggleNode extends ElementNode {
  __open;

  static getType() { return 'toggle'; }
  static clone(node) { return new ToggleNode(node.__open, node.__key); }

  constructor(open = false, key) {
    super(key);
    this.__open = !!open;
  }

  // `editor` is Lexical's second createDOM argument — needed so the native
  // <details> toggle can be written back into the node.
  createDOM(_config, editor) {
    const el = document.createElement('details');
    el.className = 'lexical-toggle';
    if (this.__open) el.setAttribute('open', '');

    // Without this the open/closed state lives only in the DOM: clicking the
    // summary collapsed the block visually while exportJSON still reported the
    // old value, so the author's chosen default was silently lost on save.
    //
    // The getOpen() !== el.open guard matters — setting the attribute in
    // updateDOM also fires 'toggle', which would otherwise loop.
    const key = this.getKey();
    el.addEventListener('toggle', () => {
      editor.update(() => {
        const node = $getNodeByKey(key);
        if ($isToggleNode(node) && node.getOpen() !== el.open) node.setOpen(el.open);
      });
    });
    return el;
  }

  updateDOM(prevNode, dom) {
    if (prevNode.__open !== this.__open) {
      if (this.__open) dom.setAttribute('open', '');
      else dom.removeAttribute('open');
    }
    return false;
  }

  static importDOM() {
    return {
      details: (domNode) => ({
        conversion: (el) => ({ node: $createToggleNode(el.hasAttribute('open')) }),
        priority: 2,
      }),
    };
  }

  exportDOM() { return { element: this.createDOM() }; }

  static importJSON(serializedNode) {
    return $createToggleNode(serializedNode.open);
  }

  exportJSON() {
    return { ...super.exportJSON(), type: 'toggle', version: 1, open: this.__open };
  }

  getOpen() { return this.__open; }

  setOpen(open) {
    const writable = this.getWritable();
    writable.__open = !!open;
    return writable;
  }

  canIndent() { return false; }
  canBeEmpty() { return false; }
}

export function $createToggleNode(open = false) { return new ToggleNode(open); }
export function $isToggleNode(node) { return node instanceof ToggleNode; }

/**
 * Build a ready-to-use toggle: a summary carrying `summaryText` (the author's
 * selected text when there was one) plus one empty body paragraph for the
 * caret to land in.
 */
export function $buildToggle(summaryText = '') {
  const toggle = $createToggleNode(true); // open while authoring
  const summary = $createToggleSummaryNode();
  summary.append($createTextNode(summaryText || 'Summary'));
  const body = $createParagraphNode();
  toggle.append(summary, body);
  return { toggle, summary, body };
}
