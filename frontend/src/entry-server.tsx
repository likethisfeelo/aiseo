// ============================================================
// entry-server.tsx — server-side render of the events2026 pages
// ------------------------------------------------------------
// Why this exists:
//   The events2026 marketing pages carry the bulk of their copy
//   inside the React tree, so a JS-less crawler (Kakao, Naver
//   Yeti, GPTbot, curl-based SEO tools) only ever sees an empty
//   `<div id="root"></div>`. prerender.mjs imports this module at
//   build time, renders each page to a static HTML string, and
//   injects it into that root div so the body is crawlable.
//
//   The client bundle still mounts normally on top (main.tsx uses
//   createRoot().render(), which replaces the server markup rather
//   than hydrating it) — so all interactivity (3D flip, countdown,
//   scroll lighting, signup modal) keeps working unchanged, and we
//   never risk a hydration mismatch from the countdown timers.
//
//   CSS imported by the pages (`landing.css`) is a no-op under
//   Vite SSR; the inline <style> blocks the components render are
//   preserved in the output, and the client loads landing.css the
//   usual way. That is enough for crawlers (they read text) and
//   the styled experience is delivered by the client bundle.
// ============================================================

import type { ComponentType } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { Events2026Page } from './pages/public/Events2026Page';
import { Events2026FreePage } from './pages/public/Events2026FreePage';
import { Events2026PaidPage } from './pages/public/Events2026PaidPage';
import { Events2026FirstPage } from './pages/public/Events2026FirstPage';

// Routes we statically render the body for. Keep in sync with the
// `ssg: true` entries in scripts/prerender.mjs.
const PAGES: Record<string, ComponentType> = {
  '/events2026': Events2026Page,
  '/events2026/free': Events2026FreePage,
  '/events2026/paid': Events2026PaidPage,
  '/events2026/first': Events2026FirstPage,
};

export function render(path: string): string {
  const Page = PAGES[path];
  if (!Page) throw new Error(`[entry-server] no SSG page registered for ${path}`);
  return renderToString(
    <StaticRouter location={path}>
      <Page />
    </StaticRouter>,
  );
}
