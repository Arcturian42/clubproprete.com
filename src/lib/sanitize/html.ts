import 'server-only';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

/**
 * Sanitization serveur de l'éditeur riche (R8/XSS, PRD 19.6).
 * L'auteur écrit en Markdown (sûr par nature) → conversion → sanitization par
 * ALLOW-LIST STRICTE, appliquée avant stockage ET au rendu. Le reste est retiré.
 * Allow-list exacte du PRD : p, h2-h4, strong, em, ul/ol/li, a[href],
 * blockquote, img[src,alt].
 */
const ALLOWED_TAGS = [
  'p',
  'h2',
  'h3',
  'h4',
  'strong',
  'em',
  'ul',
  'ol',
  'li',
  'a',
  'blockquote',
  'img',
  'br',
] as const;

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [...ALLOWED_TAGS],
  allowedAttributes: {
    a: ['href'],
    img: ['src', 'alt'],
  },
  // Liens et images : https/data uniquement ; pas de javascript:.
  allowedSchemes: ['https'],
  allowedSchemesByTag: { img: ['https', 'data'] },
  allowProtocolRelative: false,
  transformTags: {
    // Tout lien externe : nofollow + ouverture nouvelle fenêtre sûre.
    a: sanitizeHtml.simpleTransform('a', { rel: 'nofollow noopener', target: '_blank' }),
  },
};

/** Markdown (saisi par l'auteur) → HTML sanitizé prêt au stockage/rendu. */
export function markdownToSafeHtml(markdown: string): string {
  const rawHtml = marked.parse(markdown, { async: false, gfm: true, breaks: true }) as string;
  return sanitizeHtml(rawHtml, SANITIZE_OPTIONS);
}

/** Re-sanitization défensive au rendu (double barrière PRD 19.6). */
export function sanitizeStoredHtml(html: string): string {
  return sanitizeHtml(html, SANITIZE_OPTIONS);
}

/** Extrait un aperçu texte (excerpt) depuis du HTML sanitizé. */
export function htmlToExcerpt(html: string, maxLength = 200): string {
  const text = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}…` : text;
}
