import { useEffect } from 'react';

/**
 * Shared nav behavior for the public sub-pages (/course2026,
 * /support2026, /events2026, /blog, /blog/:slug).
 *
 * Mirrors LandingPage's nav transition so each sub-page starts with
 * the large "landing-nav" bar (transparent dark pill, white text) and
 * morphs into the narrow white sticky pill once the user scrolls
 * roughly half a viewport down — the "세번 스크롤 다운" threshold the
 * user asked for. Landing itself uses a much deeper threshold (video
 * section / testi section offset); sub-pages flip earlier because
 * their hero is usually shorter than landing's.
 *
 * Also wires up the mobile hamburger + mobile menu toggle that every
 * sub-page used to inline. Cleanup removes both listeners and clears
 * any `overflow: hidden` left on `<body>` if the user navigates away
 * while the menu is open.
 *
 * The consumer is responsible for rendering
 *   `<nav id="mainNav" className="landing-nav">…</nav>`
 * plus the mobile menu + hamburger DOM with the usual ids — this hook
 * only queries them. It does NOT add `.scrolled` on mount; the scroll
 * handler runs once immediately so the class lands in sync with the
 * actual scroll position (handy when React Router preserves scroll
 * after back-nav).
 */
export function useSubPageNav() {
  useEffect(() => {
    const nav = document.getElementById('mainNav');

    // ── Nav scroll transition ──
    // Threshold: half a viewport. On a typical 1080p desktop that's
    // ~540px, which takes 3–5 mouse-wheel ticks to reach — matches the
    // "세번 스크롤 다운" feel the user described. Recomputed on resize
    // so rotating a phone (or opening DevTools) stays in sync.
    let threshold = window.innerHeight * 0.5;
    const scrollHandler = () => {
      if (window.scrollY >= threshold) nav?.classList.add('scrolled');
      else nav?.classList.remove('scrolled');
    };
    const resizeHandler = () => {
      threshold = window.innerHeight * 0.5;
      scrollHandler();
    };
    window.addEventListener('scroll', scrollHandler, { passive: true });
    window.addEventListener('resize', resizeHandler, { passive: true });
    scrollHandler();

    // ── Mobile hamburger ──
    const btn = document.getElementById('navHamburger');
    const menu = document.getElementById('navMobileMenu');
    const hamburgerHandler = () => {
      if (!btn || !menu) return;
      const isOpen = menu.classList.toggle('open');
      btn.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    };
    if (btn) btn.addEventListener('click', hamburgerHandler);
    const closeMenu = () => {
      menu?.classList.remove('open');
      btn?.classList.remove('open');
      document.body.style.overflow = '';
    };
    const mobileLinks = menu?.querySelectorAll('a');
    mobileLinks?.forEach((a) => a.addEventListener('click', closeMenu));

    return () => {
      window.removeEventListener('scroll', scrollHandler);
      window.removeEventListener('resize', resizeHandler);
      if (btn) btn.removeEventListener('click', hamburgerHandler);
      mobileLinks?.forEach((a) => a.removeEventListener('click', closeMenu));
      document.body.style.overflow = '';
      // Drop any `.scrolled` we added so the next page mounts clean.
      nav?.classList.remove('scrolled');
    };
  }, []);
}
