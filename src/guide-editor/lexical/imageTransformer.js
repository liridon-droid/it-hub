// Markdown transformers for images, used when importing legacy guide bodies.
//
// Two reasons this file exists:
//
// 1. @lexical/markdown's default TRANSFORMERS have no image support at all.
//    ImageNode is application-specific, so even standard `![alt](src)` markdown
//    never becomes an image — it falls through as text.
//
// 2. it-hub's legacy guides do not use markdown image syntax anyway. They embed
//    raw HTML written by the old TipTap editor, always on its own line:
//
//      <img src="https://it.slice.services/uploads/…png" style="width: 60%" data-align="left" />
//
//    Raw HTML has no markdown transformer either, so without this the tag
//    survived as literal visible text — and re-saving the guide would have
//    persisted that text and lost the screenshot permanently. These guides are
//    screenshot-heavy, so that is real data loss, not a cosmetic gap.
//
// Known limitation: ImageNode stores only { src, alt, width } (ImageNode.jsx:136),
// so `data-align` is dropped. Width is preserved.
import { $createParagraphNode } from 'lexical';
import { ImageNode, $createImageNode, $isImageNode } from './ImageNode';

// Pull one attribute out of a raw tag body, single or double quoted.
const attr = (tagBody, name) => {
  const m = tagBody.match(new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i'));
  return m ? (m[2] ?? m[3] ?? '') : '';
};

// `style="width: 60%"` → "60%". Only width is read; ImageNode has no other
// style-driven attributes.
const widthFromStyle = (style) => {
  const m = String(style || '').match(/width\s*:\s*([^;]+)/i);
  return m ? m[1].trim() : '';
};

function imageNodeFromTag(tagBody) {
  const src = attr(tagBody, 'src');
  if (!src) return null;
  return $createImageNode({
    src,
    alt: attr(tagBody, 'alt'),
    width: attr(tagBody, 'width') || widthFromStyle(attr(tagBody, 'style')) || undefined,
  });
}

/**
 * Raw `<img …>` on its own line → ImageNode. This is the one that recovers the
 * existing corpus.
 */
export const HTML_IMAGE_TRANSFORMER = {
  type: 'element',
  dependencies: [ImageNode],
  // Self-closing or not; attributes in any order.
  regExp: /^<img\s+([^>]*?)\/?>\s*$/i,
  replace: (parentNode, _children, match) => {
    const node = imageNodeFromTag(match[1]);
    if (!node) return false; // no src — leave the line as text rather than drop it
    // Images are block-level here, so the whole paragraph becomes the image.
    // A trailing empty paragraph keeps the caret placeable after it.
    parentNode.replace(node);
    node.insertAfter($createParagraphNode());
    return true;
  },
  export: (node) => {
    if (!$isImageNode(node)) return null;
    const json = node.exportJSON();
    const width = json.width && json.width !== '100%' ? ` style="width: ${json.width}"` : '';
    const alt = json.alt ? ` alt="${json.alt}"` : '';
    return `<img src="${json.src}"${alt}${width} />`;
  },
};

/**
 * Standard markdown `![alt](src)` → ImageNode. Not present in the legacy corpus,
 * but authors type it and it is the form the export above would ideally use, so
 * supporting it costs nothing and avoids a confusing dead end.
 */
export const MD_IMAGE_TRANSFORMER = {
  type: 'element',
  dependencies: [ImageNode],
  regExp: /^!\[([^\]]*)\]\(([^)\s]+)\)\s*$/,
  replace: (parentNode, _children, match) => {
    const [, alt, src] = match;
    if (!src) return false;
    const node = $createImageNode({ src, alt: alt || '' });
    parentNode.replace(node);
    node.insertAfter($createParagraphNode());
    return true;
  },
  export: () => null, // HTML_IMAGE_TRANSFORMER owns the export direction
};

export const IMAGE_TRANSFORMERS = [HTML_IMAGE_TRANSFORMER, MD_IMAGE_TRANSFORMER];
