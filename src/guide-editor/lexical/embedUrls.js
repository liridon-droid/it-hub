// URL → embeddable iframe src. Ported from the training module's editor so the
// Docs editor supports the same Google Doc/Drive embeds and video embeds.

// Video: YouTube (watch/embed/shorts/youtu.be), Vimeo, Google Drive file preview.
export function toEmbedUrl(raw) {
  if (!raw) return null;
  const url = raw.trim();

  // YouTube
  let m =
    url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;

  // Vimeo
  m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (m) return `https://player.vimeo.com/video/${m[1]}`;

  // Google Drive file
  m = url.match(/drive\.google\.com\/(?:file\/d\/|[^]*[?&]id=)([\w-]+)/);
  if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;

  return null;
}

// Google Docs / Sheets / Slides → embeddable iframe src.
//
// IMPORTANT: SliceDesk is a *different origin* from docs.google.com, so the doc
// is loaded as a third-party iframe. When the browser blocks third-party
// cookies (Safari always, Chrome increasingly), Google can't see the viewer's
// signed-in session inside the iframe → it shows a "sign in" wall even for
// documents the viewer legitimately has access to. The only rendering that
// works *without* a Google session is the "Publish to web" form (File → Share →
// Publish to web), which serves a public, cookieless snapshot. So we normalize
// to the publish-to-web embed URLs. (Docs restricted to specific people/org
// therefore must be Published to web to embed — surfaced as a hint in the
// editor's embed dialog.)
export function toDocEmbedUrl(raw) {
  if (!raw) return null;
  const url = raw.trim();

  // Already a Publish-to-web / pre-embedded URL — pass through unchanged.
  // Published URLs use the opaque /d/e/<pubId>/ form (which can't be derived
  // from the normal doc id), and carry /pub, /pubhtml or embedded=true.
  if (
    /docs\.google\.com\/(?:document|spreadsheets|presentation)\/d\/e\//.test(url) ||
    /\/pubhtml/.test(url) ||
    /[?&]embedded=true/.test(url)
  ) {
    return url;
  }

  let m = url.match(/docs\.google\.com\/document\/d\/([\w-]+)/);
  if (m) return `https://docs.google.com/document/d/${m[1]}/pub?embedded=true`;

  m = url.match(/docs\.google\.com\/spreadsheets\/d\/([\w-]+)/);
  if (m) return `https://docs.google.com/spreadsheets/d/${m[1]}/pubhtml?widget=true&headers=false`;

  m = url.match(/docs\.google\.com\/presentation\/d\/([\w-]+)/);
  if (m) return `https://docs.google.com/presentation/d/${m[1]}/embed?start=false&loop=false`;

  // Plain Google Drive folder/file as a doc embed fallback.
  m = url.match(/drive\.google\.com\/(?:file\/d\/|[^]*[?&]id=)([\w-]+)/);
  if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;

  return null;
}

// Resolve any supported URL → { src, kind } or null.
export function resolveEmbed(raw) {
  const doc = toDocEmbedUrl(raw);
  if (doc) return { src: doc, kind: 'doc' };
  const video = toEmbedUrl(raw);
  if (video) return { src: video, kind: 'video' };
  return null;
}
