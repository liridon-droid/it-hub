/**
 * Read-only Lexical renderer.
 *
 * Props:
 *   value     – Lexical JSON string **or** plain text (auto-detected)
 *   className – additional wrapper classes
 *
 * If the value is plain text (legacy content), it falls back to a simple
 * whitespace-preserving <span>. Otherwise it renders the Lexical tree
 * in a non-editable composer.
 */
import { useEffect, useRef } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { ListItemNode, ListNode } from '@lexical/list';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { ImageNode } from './ImageNode';
import { EmbedNode } from './EmbedNode';
import { NODES } from './nodes';
import { isLexicalJson, plainTextToLexical } from './lexicalUtils';
import './lexicalTheme.css';

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
  heading: { h1: 'lexical-h1', h2: 'lexical-h2', h3: 'lexical-h3' },
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
};

function SetStatePlugin({ value }) {
  const [editor] = useLexicalComposerContext();
  const prev = useRef(null); // null so first render always applies

  useEffect(() => {
    if (value === prev.current) return;
    prev.current = value;

    const json = isLexicalJson(value) ? value : plainTextToLexical(value || '');
    try {
      const parsed = typeof json === 'string' ? JSON.parse(json) : json;
      const state = editor.parseEditorState(parsed);
      editor.setEditorState(state);
    } catch {
      // silent
    }
  }, [value, editor]);

  return null;
}

export default function LexicalViewer({ value, className = '' }) {
  // For truly empty values, render nothing
  if (!value) return null;

  // Plain text fallback for legacy content that isn't Lexical JSON
  if (!isLexicalJson(value)) {
    return (
      <span className={`whitespace-pre-line ${className}`}>{value}</span>
    );
  }

  const initialConfig = {
    namespace: 'StepDetailViewer',
    theme,
    editable: false,
    onError: () => {},
    // PORTED: shares the editor's NODES list instead of repeating it.
    //
    // This used to be a hand-maintained duplicate, which is a silent-failure
    // trap: a node registered for the editor but forgotten here parses as
    // nothing, so a guide that looks right while authoring renders blank in the
    // portal — and the author never sees it. One list, both surfaces.
    nodes: NODES,
  };

  return (
    <div className={`lexical-viewer ${className}`}>
      <LexicalComposer initialConfig={initialConfig}>
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="outline-none text-sm leading-relaxed" />
          }
          placeholder={null}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <ListPlugin />
        <CheckListPlugin />
        <HorizontalRulePlugin />
        <TablePlugin />
        <SetStatePlugin value={value} />
      </LexicalComposer>
    </div>
  );
}
