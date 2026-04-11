// ============================================================
// sanitize.js — HTML allow-list for blog post body.
// ------------------------------------------------------------
// The frontend TipTap editor produces HTML. We sanitize on
// write in handler.js so the stored + served content is safe
// even if an admin token is compromised or an older client
// misbehaves.
//
// Allow-list mirrors the TipTap extensions used in
// frontend/src/components/common/BlogEditor.tsx (StarterKit +
// Image + Link). Keep this list in sync when adding new
// editor extensions.
// ============================================================

const sanitizeHtml = require('sanitize-html');

const BLOG_HTML_OPTIONS = {
  allowedTags: [
    'p', 'br', 'hr',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'strong', 'em', 'u', 's', 'sub', 'sup', 'span',
    'ul', 'ol', 'li',
    'blockquote',
    'code', 'pre',
    'a',
    'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel', 'title'],
    img: ['src', 'alt', 'title', 'loading', 'width', 'height'],
    // TipTap marks some nodes as `class="..."` / `data-*`; allow a
    // narrow set so our own CSS hooks work without leaving the door
    // open for arbitrary inline style injection.
    span: ['class'],
    code: ['class'],
    pre: ['class'],
    th: ['colspan', 'rowspan'],
    td: ['colspan', 'rowspan'],
  },
  // Only allow safe URL schemes. No javascript:, data:, etc. on href.
  // Images may be https or data: (but data: is too large to be useful).
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: {
    img: ['http', 'https'],
  },
  allowProtocolRelative: false,
  // Strip disallowed tags entirely (drop children too) rather than
  // leaving their text content orphaned — prevents confusing output.
  disallowedTagsMode: 'discard',
  // Force external links to open in a new tab with noopener.
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', {
      target: '_blank',
      rel: 'noopener noreferrer',
    }),
  },
};

/**
 * Sanitize raw HTML from the blog editor.
 * @param {string} html
 * @returns {string}
 */
function sanitizeBlogHtml(html) {
  if (typeof html !== 'string' || !html) return '';
  return sanitizeHtml(html, BLOG_HTML_OPTIONS);
}

module.exports = { sanitizeBlogHtml };
