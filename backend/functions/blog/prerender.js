// ============================================================
// prerender.js — server-side OG/meta prerender for blog posts.
// ------------------------------------------------------------
// Why this exists:
//   Our frontend is a React SPA, so the raw HTML served for
//   `/blog/<slug>` is just `dist/index.html` with a generic
//   `<title>`. Kakao / Facebook / X / Naver crawlers don't
//   execute JS, so every shared blog link would surface the
//   same landing-page preview card.
//
//   For the static sub-pages (course2026, support2026,
//   events2026, /blog index) we bake prerendered HTML during
//   the frontend build (see `frontend/scripts/prerender.mjs`).
//   Blog posts can't use that path — their content lives in
//   DynamoDB and changes at runtime — so this module runs
//   inside the blog Lambda and writes a per-post HTML file to
//   the same S3 bucket whenever an admin creates/updates a
//   post.
//
//   Human visitors still get the React SPA: the body of the
//   prerendered file is identical to the template's body
//   (`<div id="root"></div>` + the same asset tags), so React
//   mounts on top and takes over client-side routing. The
//   only difference between `dist/index.html` and the
//   prerendered blog file is the `<head>` metadata block.
//
// How it's wired:
//   - `handler.js` calls `prerenderPost(item)` after every
//     successful create/update when `status === 'published'`.
//   - `handler.js` calls `deletePrerenderedPost(slug)` on
//     delete, unpublish, or slug-rename (for the OLD slug).
//   - Env vars (set in CDK):
//       SITES_BUCKET, SITES_BUCKET_DEV
//         S3 bucket names for prod / dev.
//       DISTRIBUTION_ID, DISTRIBUTION_ID_DEV
//         CloudFront distribution IDs for invalidation.
//       BLOG_BASE_URL
//         Origin used in canonical / og:url. Defaults to
//         `https://site.dev.aiseo.tips`.
//       BLOG_TEMPLATE_KEY
//         S3 key of the SPA template. Defaults to
//         `site/index.html`.
//
//   Writes go to BOTH dev and prod buckets when both env
//   vars are present, so a single Lambda deploy powers both
//   environments. Missing env vars cause that environment to
//   be skipped with a warning (never an error — we don't want
//   a prerender failure to block the DB write).
// ============================================================

const { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { CloudFrontClient, CreateInvalidationCommand } = require('@aws-sdk/client-cloudfront');

const s3 = new S3Client({});
const cloudFront = new CloudFrontClient({});

const TEMPLATE_KEY = process.env.BLOG_TEMPLATE_KEY || 'site/index.html';
const BASE_URL = (process.env.BLOG_BASE_URL || 'https://site.dev.aiseo.tips').replace(/\/+$/, '');

const TARGETS = [
  {
    label: 'prod',
    bucket: process.env.SITES_BUCKET,
    distributionId: process.env.DISTRIBUTION_ID,
  },
  {
    label: 'dev',
    bucket: process.env.SITES_BUCKET_DEV,
    distributionId: process.env.DISTRIBUTION_ID_DEV,
  },
].filter((t) => t.bucket);

const streamToString = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
};

const escapeHtml = (str) =>
  String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

// Strip the plain-text excerpt fallback from an HTML body.
// Used when meta_description is empty so Kakao/FB still have
// something descriptive. Caps at 160 chars.
const htmlToExcerpt = (html, max = 160) => {
  if (!html || typeof html !== 'string') return '';
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + '…';
};

