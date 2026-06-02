// ============================================================
// sanitize.js — HTML allow-list for AI SEO Library post bodyHtml.
// ------------------------------------------------------------
// Identical posture to backend/functions/blog/sanitize.js — the
// admin form accepts hand-written or paste-from-editor HTML and
// we strip anything outside the allow-list before storing it.
// ============================================================

const sanitizeHtml = require('sanitize-html');

const LIBRARY_HTML_OPTIONS = {
  allowedTags: [
    'p', 'br', 'hr',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'strong', 'em', 'u', 's', 'sub', 'sup', 'span',
    'ul', 'ol', 'li',
    'blockquote',
    'code', 'pre',
    'a',
    'img',
    'figure', 'figcaption',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel', 'title'],
    img: ['src', 'alt', 'title', 'loading', 'width', 'height'],
    span: ['class'],
    code: ['class'],
    pre: ['class'],
    figure: ['class'],
    th: ['colspan', 'rowspan'],
    td: ['colspan', 'rowspan'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['http', 'https'] },
  allowProtocolRelative: false,
  disallowedTagsMode: 'discard',
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', {
      target: '_blank',
      rel: 'noopener noreferrer',
    }),
  },
};

function sanitizeLibraryHtml(html) {
  if (typeof html !== 'string' || !html) return '';
  return sanitizeHtml(html, LIBRARY_HTML_OPTIONS);
}

module.exports = { sanitizeLibraryHtml };
