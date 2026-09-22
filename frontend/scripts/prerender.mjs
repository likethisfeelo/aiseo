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
//
// SSG (full-body) routes:
//   Routes flagged `ssg: true` additionally get their <body>
//   rendered to static HTML via src/entry-server.tsx (loaded
//   through Vite's SSR pipeline) and injected into the empty
//   `<div id="root"></div>`. This makes the page copy crawlable
//   by JS-less bots while the client bundle still mounts on top.
//   See src/entry-server.tsx for the rationale.
// ============================================================

import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = resolve(__dirname, '..', 'dist');
const ROOT_DIR = resolve(__dirname, '..');
const TEMPLATE_PATH = resolve(DIST_DIR, 'index.html');

// Absolute origin used for canonical / og:url. Override with
// PRERENDER_BASE_URL when building for prod.
const BASE_URL = (process.env.PRERENDER_BASE_URL || 'https://site.dev.aiseo.tips').replace(/\/+$/, '');

// Single source of truth for per-route SEO metadata. Keep
// titles short (<= 60 chars) and descriptions <= 160 chars —
// Naver/Kakao truncate beyond that.
const ROUTES = [
  {
    // 루트 / 도 명시적으로 프리렌더해서 Naver Yeti / Kakao 같이
    // JS 실행하지 않는 크롤러도 사이트 핵심 카피·OG 를 가져갈 수
    // 있게 한다. 이 항목은 dist/index.html 자체를 덮어쓰며 SPA 의
    // <div id="root"></div> + 번들 script 는 그대로 유지된다.
    path: '/',
    title: 'AISEO — AI 웹사이트, 검색 노출까지 한 번에',
    description: 'AI 홈페이지 제작 + 12개월 무료 서브도메인·호스팅 + 10년 노하우 SEO 핵심강의를 한 번에. 소상공인·1인 대표·스타트업을 위한 검색 노출 솔루션 AISEO.TIPS.',
  },
  {
    path: '/course2026',
    title: '수강안내 2026 | AISEO',
    description: 'AISEO 2026 수강안내. AI 홈페이지 제작 · 도메인 & 호스팅 · SEO 핵심강의 3가지 트랙과 맞춤형 진단을 한 페이지에서 확인하세요.',
  },
  {
    path: '/support2026',
    title: '지원서비스 2026 | AISEO',
    description: 'AISEO 2026 지원서비스. AI로 직접 만들고 검색으로 고객이 먼저 찾아오는 구조를 만드는 맞춤형 교육과 실행 패키지를 안내합니다.',
  },
  {
    path: '/events2026',
    title: 'AISEO 2026 이벤트 — 광고가 아닌 검색될 구조를 만드는',
    description: 'AISEO 2026 런칭 이벤트. 일회성 광고가 아닌, 검색될 구조를 만듭니다. 무료 런칭 파트너 / 10만원 실전 패키지 / 검색 네트워크 등록 — 첫 사례를 함께 만들 분을 찾습니다.',
    image: '/events/hero-pc.jpg',
    ssg: true,
  },
  {
    path: '/events2026/free',
    title: 'AISEO 2026 런칭 이벤트 — 먼저 만나고, 함께 만들고, 한 발 앞서',
    description: 'AISEO 2026 무료 런칭 파트너 이벤트. AI 홈페이지 제작 + 도메인·호스팅 + SEO 핵심강의 — 정가 30만원 → 0원. 선착순 3팀, 자격 검토 후 1:1 코칭.',
    ssg: true,
  },
  {
    path: '/events2026/paid',
    title: 'AISEO 2026 런칭 이벤트 — 두 가지 패키지 중 내게 맞는 한 가지를',
    description: 'AISEO 2026 EVENT 02 검색 전략 / EVENT 03 콘텐츠 기획 — 각각 CORE 1 즉시 배포 포함, 정가 30만원 → 10만원. 자격 검토 없이 누구나 신청 가능, 각 7팀 한정.',
    ssg: true,
  },
  {
    path: '/events2026/first',
    title: 'AISEO 2026 런칭 이벤트 — 첫완성패키지(풀패키지)로 한 번에 제대로',
    description: 'AISEO 2026 EVENT 04 첫완성패키지. 001 검색노출전략 + 002 콘텐츠 기획·설계 + CORE 1 즉시 배포 전 과정에 사전상담 1시간까지 — 정가 50만원 → 35만원, 사전상담 1 + 본세션 3 총 4회로 디자인 방향까지 잡고 제대로 완성합니다.',
    image: '/events/hero-pc.jpg',
    ssg: true,
  },
  {
    path: '/events2026/snap',
    title: '사진스냅 작가 특별 이벤트 — 50만원 첫완성패키지를 10만원에 | AISEO',
    description: '웨딩 · 가족 · 프로필 · 반려동물 스냅 작가를 위한 AISEO 특별 이벤트. 검색 전략 + 콘텐츠 기획 + 즉시 배포 3회 교육, 정가 50만원 → 10만원. 회원가입 없이 희망 교육 시간을 등록하면 카카오톡으로 연락드립니다.',
    image: '/events/hero-pc.jpg',
    ssg: true,
  },
  {
    path: '/events2026/pet',
    title: '반려동물 서비스 특별 이벤트 — 50만원 첫완성패키지를 10만원에 | AISEO',
    description: '펫 미용 · 호텔 · 유치원 · 카페 · 용품샵 · 펫시터 등 반려동물 서비스업을 위한 AISEO 특별 이벤트. 검색 전략 + 콘텐츠 기획 + 즉시 배포 3회 교육, 정가 50만원 → 10만원. 회원가입 없이 희망 교육 시간을 등록하면 카카오톡으로 연락드립니다.',
    image: '/events/hero-pc.jpg',
    ssg: true,
  },
  // NOTE: `/b2b` 는 더 이상 React 프리렌더로 생성하지 않는다. b2b.aiseo.tips 는
  // 별도 정적 랜딩(`frontend/public/b2b/index.html`)으로 서빙되며, Vite 가 이를
  // dist/b2b/index.html 로 복사 → deploy 가 /site/b2b/index.html 로 업로드한다.
  // Google Search Console 인증 메타는 그 정적 HTML 의 <head> 가 직접 보유한다.
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

const buildHeadBlock = ({ title, description, url, image, verification }) => {
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const u = escapeHtml(url);
  const tags = [
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
  ];
  if (image) {
    // Resolve relative image paths against the absolute origin so
    // social cards work in the raw (crawler-visible) HTML.
    const abs = /^https?:\/\//i.test(image) ? image : `${BASE_URL}${image}`;
    const i = escapeHtml(abs);
    tags.push(`<meta property="og:image" content="${i}" />`);
    tags.push(`<meta name="twitter:image" content="${i}" />`);
  }
  if (verification) {
    // Per-route only (not the shared template) so each subdomain can be
    // registered as a separate Search Console property.
    tags.push(`<meta name="google-site-verification" content="${escapeHtml(verification)}" />`);
  }
  return tags.join('\n    ');
};

// The SSG page components render their own React-19 document
// metadata (<title>/<meta>/<link rel=canonical>) inside the tree.
// We already emit canonical head tags above with absolute URLs, so
// strip the body-level duplicates (which carry relative URLs) to
// avoid conflicting canonical/og tags in the crawled HTML. Inline
// <style> blocks the components render are intentionally kept.
const stripBodyMeta = (html) =>
  html
    .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\b[^>]*>/gi, '')
    .replace(/<link\b[^>]*\brel="canonical"[^>]*>/gi, '');

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

