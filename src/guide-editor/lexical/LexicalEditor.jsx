/**
 * Premium rich-text editor powered by Lexical.
 *
 * Features: Bold, Italic, Underline, Strikethrough, Highlight, Inline Code,
 * H1/H2/H3, Blockquote, Code Block, Bullet List, Numbered List, Checklist,
 * Horizontal Rule, Link insertion, Image insertion, Tables, Text alignment,
 * Subscript/Superscript, Undo/Redo, Block type selector, Slash commands,
 * Indent/Outdent, Clear formatting, Word count, Markdown shortcuts,
 * Keyboard shortcuts, Active state tracking, Drag-to-resize,
 * Floating Selection Toolbar, Visual Table Size Picker, Enhanced Placeholder,
 * Toggle/Collapsible Blocks, Find & Replace
 *
 * Props:
 *   value        – Lexical JSON string or plain text (auto-migrated)
 *   onChange(json) – called with Lexical JSON on every change
 *   onBlur       – optional blur handler
 *   placeholder  – placeholder text
 *   className    – wrapper className
 *   minHeight    – CSS min-height for the editable area (default '120px')
 *   showAppendButton – show "+ Add paragraph" button at bottom
 */
import { useEffect, useCallback, useRef, useState } from 'react';
// PORTED: for the optional toolbarPortalTarget prop (see below).
import { createPortal } from 'react-dom';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { HorizontalRuleNode, INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TRANSFORMERS } from '@lexical/markdown';
import { ListItemNode, ListNode } from '@lexical/list';
import { LinkNode, AutoLinkNode, TOGGLE_LINK_COMMAND, $createLinkNode, $isLinkNode } from '@lexical/link';
import { $createImageNode, ImageNode } from './ImageNode';
import { $createEmbedNode, EmbedNode } from './EmbedNode';
import { CalloutNode, $createCalloutNode, $isCalloutNode, CALLOUT_VARIANTS } from './CalloutNode';
import { $buildToggle, $isToggleNode } from './ToggleNode';
import { $buildColumns } from './ColumnsNode';
import MentionPlugin from './MentionPlugin';
import AiAssistantPlugin from './AiAssistant';
import { resolveEmbed } from './embedUrls';
import { HeadingNode, QuoteNode, $isHeadingNode } from '@lexical/rich-text';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { TableCellNode, TableNode, TableRowNode, $createTableNodeWithDimensions } from '@lexical/table';
import {
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  COMMAND_PRIORITY_LOW,
  COMMAND_PRIORITY_EDITOR,
  KEY_TAB_COMMAND,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $insertNodes,
  $getNodeByKey,
  $isElementNode,
  CAN_UNDO_COMMAND,
  CAN_REDO_COMMAND,
  PASTE_COMMAND,
  COMMAND_PRIORITY_HIGH,
} from 'lexical';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_CHECK_LIST_COMMAND,
  $isListNode,
} from '@lexical/list';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { $createCodeNode, $isCodeNode } from '@lexical/code';
import { $setBlocksType, $patchStyleText, $getSelectionStyleValueForProperty } from '@lexical/selection';
import { $findMatchingParent, $getNearestNodeOfType } from '@lexical/utils';
import { isLexicalJson, plainTextToLexical } from './lexicalUtils';
// PORTED: was '../../../api/apps' (slicedesk's axios client). Now a seam the
// host app fills at mount time — same `{ data: { url } }` shape, so the four
// call sites below are unchanged. See uploadAdapter.js.
import { uploadApi } from './uploadAdapter';
import './lexicalTheme.css';

// ── Lexical theme ──────────────────────────────────────────────
const theme = {
  paragraph: 'lexical-paragraph',
  text: {
    bold: 'lexical-bold',
    italic: 'lexical-italic',
    underline: 'lexical-underline',
    strikethrough: 'lexical-strikethrough',
    code: 'lexical-code-inline',
    highlight: 'lexical-highlight',
    subscript: 'lexical-subscript',
    superscript: 'lexical-superscript',
  },
  heading: {
    h1: 'lexical-h1',
    h2: 'lexical-h2',
    h3: 'lexical-h3',
  },
  list: {
    ul: 'lexical-ul',
    ol: 'lexical-ol',
    listitem: 'lexical-li',
    listitemChecked: 'lexical-li-checked',
    listitemUnchecked: 'lexical-li-unchecked',
    nested: { listitem: 'lexical-nested-li' },
  },
  link: 'lexical-link',
  quote: 'lexical-quote',
  code: 'lexical-code-block',
  horizontalRule: 'lexical-hr',
  table: 'lexical-table',
  tableRow: 'lexical-table-row',
  tableCell: 'lexical-table-cell',
  tableCellHeader: 'lexical-table-cell-header',
  codeHighlight: {
    aml: 'lexical-code-highlight-aml',
    bash: 'lexical-code-highlight-bash',
    js: 'lexical-code-highlight-js',
    jsx: 'lexical-code-highlight-jsx',
    ts: 'lexical-code-highlight-ts',
    tsx: 'lexical-code-highlight-tsx',
    html: 'lexical-code-highlight-html',
    xml: 'lexical-code-highlight-xml',
    yaml: 'lexical-code-highlight-yaml',
    json: 'lexical-code-highlight-json',
    sql: 'lexical-code-highlight-sql',
    python: 'lexical-code-highlight-python',
    py: 'lexical-code-highlight-py',
    css: 'lexical-code-highlight-css',
    scss: 'lexical-code-highlight-scss',
    shell: 'lexical-code-highlight-shell',
    markdown: 'lexical-code-highlight-markdown',
  },
};

// The node registry lives in ./nodes so the read-only viewer can share it
// without pulling this whole module into the portal's lazy chunk. Re-exported
// here because markdownImport.js already imports NODES from this file.
// Imported (not just re-exported) because this module's own initialConfig
// references NODES: `export … from` forwards the name without creating a
// local binding, so the editor threw "NODES is not defined" at mount.
import { NODES } from './nodes';
export { NODES };

// ── Icon Component ─────────────────────────────────────────────
const I = ({ size = 18, children, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...rest}
  >
    {children}
  </svg>
);

// ── Dropdown Menu Component ────────────────────────────────────
function DropdownMenu({ trigger, children, open, onToggle }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onToggle(false);
    };
    if (open) {
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
  }, [open, onToggle]);
  return (
    <div className="relative" ref={ref}>
      {trigger}
      {open && (
        <div className="absolute top-full left-0 mt-1 w-56 max-h-96 overflow-y-auto bg-surface border border-border/80 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.15)] z-50 py-1">
          {children}
        </div>
      )}
    </div>
  );
}

function MenuItem({ onClick, icon, label, shortcut, description }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="w-full px-3 py-2 text-left hover:bg-primary/10 active:bg-primary/20 transition-colors text-sm text-text-primary flex items-center gap-2"
    >
      {icon && <span className="text-text-secondary flex-shrink-0">{icon}</span>}
      <span className="flex-1">
        <div className="font-medium text-sm">{label}</div>
        {description && <div className="text-xs text-text-muted/60">{description}</div>}
      </span>
      {shortcut && <span className="text-[10px] font-mono text-text-muted/50">{shortcut}</span>}
    </button>
  );
}

