// Stub for the ported Lexical editor.
//
// Upstream (slicedesk) this rendered PDFs as pdf.js canvases: it imported
// `pdfjs-dist` plus `pdfjs-dist/build/pdf.worker.min.mjs?url` (a Vite-specific
// ?url import) and hardcoded ALLOWED_SRC = /^\/api\/howto\/drive-file\/[\w-]+$/
// — a slicedesk-only route. Pulling that in would add a multi-megabyte
// dependency to this bundle for a code path it-hub cannot currently produce:
// `kind: 'pdf'` embeds are only minted by slicedesk's server/sync/
// policyDriveSync.js, which does not run here.
//
// So this degrades to a plain link rather than rendering inline. Video and
// Google Doc embeds are unaffected — those use an <iframe> in EmbedNode and
// never reach this component.
//
// If inline PDF rendering is wanted in it-hub later, add pdfjs-dist and port
// the real component; the seam is this one file.
export default function PdfEmbed({ src, title }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, opacity: 0.55 }}>PDF</span>
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        style={{ fontWeight: 600, textDecoration: 'underline', wordBreak: 'break-all' }}
      >
        {title || 'Open PDF'}
      </a>
      <span style={{ fontSize: 12, opacity: 0.6 }}>Opens in a new tab</span>
    </div>
  );
}
