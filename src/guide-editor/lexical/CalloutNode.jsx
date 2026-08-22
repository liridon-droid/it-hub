// Callout block — one of the TipTap features being rebuilt for Lexical.
//
// Behaves like QuoteNode: an ElementNode that holds inline content directly
// (rather than wrapping paragraphs), so $setBlocksType can toggle a selection
// into and out of it exactly the way headings and quotes already work. Use
// Shift+Enter for a second line inside one.
//
// `variant` drives the colour/icon and is round-tripped through exportJSON, so a
// callout survives save → reload → portal render. Anything added here MUST also
// be registered for the reader (see NODES in LexicalEditor.jsx, which
// LexicalViewer now shares) or the portal renders nothing for it.
import { ElementNode, $createParagraphNode } from 'lexical';

export const CALLOUT_VARIANTS = ['info', 'success', 'warn', 'danger'];
const DEFAULT_VARIANT = 'info';
const normalise = (v) => (CALLOUT_VARIANTS.includes(v) ? v : DEFAULT_VARIANT);

export class CalloutNode extends ElementNode {
  __variant;

  static getType() { return 'callout'; }

  static clone(node) { return new CalloutNode(node.__variant, node.__key); }

  constructor(variant = DEFAULT_VARIANT, key) {
    super(key);
    this.__variant = normalise(variant);
  }

  createDOM() {
    const el = document.createElement('div');
    el.className = 'lexical-callout';
    el.setAttribute('data-variant', this.__variant);
    return el;
  }

  updateDOM(prevNode, dom) {
    if (prevNode.__variant !== this.__variant) {
      dom.setAttribute('data-variant', this.__variant);
    }
    // false = reuse the existing DOM element; Lexical reconciles children.
    return false;
  }

  // Lets a callout survive copy/paste and pasted HTML from a published guide.
  static importDOM() {
    return {
      div: (domNode) => {
        if (!domNode.classList?.contains('lexical-callout')) return null;
        return {
          conversion: (el) => ({ node: $createCalloutNode(el.getAttribute('data-variant')) }),
          priority: 2,
        };
      },
    };
  }

  exportDOM() {
    const element = this.createDOM();
    return { element };
  }

  static importJSON(serializedNode) {
    const node = $createCalloutNode(serializedNode.variant);
    node.setFormat(serializedNode.format || '');
    node.setIndent(serializedNode.indent || 0);
    node.setDirection(serializedNode.direction || null);
    return node;
  }

  exportJSON() {
    return {
      ...super.exportJSON(),
      type: 'callout',
      version: 1,
      variant: this.__variant,
    };
  }

  getVariant() { return this.__variant; }

  setVariant(variant) {
    const writable = this.getWritable();
    writable.__variant = normalise(variant);
    return writable;
  }

  // ── Editing behaviour ──────────────────────────────────────────────────
  // Enter at the end leaves the callout and starts a clean paragraph, so the
  // block does not trap the caret. Matches how QuoteNode behaves.
  insertNewAfter(_selection, restoreSelection) {
    const newBlock = $createParagraphNode();
    const direction = this.getDirection();
    newBlock.setDirection(direction);
    this.insertAfter(newBlock, restoreSelection);
    return newBlock;
  }

  // Backspace at the very start unwraps to a paragraph rather than deleting the
  // text — the same escape hatch quotes give you.
  collapseAtStart() {
    const paragraph = $createParagraphNode();
    this.getChildren().forEach((child) => paragraph.append(child));
    this.replace(paragraph);
    return true;
  }

  canIndent() { return false; }
}

export function $createCalloutNode(variant = DEFAULT_VARIANT) {
  return new CalloutNode(variant);
}

export function $isCalloutNode(node) {
  return node instanceof CalloutNode;
}
