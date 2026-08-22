// @mention of another guide — the TipTap `Mention` node rebuilt for Lexical.
//
// Extends TextNode rather than DecoratorNode: a mention is inline content, and
// subclassing TextNode means caret movement, selection, copy/paste and
// backspace all behave like normal text for free. A DecoratorNode would render
// a React island per chip and need its own selection handling.
//
// Carries the target guide's id so the chip can navigate. The visible text is
// the guide title at insertion time — deliberately a snapshot, not a live
// lookup: a mention should keep reading sensibly even if that guide is later
// renamed or deleted, and the reader resolves by id when the link is followed.
import { TextNode } from 'lexical';

export class MentionNode extends TextNode {
  __guideId;

  static getType() { return 'mention'; }

  static clone(node) {
    return new MentionNode(node.__guideId, node.__text, node.__key);
  }

  constructor(guideId, text, key) {
    super(text, key);
    this.__guideId = String(guideId ?? '');
  }

  createDOM(config) {
    const dom = super.createDOM(config);
    dom.className = 'lexical-mention';
    dom.setAttribute('data-guide-id', this.__guideId);
    // The reader turns these into navigation; the title gives a hint on hover.
    dom.setAttribute('title', `Open: ${this.__text}`);
    return dom;
  }

  updateDOM(prevNode, dom, config) {
    const updated = super.updateDOM(prevNode, dom, config);
    if (prevNode.__guideId !== this.__guideId) {
      dom.setAttribute('data-guide-id', this.__guideId);
    }
    return updated;
  }

  static importDOM() {
    return {
      span: (domNode) => (domNode.classList?.contains('lexical-mention')
        ? {
          conversion: (el) => ({
            node: $createMentionNode(el.getAttribute('data-guide-id'), el.textContent || ''),
          }),
          priority: 2,
        }
        : null),
    };
  }

  exportDOM() {
    const element = document.createElement('span');
    element.className = 'lexical-mention';
    element.setAttribute('data-guide-id', this.__guideId);
    element.textContent = this.__text;
    return { element };
  }

  static importJSON(serializedNode) {
    const node = $createMentionNode(serializedNode.guideId, serializedNode.text);
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }

  exportJSON() {
    return {
      ...super.exportJSON(),
      type: 'mention',
      version: 1,
      guideId: this.__guideId,
    };
  }

  getGuideId() { return this.__guideId; }

  // Treat the chip as one unit: typing at either edge produces a normal text
  // node beside it instead of growing the mention's own text.
  canInsertTextBefore() { return false; }
  canInsertTextAfter() { return false; }
  isTextEntity() { return true; }
}

export function $createMentionNode(guideId, text) {
  const node = new MentionNode(guideId, text);
  // 'token' mode makes it atomic: one backspace removes the whole chip rather
  // than eating it a character at a time and leaving a half-broken mention.
  node.setMode('token');
  return node;
}

export function $isMentionNode(node) {
  return node instanceof MentionNode;
}
