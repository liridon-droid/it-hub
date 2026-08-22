// The single node registry, shared by the editor and the read-only viewer.
//
// Why its own module rather than an export from LexicalEditor.jsx: the portal
// lazy-loads only LexicalViewer (src/app.jsx), and importing the list from the
// editor would pull the entire 1,800-line editor — toolbar, plugins, pickers —
// into that chunk, roughly +70 KB gzipped for every guide reader.
//
// Why shared at all: the viewer used to keep a hand-maintained duplicate of this
// array. That is a silent-failure trap — a node registered for the editor but
// forgotten in the viewer parses as nothing, so a guide looks correct while
// authoring and renders blank in the portal, with no error anywhere. Register a
// new node HERE and both surfaces get it.
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { ImageNode } from './ImageNode';
import { EmbedNode } from './EmbedNode';
import { CalloutNode } from './CalloutNode';
import { ToggleNode, ToggleSummaryNode } from './ToggleNode';

export const NODES = [
  ImageNode,
  EmbedNode,
  CalloutNode,
  ToggleNode,
  ToggleSummaryNode,
  HeadingNode,
  QuoteNode,
  CodeNode,
  CodeHighlightNode,
  ListNode,
  ListItemNode,
  LinkNode,
  AutoLinkNode,
  HorizontalRuleNode,
  TableNode,
  TableCellNode,
  TableRowNode,
];