const buildHeadBlock = (post) => {
  const title = escapeHtml(post.metaTitle || post.title || 'AISEO 블로그');
  const description = escapeHtml(
    post.metaDescription || post.excerpt || htmlToExcerpt(post.body) || 'AISEO 블로그 — AI 웹사이트와 검색 최적화 인사이트.',
  );
  const url = escapeHtml(`${BASE_URL}/blog/${post.slug}`);
  const ogImage = post.ogImageUrl || post.thumbnailUrl || '';
  const ogImageTag = ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}" />` : '';
  const twitterImageTag = ogImage ? `<meta name="twitter:image" content="${escapeHtml(ogImage)}" />` : '';
  const twitterCard = ogImage ? 'summary_large_image' : 'summary';

  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="article" />`,
    `<meta property="og:site_name" content="AISEO" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${url}" />`,
    ogImageTag,
    `<meta name="twitter:card" content="${twitterCard}" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    twitterImageTag,
  ]
    .filter(Boolean)
    .join('\n    ');
};

// See frontend/scripts/prerender.mjs — same regex set. Keep
// these in sync so both prerender paths strip the same tags.
const stripExistingHead = (html) =>
  html
    .replace(/<title>[^<]*<\/title>\s*/i, '')
    .replace(/<meta\s+name="description"[^>]*>\s*/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*>\s*/gi, '')
    .replace(/<meta\s+property="og:[^"]*"[^>]*>\s*/gi, '')
    .replace(/<meta\s+name="twitter:[^"]*"[^>]*>\s*/gi, '');

const injectHead = (template, headBlock) => {
  const stripped = stripExistingHead(template);
  if (/<meta\s+name="viewport"[^>]*>/i.test(stripped)) {
    return stripped.replace(
      /(<meta\s+name="viewport"[^>]*>)/i,
      `$1\n    ${headBlock}`,
    );
  }
  return stripped.replace(/<\/head>/i, `    ${headBlock}\n  </head>`);
};

const getTemplate = async (bucket) => {
  // Re-fetched on every prerender call. Posts are saved
  // infrequently (a few times a day at most), so the extra
  // GetObject cost is negligible — and always using a fresh
  // template means we pick up new asset hashes the moment a
  // frontend redeploy lands, without needing a Lambda
  // invalidation trick.
  const result = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: TEMPLATE_KEY }));
  return streamToString(result.Body);
};

const postKey = (slug) => `site/blog/${slug}/index.html`;

const invalidate = async (distributionId, paths) => {
  if (!distributionId) return;
  try {
    await cloudFront.send(new CreateInvalidationCommand({
      DistributionId: distributionId,
      InvalidationBatch: {
        CallerReference: `blog-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        Paths: { Quantity: paths.length, Items: paths },
      },
    }));
  } catch (err) {
    console.error(`[prerender] invalidate failed for ${distributionId}:`, err.message);
  }
};

/**
 * Build + upload a static HTML snapshot for a single blog
 * post. Silently logs errors instead of throwing — a failed
 * prerender must not block the DynamoDB write.
 *
 * @param {object} post — full DDB item (title, slug, body,
 *   metaTitle, metaDescription, excerpt, thumbnailUrl,
 *   ogImageUrl, status, …)
 */
async function prerenderPost(post) {
  if (!post || !post.slug) return;
  if (post.status !== 'published') {
    // Unpublished posts shouldn't be reachable — remove any
    // lingering prerender so the old OG tags don't leak.
    return deletePrerenderedPost(post.slug);
  }
  if (TARGETS.length === 0) {
    console.warn('[prerender] no SITES_BUCKET env — skipping');
    return;
  }

  const headBlock = buildHeadBlock(post);
  const key = postKey(post.slug);
  const invalidationPaths = [`/blog/${post.slug}`, `/blog/${post.slug}/`];

  for (const target of TARGETS) {
    try {
      const template = await getTemplate(target.bucket);
      const html = injectHead(template, headBlock);
      await s3.send(new PutObjectCommand({
        Bucket: target.bucket,
        Key: key,
        Body: html,
        ContentType: 'text/html; charset=utf-8',
        CacheControl: 'public, max-age=60, s-maxage=60',
      }));
      console.log(`[prerender] ${target.label} ✓ s3://${target.bucket}/${key}`);
      await invalidate(target.distributionId, invalidationPaths);
    } catch (err) {
      console.error(`[prerender] ${target.label} failed:`, err.message);
    }
  }
}

/**
 * Remove the prerendered HTML snapshot for a slug across all
 * configured targets, plus invalidate CloudFront. Called on
 * delete, unpublish, or when a slug is renamed (for the OLD
 * slug).
 */
async function deletePrerenderedPost(slug) {
  if (!slug || TARGETS.length === 0) return;
  const key = postKey(slug);
  const invalidationPaths = [`/blog/${slug}`, `/blog/${slug}/`];

  for (const target of TARGETS) {
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: target.bucket, Key: key }));
      console.log(`[prerender] ${target.label} ✗ s3://${target.bucket}/${key}`);
      await invalidate(target.distributionId, invalidationPaths);
    } catch (err) {
      console.error(`[prerender] ${target.label} delete failed:`, err.message);
    }
  }
}

module.exports = { prerenderPost, deletePrerenderedPost };
