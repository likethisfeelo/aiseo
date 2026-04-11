// ============================================================
// prerender.mjs — post-build static HTML generation for SEO
// ------------------------------------------------------------
// Why this exists:
//   The AISEO marketing site is a client-rendered React SPA,
//   so the only HTML that S3 serves is `dist/index.html`. That
//   works for Google (which executes JS) but NOT for Kakao,
//   Facebook, X/Twitter, or Naver — their OG/meta crawlers read
//   the raw HTML response and never run our React code. Without
//   prerendering, every shared link would show the SAME generic
//   title/description, regardless of route.
//
// What it does:
//   1. Read `dist/index.html` (the Vite build output) as a
//      template — it already contains the correct
//      `<script>`/`<link>` tags for our bundle.
//   2. For each ROUTE in the table below, swap the head's
//      `<title>` + meta tags with route-specific values and
//      write the result to `dist/<route>/index.html`.
//   3. At runtime the CloudFront Function rewrites
//      `/course2026` → `/site/course2026/index.html` so crawlers
//      hit the prerendered file, but human visitors still get
//      the React SPA mounted once JS kicks in (the body is
//      identical — just `<div id="root"></div>`).
//
// When more sub-pages are added, append to ROUTES below AND
// update `infra/cloudfront/subdomain-router.js` so CloudFront
// actually routes the new path. See `infra/cloudfront/README`
// (or the prerender section in the repo root README) for the
// manual-update guide.
//
// Blog posts are NOT generated here. Those are prerendered by
// the backend blog Lambda when an admin creates/updates a post
// (see `backend/functions/blog/prerender.js`), because the
// content lives in DynamoDB rather than in the repo.
// ============================================================

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = resolve(__dirname, '..', 'dist');
const TEMPLATE_PATH = resolve(DIST_DIR, 'index.html');

// Absolute origin used for canonical / og:url. Override with
// PRERENDER_BASE_URL when building for prod.
const BASE_URL = (process.env.PRERENDER_BASE_URL || 'https://site.dev.aiseo.tips').replace(/\/+$/, '');

// Single source of truth for per-route SEO metadata. Keep
// titles short (<= 60 chars) and descriptions <= 160 chars —
// Naver/Kakao truncate beyond that.
const ROUTES = [
  {
    path: '/course2026',
    title: '수강안내 2026 | AISEO',
    description: 'AISEO 2026 수강안내. AI 웹사이트 제작과 검색 최적화 교육 과정을 안내합니다.',
  },
  {
    path: '/support2026',
    title: '지원서비스 2026 | AISEO',
    description: 'AISEO 2026 지원서비스. AI 웹사이트 구축·운영 지원 서비스를 안내합니다.',
  },
  {
    path: '/events2026',
    title: '이벤트 2026 | AISEO',
    description: 'AISEO 2026 이벤트. 최신 이벤트와 프로모션 소식을 안내합니다.',
  },
  {
    path: '/blog',
    title: '블로그 | AISEO',
    description: 'AISEO 블로그. AI 웹사이트 제작, SEO, 마케팅에 대한 최신 인사이트를 공유합니다.',
  },
];

const escapeHtml = (str) =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const buildHeadBlock = ({ title, description, url }) => {
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const u = escapeHtml(url);
  return [
    `<title>${t}</title>`,
    `<meta name="description" content="${d}" />`,
    `<link rel="canonical" href="${u}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="AISEO" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,
    `<meta property="og:url" content="${u}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${t}" />`,
    `<meta name="twitter:description" content="${d}" />`,
  ].join('\n    ');
};

// Strip the template's existing <title> + og/twitter/description
// tags so we don't end up with duplicates. The viewport and
// charset metas are left alone. Regexes are tolerant of optional
// self-closing slashes and attribute ordering from Vite's output.
const stripExistingHead = (html) => {
  return html
    .replace(/<title>[^<]*<\/title>\s*/i, '')
    .replace(/<meta\s+name="description"[^>]*>\s*/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*>\s*/gi, '')
    .replace(/<meta\s+property="og:[^"]*"[^>]*>\s*/gi, '')
    .replace(/<meta\s+name="twitter:[^"]*"[^>]*>\s*/gi, '');
};

const prerenderRoute = (template, route) => {
  const url = `${BASE_URL}${route.path}`;
  const headBlock = buildHeadBlock({
    title: route.title,
    description: route.description,
    url,
  });

  const stripped = stripExistingHead(template);
  // Insert new head block right after the viewport meta, which
  // Vite always emits in a predictable slot. Fall back to
  // inserting before </head> if the viewport meta isn't found.
  let injected;
  if (/<meta\s+name="viewport"[^>]*>/i.test(stripped)) {
    injected = stripped.replace(
      /(<meta\s+name="viewport"[^>]*>)/i,
      `$1\n    ${headBlock}`,
    );
  } else {
    injected = stripped.replace(/<\/head>/i, `    ${headBlock}\n  </head>`);
  }

  const outPath = resolve(DIST_DIR, route.path.replace(/^\//, ''), 'index.html');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, injected, 'utf8');
  return outPath;
};

const main = () => {
  let template;
  try {
    template = readFileSync(TEMPLATE_PATH, 'utf8');
  } catch (err) {
    console.error(`[prerender] ${TEMPLATE_PATH} not found — did you run \`vite build\` first?`);
    process.exit(1);
  }

  console.log(`[prerender] BASE_URL = ${BASE_URL}`);
  for (const route of ROUTES) {
    const out = prerenderRoute(template, route);
    console.log(`[prerender]  ✓ ${route.path.padEnd(14)} → ${out.replace(DIST_DIR, 'dist')}`);
  }
  console.log(`[prerender] done (${ROUTES.length} routes)`);
};

main();