// `renderBody` is an optional (path) => htmlString function provided
// by the Vite SSR pipeline; only used for routes flagged `ssg: true`.
const prerenderRoute = (template, route, renderBody) => {
  const url = `${BASE_URL}${route.path}`;
  const headBlock = buildHeadBlock({
    title: route.title,
    description: route.description,
    url,
    image: route.image,
    verification: route.verification,
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

  // For SSG routes, render the page body and drop it inside the
  // (otherwise empty) root div so JS-less crawlers see the copy.
  if (route.ssg && renderBody) {
    const body = stripBodyMeta(renderBody(route.path));
    // Function replacer so `$` sequences in the rendered HTML aren't
    // treated as String.replace special patterns ($&, $1, …).
    injected = injected.replace(
      /<div id="root">\s*<\/div>/i,
      () => `<div id="root">${body}</div>`,
    );
  }

  const outPath = resolve(DIST_DIR, route.path.replace(/^\//, ''), 'index.html');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, injected, 'utf8');
  return outPath;
};

// Build src/entry-server.tsx into a Node-loadable SSR bundle with
// Vite/Rollup, then import it to render the React page components to
// HTML. We use a real SSR build (not the dev module-runner) because
// Rollup resolves react-router-dom's CommonJS named exports cleanly,
// whereas ssrLoadModule chokes on them. The bundle goes to a temp
// dir outside dist/ so it never gets synced to S3. If anything fails
// we surface the error — a broken SSG build must not silently ship
// empty bodies.
const SSR_OUT_DIR = resolve(ROOT_DIR, 'node_modules', '.cache', 'aiseo-ssr');

const createRenderer = async () => {
  const { build } = await import('vite');
  await build({
    root: ROOT_DIR,
    logLevel: 'error',
    build: {
      ssr: resolve(ROOT_DIR, 'src', 'entry-server.tsx'),
      outDir: SSR_OUT_DIR,
      emptyOutDir: true,
      rollupOptions: { output: { entryFileNames: 'entry-server.mjs' } },
    },
    // Inline react-router so its CJS named exports are bundled in.
    ssr: { noExternal: ['react-router-dom', 'react-router'] },
  });
  const mod = await import(pathToFileURL(resolve(SSR_OUT_DIR, 'entry-server.mjs')).href);
  return {
    render: (path) => mod.render(path),
    close: async () => {
      try { rmSync(SSR_OUT_DIR, { recursive: true, force: true }); } catch {}
    },
  };
};

const main = async () => {
  let template;
  try {
    template = readFileSync(TEMPLATE_PATH, 'utf8');
  } catch (err) {
    console.error(`[prerender] ${TEMPLATE_PATH} not found — did you run \`vite build\` first?`);
    process.exit(1);
  }

  console.log(`[prerender] BASE_URL = ${BASE_URL}`);

  const needsSsg = ROUTES.some((r) => r.ssg);
  let renderer = null;
  if (needsSsg) {
    renderer = await createRenderer();
    console.log('[prerender] SSG renderer ready (src/entry-server.tsx)');
  }

  try {
    for (const route of ROUTES) {
      const out = prerenderRoute(template, route, renderer?.render);
      const tag = route.ssg ? ' [ssg]' : '';
      console.log(`[prerender]  ✓ ${route.path.padEnd(16)} → ${out.replace(DIST_DIR, 'dist')}${tag}`);
    }
  } finally {
    if (renderer) await renderer.close();
  }
  console.log(`[prerender] done (${ROUTES.length} routes)`);
};

main().catch((err) => {
  console.error('[prerender] failed:', err);
  process.exit(1);
});
