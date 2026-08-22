import { DecoratorNode } from 'lexical';
import { Suspense, useState, useRef, useCallback, useEffect } from 'react';

/* ─── Lightbox for read-only click-to-expand ─── */
function ImageLightbox({ src, alt, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div style={lbStyles.overlay} onClick={onClose}>
      <button style={lbStyles.close} onClick={onClose}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
      <img src={src} alt={alt || ''} style={lbStyles.img} onClick={e => e.stopPropagation()} />
    </div>
  );
}

const lbStyles = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 32, cursor: 'zoom-out',
  },
  img: {
    maxWidth: '95vw', maxHeight: '90vh', borderRadius: 12,
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)', objectFit: 'contain', cursor: 'default',
  },
  close: {
    position: 'absolute', top: 16, right: 16, width: 40, height: 40,
    borderRadius: 12, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  },
};

function ImageComponent({ src, alt, width, nodeKey, editable }) {
  const [imgWidth, setImgWidth] = useState(width || '100%');
  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const imgRef = useRef(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleResizeStart = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = imgRef.current?.offsetWidth || 400;

    const handleMouseMove = (moveEvent) => {
      const delta = moveEvent.clientX - startXRef.current;
      const newWidth = Math.max(100, startWidthRef.current + delta);
      setImgWidth(`${newWidth}px`);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  /* In read-only mode, cap width and make clickable */
  const readOnlyStyle = !editable ? {
    width: imgWidth === '100%' ? 'auto' : imgWidth,
    maxWidth: 'min(100%, 460px)',
    cursor: 'zoom-in',
    borderRadius: 10,
    border: '1px solid rgba(0,0,0,0.08)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    transition: 'box-shadow 180ms ease, border-color 180ms ease',
  } : null;

  const editableStyle = editable ? { width: imgWidth, maxWidth: '100%' } : null;

  return (
    <>
      {showLightbox && <ImageLightbox src={src} alt={alt} onClose={() => setShowLightbox(false)} />}
      <div
        className={`relative ${editable ? 'inline-block' : 'block ml-6'} my-2 group ${isResizing ? 'select-none' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt || ''}
          style={readOnlyStyle || editableStyle}
          className={`rounded-lg h-auto block transition-shadow ${
            isHovered && editable ? 'ring-2 ring-primary/30 shadow-lg' : ''
          } ${!editable && isHovered ? 'shadow-lg' : ''}`}
          draggable="false"
          onClick={!editable ? () => setShowLightbox(true) : undefined}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        {/* Resize handle — only in editable mode */}
        {editable && isHovered && (
          <div
            onMouseDown={handleResizeStart}
            className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <div className="w-1 h-8 rounded-full bg-primary/60" />
          </div>
        )}
        {/* Size indicator during resize */}
        {isResizing && (
          <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-mono px-2 py-0.5 rounded-md">
            {imgWidth}
          </div>
        )}
      </div>
    </>
  );
}

export class ImageNode extends DecoratorNode {
  __src;
  __alt;
  __width;

  static getType() { return 'image'; }

  static clone(node) {
    return new ImageNode(node.__src, node.__alt, node.__width, node.__key);
  }

  constructor(src, alt, width, key) {
    super(key);
    this.__src = src;
    this.__alt = alt || '';
    this.__width = width || '100%';
  }

  static importJSON(serializedNode) {
    return $createImageNode({
      src: serializedNode.src,
      alt: serializedNode.alt,
      width: serializedNode.width,
    });
  }

  exportJSON() {
    return {
      type: 'image',
      version: 1,
      src: this.__src,
      alt: this.__alt,
      width: this.__width,
    };
  }

  createDOM() {
    const div = document.createElement('div');
    return div;
  }

  updateDOM() { return false; }

  isInline() { return false; }

  decorate(_editor, config) {
    const editable = _editor.isEditable();
    return (
      <Suspense fallback={null}>
        <ImageComponent
          src={this.__src}
          alt={this.__alt}
          width={this.__width}
          nodeKey={this.__key}
          editable={editable}
        />
      </Suspense>
    );
  }
}

export function $createImageNode({ src, alt, width }) {
  return new ImageNode(src, alt, width);
}

export function $isImageNode(node) {
  return node instanceof ImageNode;
}