// ── Button Component ───────────────────────────────────────────
const Btn = ({ onClick, title, children, active = false, disabled = false, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 rounded-lg transition-all flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-raised disabled:opacity-50 disabled:cursor-not-allowed ${active ? 'bg-primary/15 text-primary' : ''} ${className}`}
  >
    {children}
  </button>
);

const Sep = () => <div className="w-px h-5 bg-border/40 mx-1 self-center" />;

// ── Toolbar Component ──────────────────────────────────────────
/**
 * Slim toolbar variant — Bold, Italic, Link only. For the Troubleshooting
 * tab fix-field and other contexts where the full feature surface
 * (headings, lists, tables, image upload, etc.) is overkill.
 *
 * Renders inline with a single rule of buttons, no collapse toggle.
 * All other features remain reachable via markdown shortcuts
 * (**bold**, _italic_, [text](url)) — the Lexical RichTextPlugin's
 * AUTO_LINK / FORMAT handlers wire that automatically.
 */
function SlimToolbar({ className }) {
  const [editor] = useLexicalComposerContext();
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [boldActive, setBoldActive] = useState(false);
  const [italicActive, setItalicActive] = useState(false);

  // Track active formatting on selection — same hook the full toolbar uses.
  useEffect(() => editor.registerUpdateListener(({ editorState }) => {
    editorState.read(() => {
      const sel = $getSelection();
      if ($isRangeSelection(sel)) {
        setBoldActive(sel.hasFormat('bold'));
        setItalicActive(sel.hasFormat('italic'));
      }
    });
  }), [editor]);

  const insertLink = () => {
    if (!linkUrl.trim()) return;
    // TOGGLE_LINK_COMMAND wraps the current selection in a link node;
    // a collapsed selection yields an empty link the user can type into.
    // Good enough for the slim editor — no need for the find/replace-
    // style flow the full toolbar uses.
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl);
    setLinkOpen(false);
    setLinkUrl('');
  };

  return (
    <div className={`relative flex items-center gap-0.5 border-b border-border/60 bg-surface-subtle/30 px-2 py-1 ${className}`}>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
        title="Bold (Ctrl+B)"
        className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${boldActive ? 'bg-primary/15 text-primary' : 'text-text-secondary hover:bg-bg hover:text-text-primary'}`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
        title="Italic (Ctrl+I)"
        className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${italicActive ? 'bg-primary/15 text-primary' : 'text-text-secondary hover:bg-bg hover:text-text-primary'}`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="4" x2="18" y2="4"/><line x1="14" y1="4" x2="10" y2="20"/><line x1="6" y1="20" x2="18" y2="20"/></svg>
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setLinkOpen(true)}
        title="Add Link (Ctrl+K)"
        className="w-7 h-7 rounded flex items-center justify-center text-text-secondary hover:bg-bg hover:text-text-primary transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
      </button>
      <span className="ml-2 text-[10px] text-text-muted/60 select-none">
        also: <code className="text-text-muted">**bold**</code> · <code className="text-text-muted">_italic_</code>
      </span>

      {linkOpen && (
        <div className="absolute left-2 top-10 z-20 bg-surface border border-border rounded-lg shadow-lg p-2 flex flex-col gap-1.5 w-64">
          <input
            autoFocus
            placeholder="URL (https://…)"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') insertLink(); if (e.key === 'Escape') setLinkOpen(false); }}
            className="h-7 px-2 text-xs border border-border rounded outline-none focus:border-primary"
          />
          <div className="flex justify-end gap-1">
            <button type="button" onClick={() => setLinkOpen(false)} className="text-[11px] text-text-secondary hover:text-text-primary px-2 py-1">Cancel</button>
            <button type="button" onClick={insertLink} disabled={!linkUrl.trim()} className="text-[11px] font-semibold text-white bg-primary px-2 py-1 rounded disabled:opacity-40">Insert</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Turn the current selection into a CalloutNode.
//
// Module-level on purpose: BOTH the toolbar (Toolbar) and the slash-command
// palette (SlashCommandPlugin) offer callouts, and they are separate components
// with separate scopes. Keeping one implementation here is what stops the two
// entry points drifting — the slash menu previously had its own copy that faked
// callouts with quotes long after the toolbar was doing something else.
function applyCallout(editor, emoji, variant) {
  editor.update(() => {
    const sel = $getSelection();
    if (!$isRangeSelection(sel)) return;
    $setBlocksType(sel, () => $createCalloutNode(variant));
    if (!emoji) return;
    // Re-read: $setBlocksType replaces the block, so the selection captured
    // above points at a detached node and writes through it are silently lost.
    const after = $getSelection();
    if (!$isRangeSelection(after)) return;
    const node = after.anchor.getNode();
    const textNode = node.getType() === 'text' ? node : node.getFirstChild();
    if (!textNode || typeof textNode.getTextContent !== 'function') return;
    const existing = textNode.getTextContent();
    if (!existing.startsWith(emoji)) textNode.setTextContent(emoji + existing);
  });
}

// Wrap the current block in a CSS-grid column layout. Whatever the author had
// selected becomes column one, so turning a paragraph into two columns keeps
// the text instead of discarding it.
function applyColumns(editor, cols) {
  editor.update(() => {
    const sel = $getSelection();
    if (!$isRangeSelection(sel)) return;
    const block = sel.anchor.getNode().getTopLevelElementOrThrow();
    const hasContent = block.getTextContentSize
      ? block.getTextContentSize() > 0
      : !!block.getTextContent?.();

    const { columns, first } = $buildColumns(cols, null);
    block.insertAfter(columns);

    if (hasContent) {
      // MOVE the original block into cell one rather than cloning it:
      // appending a node already in the tree relocates it, so its formatting,
      // links and children survive intact. (Cloning via
      // importJSON(exportJSON()) would mint fresh keys and drop anything the
      // serializer does not round-trip.)
      //
      // Order matters: append FIRST, then drop the placeholder. Clearing the
      // cell first empties it, and ColumnNode.canBeEmpty() is false — so
      // Lexical removes the cell during reconciliation and the following
      // append runs against a detached node (Lexical error #19).
      const placeholder = first.getFirstChild();
      first.append(block);
      if (placeholder) placeholder.remove();
    } else {
      block.remove();
    }
    (first.getFirstChild() || first).selectStart();
  });
}

// Replace the current block with a real collapsible <details> block, using any
// selected text as the summary label.
function applyToggle(editor) {
  editor.update(() => {
    const sel = $getSelection();
    if (!$isRangeSelection(sel)) return;
    const { toggle, body } = $buildToggle(sel.getTextContent());
    sel.anchor.getNode().getTopLevelElementOrThrow().replace(toggle);
    body.selectStart();
  });
}

function Toolbar({ className, surface, showKeyboardHints }) {
  const [editor] = useLexicalComposerContext();
  const [boldActive, setBoldActive] = useState(false);
  const [italicActive, setItalicActive] = useState(false);
  const [underlineActive, setUnderlineActive] = useState(false);
  const [strikeActive, setStrikeActive] = useState(false);
  const [codeActive, setCodeActive] = useState(false);
  const [h1Active, setH1Active] = useState(false);
  const [h2Active, setH2Active] = useState(false);
  const [h3Active, setH3Active] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const linkInputRef = useRef(null);

  const [imageOpen, setImageOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const imageInputRef = useRef(null);

  const [embedOpen, setEmbedOpen] = useState(false);
  const [embedUrl, setEmbedUrl] = useState('');
  const [embedError, setEmbedError] = useState('');

  const [tableOpen, setTableOpen] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [hoveredCell, setHoveredCell] = useState(null);

  const [colorOpen, setColorOpen] = useState(false);
  const [textColorOpen, setTextColorOpen] = useState(false);
  const [alignOpen, setAlignOpen] = useState(false);
  const [insertMenuOpen, setInsertMenuOpen] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  // Full-page editors (the Docs editor) show the formatting toolbar expanded by
  // default; compact inline editors stay collapsed to save space.
  const [collapsed, setCollapsed] = useState(surface !== 'page');
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  const updateActiveStates = useCallback(() => {
    editor.getEditorState().read(() => {
      const sel = $getSelection();
      if ($isRangeSelection(sel)) {
        setBoldActive(sel.hasFormat('bold'));
        setItalicActive(sel.hasFormat('italic'));
        setUnderlineActive(sel.hasFormat('underline'));
        setStrikeActive(sel.hasFormat('strikethrough'));
        setCodeActive(sel.hasFormat('code'));

        const node = sel.anchor.getNode();
        const parent = $findMatchingParent(node, (n) => $isHeadingNode(n));
        if ($isHeadingNode(parent)) {
          setH1Active(parent.__tag === 'h1');
          setH2Active(parent.__tag === 'h2');
          setH3Active(parent.__tag === 'h3');
        } else {
          setH1Active(false);
          setH2Active(false);
          setH3Active(false);
        }
      }
    });
  }, [editor]);

  useEffect(() => {
    const unregUpdate = editor.registerUpdateListener(() => updateActiveStates());
    const unregUndo = editor.registerCommand(CAN_UNDO_COMMAND, (payload) => { setCanUndo(payload); return false; }, COMMAND_PRIORITY_LOW);
    const unregRedo = editor.registerCommand(CAN_REDO_COMMAND, (payload) => { setCanRedo(payload); return false; }, COMMAND_PRIORITY_LOW);
    return () => { unregUpdate(); unregUndo(); unregRedo(); };
  }, [editor, updateActiveStates]);

  const withInsertionPoint = useCallback(
    (callback) => {
      editor.update(() => {
        const sel = $getSelection();
        if (sel) callback(sel);
      });
    },
    [editor]
  );

  const insertLink = () => {
    if (!linkUrl) return;
    withInsertionPoint((sel) => {
      if ($isRangeSelection(sel)) {
        const text = linkText || linkUrl;
        const linkNode = $createLinkNode(linkUrl);
        linkNode.append($createTextNode(text));
        sel.insertNodes([linkNode]);
      }
    });
    setLinkOpen(false);
    setLinkUrl('');
    setLinkText('');
  };

  const insertImage = () => {
    if (!imageUrl) return;
    withInsertionPoint((sel) => {
      const imageNode = $createImageNode({ src: imageUrl, alt: imageAlt });
      const paragraph = $createParagraphNode();
      sel.insertNodes([imageNode, paragraph]);
    });
    setImageOpen(false);
    setImageUrl('');
    setImageAlt('');
  };

  // Insert a video (YouTube/Vimeo/Drive) or Google Doc/Sheet/Slide embed.
  const insertEmbed = () => {
    const resolved = resolveEmbed(embedUrl);
    if (!resolved) {
      setEmbedError('Paste a YouTube, Vimeo, or Google Docs/Drive link.');
      return;
    }
    withInsertionPoint((sel) => {
      const node = $createEmbedNode({ src: resolved.src, kind: resolved.kind });
      const paragraph = $createParagraphNode();
      sel.insertNodes([node, paragraph]);
    });
    setEmbedOpen(false);
    setEmbedUrl('');
    setEmbedError('');
  };

  // PORTED: insertGif() removed along with the Giphy picker — it was only ever
  // called by that modal, and it referenced the deleted setGiphyOpen state.

  const insertTable = () => {
    editor.update(() => {
      const table = $createTableNodeWithDimensions(tableRows, tableCols, false);
      $insertNodes([table, $createParagraphNode()]);
    });
    setTableOpen(false);
  };

  const insertBulletList = () => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
  const insertNumberedList = () => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
  const insertChecklist = () => editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
  const insertCodeBlock = () => {
    editor.update(() => {
      const sel = $getSelection();
      if ($isRangeSelection(sel)) $setBlocksType(sel, () => $createCodeNode());
    });
  };
  const insertQuoteBlock = () => {
    editor.update(() => {
      const sel = $getSelection();
      if ($isRangeSelection(sel)) $setBlocksType(sel, () => $createQuoteNode());
    });
  };
  const insertCallout = (emoji, variant) => applyCallout(editor, emoji, variant);

  // Headings TOGGLE. The toolbar lights H1/H2/H3 up when the caret sits in one
  // (see the setH*Active block in the selection listener), so the button claims
  // to be a two-state control — but it used to only ever apply the heading, and
  // re-clicking an active H1 re-applied h1 and appeared to do nothing. There was
  // no way back to body text from the toolbar at all. Clicking the active level
  // now returns the block to a paragraph, which is what the lit state implies.
  const insertCalloutHeading = (level) => {
    editor.update(() => {
      const sel = $getSelection();
      if (!$isRangeSelection(sel)) return;
      const current = $findMatchingParent(sel.anchor.getNode(), (n) => $isHeadingNode(n));
      const alreadyThisLevel = $isHeadingNode(current) && current.getTag() === level;
      $setBlocksType(sel, () => (alreadyThisLevel ? $createParagraphNode() : $createHeadingNode(level)));
    });
  };

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setFindOpen(!findOpen);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [findOpen]);

  const performFind = useCallback(() => {
    if (!findQuery) return;
    editor.getEditorState().read(() => {
      const root = $getRoot();
      const text = root.getTextContent();
      const lowerText = text.toLowerCase();
      const lowerQuery = findQuery.toLowerCase();
      let count = 0;
      let idx = -1;
      while ((idx = lowerText.indexOf(lowerQuery, idx + 1)) !== -1) count++;
      setMatchCount(count);
    });
  }, [editor, findQuery]);

  const performReplace = useCallback((replaceAll = false) => {
    if (!findQuery || !replaceQuery) return;
    editor.update(() => {
      const root = $getRoot();
      const allTextNodes = [];
      // Collect all text nodes preserving formatting
      const collect = (node) => {
        if (node.getType() === 'text') {
          allTextNodes.push(node);
        } else if ($isElementNode(node)) {
          node.getChildren().forEach(collect);
        }
      };
      root.getChildren().forEach(collect);
      const lowerQuery = findQuery.toLowerCase();
      let didReplace = false;
      for (const textNode of allTextNodes) {
        const text = textNode.getTextContent();
        const lowerText = text.toLowerCase();
        if (replaceAll) {
          let result = '';
          let lastIdx = 0;
          let idx;
          while ((idx = lowerText.indexOf(lowerQuery, lastIdx)) !== -1) {
            result += text.slice(lastIdx, idx) + replaceQuery;
            lastIdx = idx + findQuery.length;
            didReplace = true;
          }
          result += text.slice(lastIdx);
          if (didReplace) textNode.setTextContent(result);
          didReplace = false;
        } else if (!didReplace) {
          const idx = lowerText.indexOf(lowerQuery);
          if (idx >= 0) {
            textNode.setTextContent(text.slice(0, idx) + replaceQuery + text.slice(idx + findQuery.length));
            didReplace = true;
          }
        }
      }
    });
    performFind();
  }, [editor, findQuery, replaceQuery, performFind]);

  useEffect(() => {
    if (findOpen && linkInputRef.current) linkInputRef.current.focus();
  }, [findOpen]);

  const isDark = typeof document !== 'undefined' && document.documentElement?.getAttribute('data-theme') === 'dark';

  // Highlight colors — visible in both light and dark mode
  const highlightColors = isDark ? [
    { name: 'Yellow', color: 'rgba(250, 204, 21, 0.30)' },
    { name: 'Green', color: 'rgba(34, 197, 94, 0.25)' },
    { name: 'Blue', color: 'rgba(59, 130, 246, 0.30)' },
    { name: 'Pink', color: 'rgba(236, 72, 153, 0.30)' },
    { name: 'Orange', color: 'rgba(249, 115, 22, 0.30)' },
    { name: 'Purple', color: 'rgba(168, 85, 247, 0.30)' },
    { name: 'Red', color: 'rgba(239, 68, 68, 0.30)' },
    { name: 'Teal', color: 'rgba(20, 184, 166, 0.30)' },
    { name: 'None', color: null },
  ] : [
    { name: 'Yellow', color: '#fef08a' },
    { name: 'Green', color: '#bbf7d0' },
    { name: 'Blue', color: '#bfdbfe' },
    { name: 'Pink', color: '#fbcfe8' },
    { name: 'Orange', color: '#fed7aa' },
    { name: 'Purple', color: '#e9d5ff' },
    { name: 'Red', color: '#fecaca' },
    { name: 'Teal', color: '#99f6e4' },
    { name: 'None', color: null },
  ];

  // Text colors — strong, vibrant, readable in both modes
  const textColors = isDark ? [
    { name: 'Default', color: null },
    { name: 'Gray', color: '#9ca3af' },
    { name: 'Brown', color: '#d97706' },
    { name: 'Red', color: '#f87171' },
    { name: 'Orange', color: '#fb923c' },
    { name: 'Yellow', color: '#facc15' },
    { name: 'Green', color: '#4ade80' },
    { name: 'Blue', color: '#60a5fa' },
    { name: 'Purple', color: '#c084fc' },
    { name: 'Pink', color: '#f472b6' },
    { name: 'Teal', color: '#2dd4bf' },
  ] : [
    { name: 'Default', color: null },
    { name: 'Gray', color: '#6b7280' },
    { name: 'Brown', color: '#92400e' },
    { name: 'Red', color: '#dc2626' },
    { name: 'Orange', color: '#ea580c' },
    { name: 'Yellow', color: '#ca8a04' },
    { name: 'Green', color: '#16a34a' },
    { name: 'Blue', color: '#2563eb' },
    { name: 'Purple', color: '#9333ea' },
    { name: 'Pink', color: '#db2777' },
    { name: 'Teal', color: '#0d9488' },
  ];

  const applyTextColor = (color) => {
    editor.update(() => {
      const sel = $getSelection();
      if ($isRangeSelection(sel)) {
        $patchStyleText(sel, { color: color || '' });
      }
    });
    setTextColorOpen(false);
  };

  const applyHighlightColor = (color) => {
    editor.update(() => {
      const sel = $getSelection();
      if ($isRangeSelection(sel)) {
        $patchStyleText(sel, { 'background-color': color || '' });
      }
    });
    setColorOpen(false);
  };

  const insertToggle = () => applyToggle(editor);

  const triggerImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const { data } = await uploadApi.upload(file);
        withInsertionPoint((selection) => {
          const imageNode = $createImageNode({ src: data.url, alt: '' });
          const paragraph = $createParagraphNode();
          selection.insertNodes([imageNode, paragraph]);
          paragraph.selectStart();
        });
      } catch (err) { console.error('Image upload failed:', err); }
      setImageOpen(false);
    };
    input.click();
  };

  return (
    <div className={`border-b border-border bg-surface-subtle/50 flex flex-col ${className || ''}`}>
      {/* Find & Replace Bar */}
      {!collapsed && findOpen && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50 bg-primary-light/5">
          <I size={14} className="text-text-muted flex-shrink-0"><path d="m21 21-4.35-4.35M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"/></I>
          <input
            ref={linkInputRef}
            value={findQuery}
            onChange={(e) => { setFindQuery(e.target.value); }}
            onKeyDown={(e) => { if (e.key === 'Enter') performFind(); if (e.key === 'Escape') setFindOpen(false); }}
            placeholder="Find..."
            className="flex-1 h-8 px-2.5 text-xs border border-border rounded-lg bg-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
          />
          <input
            value={replaceQuery}
            onChange={(e) => setReplaceQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') performReplace(false); if (e.key === 'Escape') setFindOpen(false); }}
            placeholder="Replace..."
            className="flex-1 h-8 px-2.5 text-xs border border-border rounded-lg bg-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
          />
          <span className="text-[10px] text-text-muted whitespace-nowrap">{matchCount} matches</span>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => performReplace(false)}
            className="h-8 px-3 text-xs font-semibold text-white bg-primary rounded-lg hover:bg-primary-hover transition-all shadow-sm flex-shrink-0">
            Replace
          </button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => performReplace(true)}
            className="h-8 px-3 text-xs font-semibold text-white bg-primary rounded-lg hover:bg-primary-hover transition-all shadow-sm flex-shrink-0">
            Replace All
          </button>
          <button type="button" onClick={() => { setFindOpen(false); setFindQuery(''); setReplaceQuery(''); }}
            className="w-7 h-7 rounded-md flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors flex-shrink-0">
            <I size={14}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></I>
          </button>
        </div>
      )}

      {/* Main Toolbar — all tools flat, no dropdowns */}
      <div className="flex items-center flex-wrap gap-0 px-1.5 py-1.5">
        {!collapsed && <>
        {/* ── Text Formatting ── */}
        <Btn onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')} title="Bold (Ctrl+B)" active={boldActive}>
          <I size={15}><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></I>
        </Btn>
        <Btn onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')} title="Italic (Ctrl+I)" active={italicActive}>
          <I size={15}><line x1="6" y1="4" x2="10" y2="4"/><line x1="14" y1="4" x2="18" y2="4"/><line x1="18" y1="4" x2="6" y2="20"/><line x1="6" y1="20" x2="14" y2="20"/><line x1="14" y1="20" x2="18" y2="20"/></I>
        </Btn>
        <Btn onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')} title="Underline (Ctrl+U)" active={underlineActive}>
          <I size={15}><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></I>
        </Btn>
        <Btn onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')} title="Strikethrough" active={strikeActive}>
          <I size={15}><path d="M17.3 13.2c.7-.7 1.7-1.2 2.7-1.2 2 0 3.5 1.5 3.5 3.5 0 2-1.5 3.5-3.5 3.5-1 0-2-.5-2.7-1.2M3 12h18"/><path d="M8 5c-1 0-2 .5-2.7 1.3C4.6 7 4 8 4 9.2 4 11 5 12.5 6.3 13"/></I>
        </Btn>
        <Btn onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')} title="Inline Code" active={codeActive}>
          <I size={15}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></I>
        </Btn>

        <Sep />

        {/* ── Text Color ── */}
        <DropdownMenu
          open={textColorOpen}
          onToggle={setTextColorOpen}
          trigger={
            <Btn onClick={() => setTextColorOpen(v => !v)} title="Text Color" active={textColorOpen}>
              <I size={15}><path d="M9.62 12L12 5.67 14.38 12M7 16l1.5-4h7L17 16"/><line x1="3" y1="20" x2="21" y2="20" strokeWidth="3" stroke="#dc2626"/></I>
            </Btn>
          }
        >
          <div className="px-2 pt-2 pb-1">
            <div className="text-[9px] font-semibold text-text-muted/50 uppercase tracking-widest px-1 pb-1.5">Text Color</div>
            <div className="grid grid-cols-6 gap-1.5">
              {textColors.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  title={c.name}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyTextColor(c.color)}
                  className="w-8 h-8 rounded-lg border-2 border-border/60 hover:border-primary hover:scale-110 transition-all flex items-center justify-center bg-surface"
                >
                  <span className="text-sm font-extrabold" style={{ color: c.color || 'var(--color-text-primary)' }}>A</span>
                </button>
              ))}
            </div>
          </div>
        </DropdownMenu>

        {/* ── Highlight (real colors) ── */}
        <DropdownMenu
          open={colorOpen}
          onToggle={setColorOpen}
          trigger={
            <Btn onClick={() => setColorOpen(v => !v)} title="Highlight Color" active={colorOpen}>
              <I size={15}><path d="M5.5 21h13M12 3l7 13H5z"/><line x1="3" y1="20" x2="21" y2="20" strokeWidth="3" stroke="#facc15"/></I>
            </Btn>
          }
        >
          <div className="px-2 pt-2 pb-1">
            <div className="text-[9px] font-semibold text-text-muted/50 uppercase tracking-widest px-1 pb-1.5">Highlight</div>
            <div className="grid grid-cols-5 gap-1.5">
              {highlightColors.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  title={c.name}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyHighlightColor(c.color)}
                  className="w-8 h-8 rounded-lg border-2 border-border/60 hover:border-primary hover:scale-110 transition-all flex items-center justify-center"
                  style={{ backgroundColor: c.color || 'var(--color-surface-raised, #f5f5f5)' }}
                >
                  {!c.color && <I size={14}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></I>}
                </button>
              ))}
            </div>
          </div>
        </DropdownMenu>

        <Btn onClick={() => setLinkOpen(true)} title="Add Link (Ctrl+K)">
          <I size={15}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></I>
        </Btn>

        <Sep />

        {/* ── Headings ── */}
        <Btn onClick={() => insertCalloutHeading('h1')} title="Heading 1" active={h1Active}>
          <span className="text-[11px] font-extrabold leading-none">H1</span>
        </Btn>
        <Btn onClick={() => insertCalloutHeading('h2')} title="Heading 2" active={h2Active}>
          <span className="text-[11px] font-bold leading-none">H2</span>
        </Btn>
        <Btn onClick={() => insertCalloutHeading('h3')} title="Heading 3" active={h3Active}>
          <span className="text-[11px] font-semibold leading-none">H3</span>
        </Btn>

        <Sep />

        {/* ── Lists (directly on toolbar) ── */}
        <Btn onClick={insertBulletList} title="Bullet List">
          <I size={15}><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></I>
        </Btn>
        <Btn onClick={insertNumberedList} title="Numbered List">
          <I size={15}><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></I>
        </Btn>
        <Btn onClick={insertChecklist} title="Checklist">
          <I size={15}><rect x="3" y="5" width="6" height="6" rx="1"/><path d="m3 17 2 2 4-4"/><line x1="13" y1="8" x2="21" y2="8"/><line x1="13" y1="18" x2="21" y2="18"/></I>
        </Btn>

        <Sep />

        {/* ── Text Alignment ── */}
        <DropdownMenu
          open={alignOpen}
          onToggle={setAlignOpen}
          trigger={
            <Btn onClick={() => setAlignOpen(v => !v)} title="Text Alignment" active={alignOpen}>
              <I size={15}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></I>
            </Btn>
          }
        >
          <MenuItem onClick={() => { editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left'); setAlignOpen(false); }}
            icon={<I size={14}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></I>}
            label="Align Left" />
          <MenuItem onClick={() => { editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center'); setAlignOpen(false); }}
            icon={<I size={14}><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></I>}
            label="Align Center" />
          <MenuItem onClick={() => { editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right'); setAlignOpen(false); }}
            icon={<I size={14}><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></I>}
            label="Align Right" />
          <MenuItem onClick={() => { editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify'); setAlignOpen(false); }}
            icon={<I size={14}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></I>}
            label="Justify" />
        </DropdownMenu>

        {/* ── Indent / Outdent ── */}
        <Btn onClick={() => editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)} title="Indent">
          <I size={15}><polyline points="3 8 7 12 3 16"/><line x1="21" y1="12" x2="11" y2="12"/><line x1="21" y1="6" x2="11" y2="6"/><line x1="21" y1="18" x2="11" y2="18"/></I>
        </Btn>
        <Btn onClick={() => editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)} title="Outdent">
          <I size={15}><polyline points="7 8 3 12 7 16"/><line x1="21" y1="12" x2="11" y2="12"/><line x1="21" y1="6" x2="11" y2="6"/><line x1="21" y1="18" x2="11" y2="18"/></I>
        </Btn>

        <Sep />

        {/* ── Blocks (directly on toolbar) ── */}
        <Btn onClick={insertQuoteBlock} title="Quote / Callout">
          <I size={15}><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" fill="currentColor" stroke="none"/></I>
        </Btn>
        <Btn onClick={insertCodeBlock} title="Code Block">
          <I size={15}><rect x="4" y="4" width="16" height="16" rx="2"/><polyline points="10 10 8 12 10 14"/><polyline points="14 10 16 12 14 14"/></I>
        </Btn>
        <Btn onClick={() => editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)} title="Divider">
          <I size={15}><line x1="3" y1="12" x2="21" y2="12"/></I>
        </Btn>

        <Sep />

        {/* ── Table ── */}
        <Btn onClick={() => setTableOpen(!tableOpen)} title="Insert Table" active={tableOpen}>
          <I size={15}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></I>
        </Btn>

        {/* ── Image ── */}
        <Btn onClick={() => setImageOpen(!imageOpen)} title="Insert Image" active={imageOpen}>
          <I size={15}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></I>
        </Btn>

        {/* PORTED: the GIF (Giphy) button is removed in it-hub. GiphyPicker
            imported slicedesk's axios client, whose interceptor redirects to
            /login on any 401 — that would hijack it-hub's auth flow. It also
            needs /api/giphy/{search,config} routes that do not exist here. */}

        {/* ── Embed: video / Google Doc ── */}
        <Btn onClick={() => { setEmbedOpen(!embedOpen); setEmbedError(''); }} title="Embed video or Google Doc" active={embedOpen}>
          <I size={15}><rect x="2" y="3" width="20" height="14" rx="2"/><path d="m10 8 5 3-5 3z"/></I>
        </Btn>

        <Sep />

        {/* ── More blocks (callouts, toggle, etc.) ── */}
        <DropdownMenu
          open={insertMenuOpen}
          onToggle={setInsertMenuOpen}
          trigger={
            <Btn onClick={() => setInsertMenuOpen(v => !v)} title="More blocks..." active={insertMenuOpen}>
              <I size={15}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></I>
            </Btn>
          }
        >
          <div className="px-3 pt-1.5 pb-1 text-[9px] font-semibold text-text-muted/50 uppercase tracking-widest">Callouts</div>
          <MenuItem onClick={() => { insertCallout('ℹ️ ', 'info'); setInsertMenuOpen(false); }} icon={<span className="text-[14px]">ℹ️</span>} label="Info Box" />
          <MenuItem onClick={() => { insertCallout('💡 ', 'info'); setInsertMenuOpen(false); }} icon={<span className="text-[14px]">💡</span>} label="Tip / Pro Tip" />
          <MenuItem onClick={() => { insertCallout('✅ ', 'success'); setInsertMenuOpen(false); }} icon={<span className="text-[14px]">✅</span>} label="Success / Done" />
          <MenuItem onClick={() => { insertCallout('⚠️ ', 'warn'); setInsertMenuOpen(false); }} icon={<span className="text-[14px]">⚠️</span>} label="Warning Box" />
          <MenuItem onClick={() => { insertCallout('❌ ', 'danger'); setInsertMenuOpen(false); }} icon={<span className="text-[14px]">❌</span>} label="Error / Don't" />
          <MenuItem onClick={() => { insertCallout('🔒 ', 'warn'); setInsertMenuOpen(false); }} icon={<span className="text-[14px]">🔒</span>} label="Security Note" />
          <MenuItem onClick={() => { insertCallout('📌 ', 'info'); setInsertMenuOpen(false); }} icon={<span className="text-[14px]">📌</span>} label="Important / Pinned" />
          <MenuItem onClick={() => { insertCallout('🔧 ', 'info'); setInsertMenuOpen(false); }} icon={<span className="text-[14px]">🔧</span>} label="Troubleshooting" />
          <div className="h-px bg-border/60 my-1 mx-2" />
          <div className="px-3 pt-1.5 pb-1 text-[9px] font-semibold text-text-muted/50 uppercase tracking-widest">Advanced</div>
          <MenuItem onClick={() => { insertToggle(); setInsertMenuOpen(false); }} icon={<I size={14}><path d="M9 6l-2 3h2v4H9l2 3V6z"/></I>} label="Toggle / Collapsible" />
          <MenuItem onClick={() => { applyColumns(editor, 2); setInsertMenuOpen(false); }} icon={<I size={14}><rect x="3" y="4" width="7" height="16" rx="1"/><rect x="14" y="4" width="7" height="16" rx="1"/></I>} label="2 columns" />
          <MenuItem onClick={() => { applyColumns(editor, 3); setInsertMenuOpen(false); }} icon={<I size={14}><rect x="2" y="4" width="5" height="16" rx="1"/><rect x="9.5" y="4" width="5" height="16" rx="1"/><rect x="17" y="4" width="5" height="16" rx="1"/></I>} label="3 columns" />
          <MenuItem onClick={() => { editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript'); setInsertMenuOpen(false); }} icon={<span className="text-[11px] font-bold">X<sub>2</sub></span>} label="Subscript" />
          <MenuItem onClick={() => { editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript'); setInsertMenuOpen(false); }} icon={<span className="text-[11px] font-bold">X<sup>2</sup></span>} label="Superscript" />
          <MenuItem onClick={() => { editor.update(() => { const sel = $getSelection(); if ($isRangeSelection(sel)) { $setBlocksType(sel, () => $createParagraphNode()); $patchStyleText(sel, { color: '', 'background-color': '', 'font-size': '' }); if (sel.hasFormat('bold')) sel.formatText('bold'); if (sel.hasFormat('italic')) sel.formatText('italic'); if (sel.hasFormat('underline')) sel.formatText('underline'); if (sel.hasFormat('strikethrough')) sel.formatText('strikethrough'); if (sel.hasFormat('code')) sel.formatText('code'); if (sel.hasFormat('highlight')) sel.formatText('highlight'); } }); setInsertMenuOpen(false); }} icon={<I size={14}><path d="M21 10H7"/><path d="M21 6H3"/><path d="M21 14H3"/><path d="M21 18H7"/></I>} label="Clear All Formatting" />
        </DropdownMenu>

        <Sep />

        {/* ── Undo / Redo ── */}
        <Btn onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)} title="Undo (Ctrl+Z)" disabled={!canUndo}>
          <I size={15}><path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/></I>
        </Btn>
        <Btn onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)} title="Redo (Ctrl+Y)" disabled={!canRedo}>
          <I size={15}><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3-2.3"/></I>
        </Btn>

        <Sep />

        {/* ── Find & Replace ── */}
        {/* AI assistant (⌘J). Dispatches an event rather than lifting the
            palette's state into the toolbar — the palette lives inside the
            composer so it can read the selection. */}
        {/* Deliberately NOT a plain <Btn>: as one more ghost icon among thirty
            it was invisible. Accent pill + "AI" label so the one thing in the
            toolbar that calls a model is findable. */}
        <button
          type="button"
          className="lexical-ai-btn"
          aria-label="Ask AI"
          title="Ask AI (⌘J)"
          onClick={() => window.dispatchEvent(new CustomEvent('guide-editor:open-ai'))}
        >
          <I size={13}><path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/><path d="M18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9z"/></I>
          <span>AI</span>
        </button>
        <Btn onClick={() => setFindOpen(!findOpen)} title="Find & Replace (Ctrl+F)" active={findOpen}>
          <I size={15}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></I>
        </Btn>
        </>}
        <button
          type="button"
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Show toolbar' : 'Hide toolbar'}
          className="ml-auto p-2 rounded-lg transition-all flex items-center justify-center text-text-muted/60 hover:text-text-primary hover:bg-surface-raised flex-shrink-0"
        >
          {collapsed
            ? <I size={14}><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></I>
            : <I size={14}><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></I>
          }
        </button>
      </div>

      {/* Link insertion row */}
      {!collapsed && linkOpen && (
        <div className="flex items-center gap-2 px-3 py-2 border-t border-border/50 bg-primary-light/5 flex-wrap">
          <I size={16} className="text-primary flex-shrink-0"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></I>
          <input
            type="text"
            autoFocus
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') insertLink();
              if (e.key === 'Escape') { setLinkOpen(false); setLinkUrl(''); setLinkText(''); }
            }}
            placeholder="https://..."
            className="flex-1 h-8 px-2.5 text-xs border border-border rounded-lg bg-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 min-w-0 transition-all"
          />
          <input
            type="text"
            value={linkText}
            onChange={(e) => setLinkText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') insertLink();
              if (e.key === 'Escape') { setLinkOpen(false); setLinkUrl(''); setLinkText(''); }
            }}
            placeholder="Display text (optional)"
            className="flex-1 h-8 px-2.5 text-xs border border-border rounded-lg bg-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 min-w-0 transition-all"
          />
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={insertLink}
            className="h-8 px-3.5 text-xs font-semibold text-white bg-primary rounded-lg hover:bg-primary-hover transition-all shadow-sm flex-shrink-0">
            Insert
          </button>
          <button type="button" onClick={() => { setLinkOpen(false); setLinkUrl(''); setLinkText(''); }}
            className="w-7 h-7 rounded-md flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors flex-shrink-0">
            <I size={14}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></I>
          </button>
        </div>
      )}

      {/* Image insertion row */}
      {!collapsed && imageOpen && (
        <div className="flex items-center gap-2 px-3 py-2 border-t border-border/50 bg-primary-light/5 flex-wrap">
          <I size={16} className="text-primary flex-shrink-0"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></I>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={triggerImageUpload}
            className="h-8 px-3.5 text-xs font-semibold text-text-secondary bg-surface border border-border rounded-lg hover:bg-surface-raised transition-all flex-shrink-0 flex items-center gap-1.5"
          >
            <I size={13}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></I>
            Upload
          </button>
          <span className="text-[10px] text-text-muted">or</span>
          <input
            ref={imageInputRef}
            autoFocus
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') insertImage();
              if (e.key === 'Escape') { setImageOpen(false); setImageUrl(''); setImageAlt(''); }
            }}
            placeholder="Paste image URL..."
            className="flex-1 h-8 px-2.5 text-xs border border-border rounded-lg bg-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 min-w-0 transition-all"
          />
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={insertImage}
            className="h-8 px-3.5 text-xs font-semibold text-white bg-primary rounded-lg hover:bg-primary-hover transition-all shadow-sm flex-shrink-0">
            Insert
          </button>
          <button type="button" onClick={() => { setImageOpen(false); setImageUrl(''); setImageAlt(''); }}
            className="w-7 h-7 rounded-md flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors flex-shrink-0">
            <I size={14}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></I>
          </button>
        </div>
      )}

      {/* Embed (video / Google Doc) insertion row */}
      {!collapsed && embedOpen && (
        <div className="flex items-center gap-2 px-3 py-2 border-t border-border/50 bg-primary-light/5 flex-wrap">
          <I size={16} className="text-primary flex-shrink-0"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="m10 8 5 3-5 3z"/></I>
          <input
            autoFocus
            value={embedUrl}
            onChange={(e) => { setEmbedUrl(e.target.value); setEmbedError(''); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') insertEmbed();
              if (e.key === 'Escape') { setEmbedOpen(false); setEmbedUrl(''); setEmbedError(''); }
            }}
            placeholder="Paste a YouTube, Vimeo, or Google Docs/Drive link..."
            className="flex-1 h-8 px-2.5 text-xs border border-border rounded-lg bg-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 min-w-0 transition-all"
          />
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={insertEmbed}
            className="h-8 px-3.5 text-xs font-semibold text-white bg-primary rounded-lg hover:bg-primary-hover transition-all shadow-sm flex-shrink-0">
            Embed
          </button>
          <button type="button" onClick={() => { setEmbedOpen(false); setEmbedUrl(''); setEmbedError(''); }}
            className="w-7 h-7 rounded-md flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors flex-shrink-0">
            <I size={14}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></I>
          </button>
          {embedError && <span className="w-full text-[10px] text-danger">{embedError}</span>}
          <span className="w-full text-[10px] leading-snug text-text-muted">
            For Google Docs/Sheets: the file must be shared so it can render inside SliceDesk.
            If it shows a Google sign-in wall, open the file → <strong>File → Share → Publish to web</strong>,
            then paste that link (or the normal doc link works once it's published).
          </span>
        </div>
      )}

      {/* Table insertion row with visual grid picker */}
      {!collapsed && tableOpen && (
        <div className="flex items-center gap-3 px-3 py-2 border-t border-border/50 bg-primary-light/5">
          <I size={16} className="text-primary flex-shrink-0"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></I>
          {/* Visual 6x6 grid picker - compact inline */}
          <div className="flex flex-col gap-px">
            {Array.from({ length: 6 }).map((_, row) => (
              <div key={row} className="flex gap-px">
                {Array.from({ length: 6 }).map((_, col) => (
                  <button
                    key={`${row}-${col}`}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => { setHoveredCell({ row: row + 1, col: col + 1 }); setTableRows(row + 1); setTableCols(col + 1); }}
                    onMouseLeave={() => setHoveredCell(null)}
                    onClick={() => { setTableRows(row + 1); setTableCols(col + 1); insertTable(); }}
                    className={`w-5 h-5 rounded-sm border transition-all ${
                      hoveredCell && hoveredCell.row >= row + 1 && hoveredCell.col >= col + 1
                        ? 'bg-primary border-primary/70'
                        : 'bg-surface border-border/60 hover:bg-surface-raised'
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
          <span className="text-xs font-semibold text-text-primary min-w-[36px]">
            {hoveredCell ? `${hoveredCell.row} × ${hoveredCell.col}` : `${tableRows} × ${tableCols}`}
          </span>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={insertTable}
            className="h-8 px-3.5 text-xs font-semibold text-white bg-primary rounded-lg hover:bg-primary-hover transition-all shadow-sm flex-shrink-0">
            Insert
          </button>
          <button type="button" onClick={() => setTableOpen(false)}
            className="w-7 h-7 rounded-md flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors flex-shrink-0">
            <I size={14}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></I>
          </button>
        </div>
      )}

      {!collapsed && showKeyboardHints && (
        <div className="px-3 py-1 border-t border-border/40 bg-bg/30">
          <p className="text-[10px] text-text-muted/60 flex items-center gap-2 flex-wrap">
            <span><kbd className="font-mono bg-surface-raised px-1 py-0.5 rounded text-[9px] border border-border/50">#</kbd> H1</span>
            <span><kbd className="font-mono bg-surface-raised px-1 py-0.5 rounded text-[9px] border border-border/50">##</kbd> H2</span>
            <span><kbd className="font-mono bg-surface-raised px-1 py-0.5 rounded text-[9px] border border-border/50">-</kbd> list</span>
            <span><kbd className="font-mono bg-surface-raised px-1 py-0.5 rounded text-[9px] border border-border/50">&gt;</kbd> quote</span>
            <span><kbd className="font-mono bg-surface-raised px-1 py-0.5 rounded text-[9px] border border-border/50">```</kbd> code</span>
            <span><kbd className="font-mono bg-surface-raised px-1 py-0.5 rounded text-[9px] border border-border/50">---</kbd> divider</span>
            <span><kbd className="font-mono bg-surface-raised px-1 py-0.5 rounded text-[9px] border border-border/50">[]</kbd> checklist</span>
            <span className="ml-auto text-text-muted/40">Tab to indent</span>
          </p>
        </div>
      )}
    </div>
  );
}

// ── Slash Command Menu Plugin ─────────────────────────────────
function SlashCommandPlugin() {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef(null);

  const commands = [
    { id: 'h1', label: 'Heading 1', desc: 'Large section heading', icon: <span className="text-[11px] font-extrabold">H1</span>, action: () => { editor.update(() => { const sel = $getSelection(); if ($isRangeSelection(sel)) $setBlocksType(sel, () => $createHeadingNode('h1')); }); } },
    { id: 'h2', label: 'Heading 2', desc: 'Medium section heading', icon: <span className="text-[11px] font-bold">H2</span>, action: () => { editor.update(() => { const sel = $getSelection(); if ($isRangeSelection(sel)) $setBlocksType(sel, () => $createHeadingNode('h2')); }); } },
    { id: 'h3', label: 'Heading 3', desc: 'Small section heading', icon: <span className="text-[11px] font-semibold">H3</span>, action: () => { editor.update(() => { const sel = $getSelection(); if ($isRangeSelection(sel)) $setBlocksType(sel, () => $createHeadingNode('h3')); }); } },
    { id: 'bullet', label: 'Bullet List', desc: 'Unordered list', icon: <I size={14}><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/></I>, action: () => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined) },
    { id: 'number', label: 'Numbered List', desc: 'Ordered list', icon: <I size={14}><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><path d="M4 6h1v4"/><path d="M4 10h2"/></I>, action: () => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined) },
    { id: 'checklist', label: 'Task List', desc: 'Checkboxes for tasks', icon: <I size={14}><rect x="3" y="5" width="6" height="6" rx="1"/><path d="m3 17 2 2 4-4"/><line x1="13" y1="8" x2="21" y2="8"/></I>, action: () => editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined) },
    { id: 'quote', label: 'Quote', desc: 'Blockquote', icon: <I size={14}><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" fill="currentColor" stroke="none"/></I>, action: () => { editor.update(() => { const sel = $getSelection(); if ($isRangeSelection(sel)) $setBlocksType(sel, () => $createQuoteNode()); }); } },
    { id: 'toggle', label: 'Toggle / Collapsible', desc: 'Collapsible section', icon: <I size={14}><path d="M9 6l-2 3h2v4H9l2 3V6z"/></I>, action: () => applyToggle(editor) },
    { id: 'columns2', label: '2 columns', desc: 'Side-by-side layout', icon: <I size={14}><rect x="3" y="4" width="7" height="16" rx="1"/><rect x="14" y="4" width="7" height="16" rx="1"/></I>, action: () => applyColumns(editor, 2) },
    { id: 'columns3', label: '3 columns', desc: 'Three-up layout', icon: <I size={14}><rect x="2" y="4" width="5" height="16" rx="1"/><rect x="9.5" y="4" width="5" height="16" rx="1"/><rect x="17" y="4" width="5" height="16" rx="1"/></I>, action: () => applyColumns(editor, 3) },
    { id: 'code', label: 'Code Block', desc: 'Syntax highlighted block', icon: <I size={14}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></I>, action: () => { editor.update(() => { const sel = $getSelection(); if ($isRangeSelection(sel)) $setBlocksType(sel, () => $createCodeNode()); }); } },
    { id: 'divider', label: 'Divider', desc: 'Horizontal rule', icon: <I size={14}><line x1="3" y1="12" x2="21" y2="12"/></I>, action: () => editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined) },
    { id: 'table', label: 'Table', desc: 'Insert a 3x3 table', icon: <I size={14}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></I>, action: () => { editor.update(() => { const table = $createTableNodeWithDimensions(3, 3, false); $insertNodes([table, $createParagraphNode()]); }); } },
    { id: 'image', label: 'Image', desc: 'Upload or embed an image', icon: <I size={14}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></I>, action: () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          const { data } = await uploadApi.upload(file);
          editor.update(() => {
            const imageNode = $createImageNode({ src: data.url, alt: '' });
            const paragraph = $createParagraphNode();
            $insertNodes([imageNode, paragraph]);
          });
        } catch (err) { console.error('Image upload failed:', err); }
      };
      input.click();
    }},
    // ── Quick callouts ──
    { id: 'info', label: 'Info Box', desc: 'Blue info callout', icon: <span className="text-[14px]">ℹ️</span>, action: () => applyCallout(editor, 'ℹ️ ', 'info') },
    { id: 'tip', label: 'Tip / Pro Tip', desc: 'Helpful tip callout', icon: <span className="text-[14px]">💡</span>, action: () => applyCallout(editor, '💡 ', 'info') },
    { id: 'success', label: 'Success', desc: 'Green success callout', icon: <span className="text-[14px]">✅</span>, action: () => applyCallout(editor, '✅ ', 'success') },
    { id: 'warning', label: 'Warning', desc: 'Yellow warning callout', icon: <span className="text-[14px]">⚠️</span>, action: () => applyCallout(editor, '⚠️ ', 'warn') },
    { id: 'error', label: 'Error / Don\'t', desc: 'Red error callout', icon: <span className="text-[14px]">❌</span>, action: () => applyCallout(editor, '❌ ', 'danger') },
    { id: 'security', label: 'Security Note', desc: 'Security callout', icon: <span className="text-[14px]">🔒</span>, action: () => applyCallout(editor, '🔒 ', 'warn') },
    // ── Alignment ──
    { id: 'align-left', label: 'Align Left', desc: 'Left-align text', icon: <I size={14}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></I>, action: () => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left') },
    { id: 'align-center', label: 'Align Center', desc: 'Center-align text', icon: <I size={14}><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></I>, action: () => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center') },
    { id: 'align-right', label: 'Align Right', desc: 'Right-align text', icon: <I size={14}><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></I>, action: () => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right') },
  ];

  const filtered = search ? commands.filter(c => c.label.toLowerCase().includes(search.toLowerCase()) || c.desc.toLowerCase().includes(search.toLowerCase())) : commands;

  useEffect(() => { setSelectedIndex(0); }, [search]);

  useEffect(() => {
    const rootEl = editor.getRootElement();
    if (!rootEl) return;

    const handler = (e) => {
      if (!open && e.data === '/') {
        // Check if slash is at start of line or after whitespace
        setTimeout(() => {
          editor.getEditorState().read(() => {
            const sel = $getSelection();
            if (!$isRangeSelection(sel)) return;
            const anchor = sel.anchor;
            const node = anchor.getNode();
            const text = node.getTextContent();
            const offset = anchor.offset;
            if (offset >= 1 && text[offset - 1] === '/' && (offset === 1 || text[offset - 2] === ' ' || text[offset - 2] === '\n')) {
              const nativeSel = window.getSelection();
              if (nativeSel && nativeSel.rangeCount > 0) {
                const range = nativeSel.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                const editorRect = rootEl.getBoundingClientRect();
                setPos({ top: rect.bottom - editorRect.top + 4, left: rect.left - editorRect.left });
              }
              setOpen(true);
              setSearch('');
            }
          });
        }, 0);
      } else if (open) {
        if (e.data && e.data !== '/' && !e.inputType?.includes('delete')) {
          setSearch(s => s + e.data);
        } else if (e.inputType === 'deleteContentBackward') {
          setSearch(s => {
            if (s.length === 0) { setOpen(false); return ''; }
            return s.slice(0, -1);
          });
        }
      }
    };

    rootEl.addEventListener('input', handler);
    return () => rootEl.removeEventListener('input', handler);
  }, [editor, open]);

  // Close menu on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) { setOpen(false); setSearch(''); } };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Handle keyboard within the editor while menu is open
  useEffect(() => {
    if (!open) return;
    const rootEl = editor.getRootElement();
    if (!rootEl) return;

    const handler = (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, filtered.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          editor.update(() => {
            const sel = $getSelection();
            if ($isRangeSelection(sel)) {
              const node = sel.anchor.getNode();
              const text = node.getTextContent();
              const slashIdx = text.lastIndexOf('/');
              if (slashIdx >= 0) node.spliceText(slashIdx, text.length - slashIdx, '', true);
            }
          });
          filtered[selectedIndex].action();
          setOpen(false); setSearch('');
        }
      }
      else if (e.key === 'Escape') { setOpen(false); setSearch(''); }
    };

    rootEl.addEventListener('keydown', handler);
    return () => rootEl.removeEventListener('keydown', handler);
  }, [editor, open, filtered, selectedIndex]);

  if (!open || filtered.length === 0) return null;

  // Group commands by category for a cleaner menu
  const headingCmds = filtered.filter(c => c.id.startsWith('h'));
  const listCmds = filtered.filter(c => ['bullet', 'number', 'checklist'].includes(c.id));
  const blockCmds = filtered.filter(c => ['quote', 'code', 'divider', 'toggle'].includes(c.id));
  const mediaCmds = filtered.filter(c => ['table', 'image'].includes(c.id));
  const calloutCmds = filtered.filter(c => ['info', 'tip', 'success', 'warning', 'error', 'security'].includes(c.id));
  const alignCmds = filtered.filter(c => c.id.startsWith('align-'));
  const groups = [
    { label: null, items: search ? filtered : [] },
    { label: 'Headings', items: search ? [] : headingCmds },
    { label: 'Lists', items: search ? [] : listCmds },
    { label: 'Blocks', items: search ? [] : blockCmds },
    { label: 'Media', items: search ? [] : mediaCmds },
    { label: 'Callouts', items: search ? [] : calloutCmds },
    { label: 'Alignment', items: search ? [] : alignCmds },
  ].filter(g => g.items.length > 0);

  // Flatten for index tracking
  let flatIdx = -1;

  return (
    <div
      ref={menuRef}
      className="absolute z-50 w-[280px] max-h-[380px] overflow-y-auto bg-surface border border-border/80 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.04)] py-2"
      style={{ top: `${pos.top}px`, left: `${pos.left}px` }}
    >
      {search && (
        <div className="sticky top-0 px-2 py-1 border-b border-border/40 bg-surface/95 backdrop-blur-sm">
          <input
            autoFocus
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { setOpen(false); setSearch(''); }
              if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, filtered.length - 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
            }}
            placeholder="Search commands..."
            className="w-full px-2 py-1 text-xs bg-surface border border-border rounded-lg outline-none focus:border-primary"
          />
        </div>
      )}

      {groups.map((group, gi) => (
        <div key={gi}>
          {group.label && (
            <div className="px-3 pt-2 pb-1 text-[10px] font-semibold text-text-muted/50 uppercase tracking-widest sticky top-7 bg-surface/95 backdrop-blur-sm">
              {group.label}
            </div>
          )}
          {group.items.map((cmd) => {
            flatIdx += 1;
            const isSelected = flatIdx === selectedIndex;
            return (
              <button
                key={cmd.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  editor.update(() => {
                    const sel = $getSelection();
                    if ($isRangeSelection(sel)) {
                      const node = sel.anchor.getNode();
                      const text = node.getTextContent();
                      const slashIdx = text.lastIndexOf('/');
                      if (slashIdx >= 0) node.spliceText(slashIdx, text.length - slashIdx, '', true);
                    }
                  });
                  cmd.action();
                  setOpen(false);
                  setSearch('');
                }}
                className={`w-full px-3 py-2 text-left transition-all flex items-start gap-2 cursor-pointer ${isSelected ? 'bg-primary/15' : 'hover:bg-primary/10'}`}
              >
                <span className="text-text-secondary flex-shrink-0 mt-0.5">{cmd.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-text-primary">{cmd.label}</div>
                  <div className="text-xs text-text-muted/60">{cmd.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// FloatingToolbarPlugin removed — was interfering with text selection

// ── Tab Indent Plugin ──────────────────────────────────────────
function TabIndentPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_TAB_COMMAND,
      (e) => {
        e.preventDefault();
        editor.dispatchCommand(
          e.shiftKey ? OUTDENT_CONTENT_COMMAND : INDENT_CONTENT_COMMAND,
          undefined,
        );
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}

// ── Link Shortcut Plugin ───────────────────────────────────────
function LinkShortcutPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // Get selected text and prompt for URL
        editor.getEditorState().read(() => {
          const sel = $getSelection();
          if (!$isRangeSelection(sel)) return;
          const selectedText = sel.getTextContent();
          const url = window.prompt('Enter URL:', 'https://');
          if (url) {
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                if (selectedText) {
                  // Wrap selected text in a link
                  const linkNode = $createLinkNode(url);
                  linkNode.append($createTextNode(selectedText));
                  selection.insertNodes([linkNode]);
                } else {
                  const linkNode = $createLinkNode(url);
                  linkNode.append($createTextNode(url));
                  selection.insertNodes([linkNode]);
                }
              }
            });
          }
        });
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [editor]);

  return null;
}

// ── Paste URL Link Plugin ──────────────────────────────────────
function PasteUrlLinkPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.registerCommand(
      'PASTE_TEXT',
      (text) => {
        const urlRegex = /^https?:\/\/.+/;
        if (urlRegex.test(text)) {
          editor.update(() => {
            const sel = $getSelection();
            if ($isRangeSelection(sel)) {
              const linkNode = $createLinkNode(text);
              linkNode.append($createTextNode(text));
              sel.insertNodes([linkNode]);
            }
          });
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);

  return null;
}

// ── Image Drag Drop Plugin ─────────────────────────────────────
function ImageDragDropPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const rootEl = editor.getRootElement();
    if (!rootEl) return;

    const handler = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    rootEl.addEventListener('dragover', handler);
    rootEl.addEventListener('drop', async (e) => {
      e.preventDefault();
      const files = e.dataTransfer?.files;
      if (!files) return;
      for (let file of files) {
        if (file.type.startsWith('image/')) {
          try {
            const { data } = await uploadApi.upload(file);
            editor.update(() => {
              const imageNode = $createImageNode({ src: data.url, alt: '' });
              const paragraph = $createParagraphNode();
              $insertNodes([imageNode, paragraph]);
            });
          } catch (err) {
            console.error('Image upload failed:', err);
          }
        }
      }
    });

    return () => {
      rootEl.removeEventListener('dragover', handler);
    };
  }, [editor]);

  return null;
}

// ── Paste Image Plugin ─────────────────────────────────────────
// Pasting a screenshot / copied image from the clipboard uploads it via
// /api/upload and inserts it inline — same pipeline as drag-drop above.
function PasteImagePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event) => {
        const clipboard = event?.clipboardData;
        if (!clipboard) return false;
        // clipboard.files covers screenshots; fall back to items for browsers
        // that only expose image data through DataTransferItem.
        const files = [];
        if (clipboard.files?.length) {
          for (const f of clipboard.files) if (f.type.startsWith('image/')) files.push(f);
        } else if (clipboard.items?.length) {
          for (const item of clipboard.items) {
            if (item.kind === 'file' && item.type.startsWith('image/')) {
              const f = item.getAsFile();
              if (f) files.push(f);
            }
          }
        }
        if (!files.length) return false;   // not an image paste — let text flow through

        event.preventDefault();
        (async () => {
          for (const file of files) {
            try {
              const { data } = await uploadApi.upload(file);
              editor.update(() => {
                const imageNode = $createImageNode({ src: data.url, alt: file.name || 'pasted image' });
                const paragraph = $createParagraphNode();
                $insertNodes([imageNode, paragraph]);
              });
            } catch (err) {
              console.error('Pasted image upload failed:', err);
            }
          }
        })();
        return true;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  return null;
}

// ── Word Count Plugin ──────────────────────────────────────────
function WordCountPlugin() {
  const [editor] = useLexicalComposerContext();
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    editor.registerUpdateListener(() => {
      editor.getEditorState().read(() => {
        const text = $getRoot().getTextContent();
        const count = text.trim().split(/\s+/).filter(w => w.length > 0).length;
        setWordCount(count);
      });
    });
  }, [editor]);

  return null;
}

// ── Init Plugin ────────────────────────────────────────────────
// ONLY runs once on mount to load initial value. Never re-runs on value changes.
function InitPlugin({ value }) {
  const [editor] = useLexicalComposerContext();
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current || !value) return;
    didInit.current = true;

    try {
      const json = isLexicalJson(value) ? value : plainTextToLexical(value);
      const state = editor.parseEditorState(json);
      editor.setEditorState(state);
    } catch (err) {
      console.error('InitPlugin: failed to load initial value:', err);
    }
  }, [editor, value]);

  return null;
}

// ── External Sync Plugin ───────────────────────────────────────
// Handles value changes from OUTSIDE the editor (e.g. loading a different guide).
// NEVER syncs while the editor is focused — that would destroy cursor/selection.
// Also skips values that the editor itself emitted via onChange.
function ExternalSyncPlugin({ value, lastEmittedRef }) {
  const [editor] = useLexicalComposerContext();
  const prevValueRef = useRef(value);

  useEffect(() => {
    // Skip if value hasn't actually changed
    if (value === prevValueRef.current) return;
    prevValueRef.current = value;

    // Skip if no value or if this is our own emission
    if (!value || value === lastEmittedRef.current) return;

    // NEVER sync while editor is focused — user is actively editing
    const rootEl = editor.getRootElement();
    if (rootEl && rootEl.contains(document.activeElement)) return;

    try {
      const json = isLexicalJson(value) ? value : plainTextToLexical(value);
      const state = editor.parseEditorState(json);
      editor.setEditorState(state);
    } catch (err) {
      console.error('ExternalSyncPlugin: failed to sync:', err);
    }
  }, [value, editor, lastEmittedRef]);

  return null;
}

// ── Plugin: expose append action ──────────────────────────────
function AppendPlugin({ appendRef }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!appendRef) return;
    appendRef.current = () => {
      editor.update(() => {
        const root = $getRoot();
        const p = $createParagraphNode();
        root.append(p);
        p.selectEnd();
      });
      editor.focus();
    };
  }, [editor, appendRef]);

  return null;
}

// ── Main export ────────────────────────────────────────────────
export default function LexicalEditor({
  value,
  onChange,
  onBlur,
  placeholder = 'Start typing... Use markdown shortcuts or the toolbar above',
  className = '',
  minHeight = '120px',
  showAppendButton = false,
  surface = 'card',
  toolbarClassName = '',
  headerSlot = null,
  headerSlotClassName = '',
  contentClassName = '',
  showKeyboardHints = true,
  fillHeight = false,
  // slim=true renders the minimal Bold/Italic/Link toolbar instead of
  // the full feature surface. Used for short-content fields like the
  // Troubleshooting fix field where headings/lists/tables/images are
  // overkill but rich text still beats a plain textarea.
  slim = false,
  // PORTED (it-hub): a DOM element to render the toolbar into instead of inline
  // above the content. Used by the admin console to put the toolbar in its own
  // sticky header bar. Null/undefined keeps the original inline behaviour.
  toolbarPortalTarget = null,
  // (action, { text, title }) => Promise<string> — the host's AI endpoint.
  // Omitted → the assistant reports that no endpoint is configured rather
  // than pretending to work.
  onAiAction = null,
  getTitle = null,
  // (query) => [{ id, title, category }] — powers the @ guide picker.
  // Omitted → the picker never opens (no endpoint guessed on the host's behalf).
  searchGuides = null,
}) {
  const appendRef = useRef(null);
  const lastEmittedRef = useRef(value);

  const handleChange = useCallback(
    (editorState) => {
      const json = JSON.stringify(editorState.toJSON());
      lastEmittedRef.current = json;
      onChange?.(json);
    },
    [onChange],
  );

  const initialConfig = {
    namespace: 'RichEditor',
    theme,
    onError: (err) => console.error('Lexical error:', err),
    nodes: NODES,
  };

  const wrapperClassName = surface === 'page'
    ? `lexical-editor-wrapper overflow-visible bg-transparent transition-all duration-200 ${fillHeight ? 'h-full flex flex-col' : ''} ${className}`
    : `lexical-editor-wrapper border border-border rounded-xl bg-surface overflow-hidden transition-all duration-200 focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(var(--color-primary-rgb),0.12)] focus-within:ring-1 focus-within:ring-primary/10 ${fillHeight ? 'h-full flex flex-col' : ''} ${className}`;
  const editableClassName = surface === 'page'
    ? `lexical-content-editable outline-none py-4 text-[15px] text-text-primary leading-[1.9] ${contentClassName}`
    : `lexical-content-editable outline-none px-5 py-4 text-sm text-text-primary leading-relaxed ${contentClassName}`;
  const placeholderClassName = surface === 'page'
    ? `lexical-placeholder absolute top-0 left-0 right-0 py-4 text-[15px] text-text-muted/40 pointer-events-none select-none ${contentClassName}`
    : 'lexical-placeholder absolute top-4 left-5 text-sm text-text-muted/60 pointer-events-none select-none';

  const placeholderContent = (
    <div className={placeholderClassName}>
      {surface === 'page' ? 'Start writing...' : placeholder}
    </div>
  );

  return (
    <div className={wrapperClassName}>
      <LexicalComposer initialConfig={initialConfig}>
        {/* PORTED: optional toolbarPortalTarget.
            it-hub's admin page has its own sticky header bar with a dedicated
            toolbar slot (#ed-toolbar), which is where the previous TipTap
            toolbar lived — above the document card, not inside it. A portal is
            the correct way to put the toolbar there: it moves the DOM output
            while keeping the node inside this component's React tree, so the
            LexicalComposer context still reaches it (the toolbar re-renders on
            every selection change to update active states, which is exactly why
            physically moving the DOM node instead would break). */}
        {(() => {
          const toolbar = slim
            ? <SlimToolbar className={toolbarClassName} />
            : <Toolbar className={toolbarClassName} surface={surface} showKeyboardHints={showKeyboardHints} />;
          return toolbarPortalTarget ? createPortal(toolbar, toolbarPortalTarget) : toolbar;
        })()}
        {headerSlot && <div className={headerSlotClassName}>{headerSlot}</div>}
        <div className={fillHeight ? 'relative flex-1 min-h-0' : 'relative'} style={fillHeight ? undefined : { minHeight }}>
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className={editableClassName}
                style={fillHeight ? { height: '100%' } : { minHeight }}
                onBlur={onBlur}
              />
            }
            placeholder={placeholderContent}
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <ListPlugin />
        <CheckListPlugin />
        <LinkPlugin />
        <HorizontalRulePlugin />
        <TablePlugin />
        <TabIndentPlugin />
        <LinkShortcutPlugin />
        <PasteUrlLinkPlugin />
        <ImageDragDropPlugin />
        <PasteImagePlugin />
        <SlashCommandPlugin />
        <AiAssistantPlugin onAiAction={onAiAction} getTitle={getTitle} />
        <MentionPlugin searchGuides={searchGuides} />
        {/* FloatingToolbarPlugin removed */}
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
        <InitPlugin value={value} />
        <ExternalSyncPlugin value={value} lastEmittedRef={lastEmittedRef} />
        {showAppendButton && <AppendPlugin appendRef={appendRef} />}
        <WordCountPlugin />
      </LexicalComposer>
      {showAppendButton && (
        <button
          type="button"
          onClick={() => appendRef.current?.()}
          className="w-full h-9 border-t border-border text-xs font-medium text-text-muted hover:text-primary hover:bg-primary-light/20 transition-all duration-150 flex items-center justify-center gap-1.5"
        >
          <I size={14}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></I>
          Add paragraph
        </button>
      )}
    </div>
  );
}
