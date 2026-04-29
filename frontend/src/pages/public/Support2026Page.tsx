import '../landing.css';
import { CoursePage } from './CoursePage';
import { useSubPageNav } from './useSubPageNav';

/**
 * 지원서비스 2026 — `/support2026`
 *
 * Reuses the full CoursePage body (originally served on the legacy
 * `/#course` hash route) inside the 2026 marketing shell: shared nav
 * pointing to /course2026 · /support2026 · /events2026, with the
 * "지원서비스" menu active, and SEO/OG meta for this route.
 *
 * The previous stub wrapped `ComingSoon2026`; we now inline the shell
 * (nav + footer + head meta) because we need a real body slot that
 * ComingSoon2026 doesn't expose. Keep the two shells in sync if the
 * landing nav markup changes.
 */
export function Support2026Page() {
  // Shared landing-nav → scrolled transition + mobile hamburger.
  useSubPageNav();

  // CSR-only app, so `window` is always defined at render time.
  // Canonical / og:url must be absolute so social crawlers resolve them.
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const canonicalUrl = `${origin}/support2026`;
  const docTitle = '지원서비스 2026 | AISEO';
  const metaDescription =
    'AISEO 2026 지원서비스. AI로 웹사이트를 직접 만들고 검색으로 고객이 먼저 찾아오는 구조를 만드는 교육/실행 지원 서비스를 안내합니다.';

  return (
    <>
      {/*
        React 19 native head metadata — rendering <title> / <meta> /
        <link> inside a component auto-hoists them into <head>. Same
        pattern used by ComingSoon2026 / BlogPostPage.
      */}
      <title>{docTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="AISEO" />
      <meta property="og:title" content={docTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={docTitle} />
      <meta name="twitter:description" content={metaDescription} />

      {/* NAV */}
      <nav id="mainNav" className="landing-nav">
        <div className="nav-inner">
          <a href="/" className="nav-logo">AISEO</a>
          <div className="nav-links">
            <a href="/course2026">수강안내</a>
            <a href="/support2026" className="active">지원서비스</a>
            <div className="nav-item-has-sub">
              <a href="/events2026">이벤트</a>
              <div className="nav-submenu" role="menu">
                <a href="/events2026/free" role="menuitem">무료이벤트</a>
                <a href="/events2026/paid" role="menuitem">할인이벤트</a>
              </div>
            </div>
            <a href="/blog">블로그</a>
          </div>
          <div className="nav-cta">
            <a href="/?auth=login" className="btn-ghost">로그인</a>
            <a href="/?auth=login" className="btn-primary">지금 시작하기</a>
          </div>
          <button className="nav-hamburger" id="navHamburger" aria-label="메뉴 열기">
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className="nav-mobile-menu" id="navMobileMenu">
        <nav className="nmm-links">
          <a href="/course2026" className="nmm-link">수강안내</a>
          <a href="/support2026" className="nmm-link">지원서비스</a>
          <a href="/events2026" className="nmm-link">이벤트</a>
          <a href="/events2026/free" className="nmm-link nmm-sublink">└ 무료이벤트</a>
          <a href="/events2026/paid" className="nmm-link nmm-sublink">└ 할인이벤트</a>
          <a href="/blog" className="nmm-link">블로그</a>
        </nav>
        <div className="nmm-cta">
          <a href="/?auth=login" className="nmm-btn-ghost">로그인</a>
          <a href="/?auth=login" className="nmm-btn-primary">지금 시작하기</a>
        </div>
      </div>

      {/* Body — full CoursePage content, offset below fixed nav */}
      <div style={{ paddingTop: 72 }}>
        <CoursePage />
      </div>

      {/* Footer */}
      <footer style={{ minHeight: 'auto', padding: '48px 40px' }}>
        <div className="hero-bg" style={{ position: 'absolute', inset: 0, zIndex: 0 }}></div>
        <div className="footer-inner">
          <div className="footer-bottom" style={{ borderTop: 'none', paddingTop: 0 }}>
            <span>&copy; 2026 AISEO. All rights reserved.</span>
            <div style={{ display: 'flex', gap: 24 }}>
              <a href="#">개인정보처리방침</a>
              <a href="#">이용약관</a>
            </div>
          </div>
          <div className="footer-legal">
            크리다 · 사업자등록번호 231-88-03647 · 충청남도 천안시 서북구 월봉로 126, 9층 901호 C27(쌍용동, 대림프라자) · 개인정보책임자 김경진 <a href="mailto:jin@k-rida.com">jin@k-rida.com</a>
          </div>
        </div>
      </footer>
    </>
  );
}
