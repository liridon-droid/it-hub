// Multi-column layout — the TipTap `Columns` / `Column` pair rebuilt for Lexical.
//
// Two node types, like the toggle: ColumnsNode is the CSS-grid container and
// carries the column count; ColumnNode is one cell holding ordinary blocks.
// Splitting them (rather than one node with N children of arbitrary type) means
// each column is a normal block container, so lists, headings and images all
// work inside a column with no special handling.
//
// `cols` round-trips through exportJSON, and the layout is plain CSS grid, so
// the portal reader lays it out identically with no JavaScript.
import { ElementNode, $createParagraphNode } from 'lexical';

export const COLUMN_COUNTS = [2, 3];
const clampCols = (n) => (COLUMN_COUNTS.includes(Number(n)) ? Number(n) : 2);

// ── One column ────────────────────────────────────────────────────────────
export class ColumnNode extends ElementNode {
  static getType() { return 'column'; }
  static clone(node) { return new ColumnNode(node.__key); }

  createDOM() {
    const el = document.createElement('div');
    el.className = 'lexical-column';
    return el;
  }

  updateDOM() { return false; }

  static importDOM() {
    return {
      div: (domNode) => (domNode.classList?.contains('lexical-column')
        ? { conversion: () => ({ node: $createColumnNode() }), priority: 3 }
        : null),
    };
  }

  exportDOM() { return { element: this.createDOM() }; }
  static importJSON() { return $createColumnNode(); }
  exportJSON() { return { ...super.exportJSON(), type: 'column', version: 1 }; }

  // A column must keep at least one block so the caret always has somewhere to
  // land; otherwise deleting the last paragraph collapses the cell to nothing.
  canBeEmpty() { return false; }
  canIndent() { return false; }
}

export function $createColumnNode() { return new ColumnNode(); }
export function $isColumnNode(node) { return node instanceof ColumnNode; }

// ── The grid container ────────────────────────────────────────────────────
export class ColumnsNode extends ElementNode {
  __cols;

  static getType() { return 'columns'; }
  static clone(node) { return new ColumnsNode(node.__cols, node.__key); }

  constructor(cols = 2, key) {
    super(key);
    this.__cols = clampCols(cols);
  }

  createDOM() {
    const el = document.createElement('div');
    el.className = 'lexical-columns';
    el.setAttribute('data-cols', String(this.__cols));
    return el;
  }

  updateDOM(prevNode, dom) {
    if (prevNode.__cols !== this.__cols) dom.setAttribute('data-cols', String(this.__cols));
    return false;
  }

  static importDOM() {
    return {
      div: (domNode) => (domNode.classList?.contains('lexical-columns')
        ? {
          conversion: (el) => ({ node: $createColumnsNode(el.getAttribute('data-cols')) }),
          // Above ColumnNode's handler so the container is matched first.
          priority: 4,
        }
        : null),
    };
  }

  exportDOM() { return { element: this.createDOM() }; }
  static importJSON(serializedNode) { return $createColumnsNode(serializedNode.cols); }

  exportJSON() {
    return { ...super.exportJSON(), type: 'columns', version: 1, cols: this.__cols };
  }

  getCols() { return this.__cols; }

  setCols(cols) {
    const writable = this.getWritable();
    writable.__cols = clampCols(cols);
    return writable;
  }

  canBeEmpty() { return false; }
  canIndent() { return false; }
}

export function $createColumnsNode(cols = 2) { return new ColumnsNode(cols); }
export function $isColumnsNode(node) { return node instanceof ColumnsNode; }

/**
 * Build a ready-to-use grid. `firstColumnNodes` (typically the block the author
 * had selected) goes into column one; the rest start empty.
 *
 * @returns {{ columns: ColumnsNode, first: ColumnNode }}
 */
export function $buildColumns(cols = 2, firstColumnNodes = null) {
  const container = $createColumnsNode(cols);
  const cells = [];
  for (let i = 0; i < clampCols(cols); i += 1) {
    const cell = $createColumnNode();
    if (i === 0 && firstColumnNodes && firstColumnNodes.length) {
      cell.append(...firstColumnNodes);
    } else {
      cell.append($createParagraphNode());
    }
    cells.push(cell);
  }
  container.append(...cells);
  return { columns: container, first: cells[0] };
}
