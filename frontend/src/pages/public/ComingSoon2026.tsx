import '../landing.css';
import { useSubPageNav } from './useSubPageNav';

/**
 * Shared "준비중" shell for the 2026 marketing sub-pages
 * (/course2026, /support2026, /events2026).
 *
 * Wraps each page with the landing nav + footer so the full-bleed
 * navigation and brand chrome are consistent. Each page file is a
 * thin wrapper that calls this with its own title/eyebrow so the
 * individual files can later diverge when real content is filled in.
 *
 * `activeMenu` drives the nav link underline on the matching
 * menu item. SEO/OG meta tags are rendered as React 19 native
 * head metadata (tags rendered here are auto-hoisted into
 * `<head>`), matching the pattern used in BlogPostPage. No
 * react-helmet needed.
 */

export type Nav2026Key = 'course' | 'support' | 'events';

interface Props {
  activeMenu: Nav2026Key;
  eyebrow: string;
  title: string;
  /** `<title>` tag value. Shown in the browser tab and SERP. */
  docTitle: string;
  /** `<meta name="description">` + og:description + twitter:description. */
  metaDescription: string;
  /** Path portion of the canonical URL, e.g. "/course2026". */
  canonicalPath: string;
  /** Absolute og:image URL. Optional — summary card falls back to `summary` when absent. */
  ogImage?: string;
  /** Body paragraph under the "준비중" card. Defaults to a generic message. */
  description?: string;
}

export function ComingSoon2026({
  activeMenu,
  eyebrow,
  title,
  docTitle,
  metaDescription,
  canonicalPath,
  ogImage,
  description,
}: Props) {
  // Shared landing-nav → scrolled transition + mobile hamburger.
  useSubPageNav();

  // CSR-only app, so `window` is always defined at render time.
  // Canonical / og:url must be absolute so social crawlers resolve them.
  const origin =
    typeof window !== 'undefined' ? window.location.origin : '';
  const canonicalUrl = `${origin}${canonicalPath}`;

  return (
    <>
      {/*
        React 19 native head metadata — rendering <title> / <meta> /
        <link> inside a component auto-hoists them into <head>. Same
        pattern used by BlogPostPage; no react-helmet required.
      */}
      <title>{docTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="AISEO" />
      <meta property="og:title" content={docTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={canonicalUrl} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta
        name="twitter:card"
        content={ogImage ? 'summary_large_image' : 'summary'}
      />
      <meta name="twitter:title" content={docTitle} />
      <meta name="twitter:description" content={metaDescription} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {/* NAV */}
      <nav id="mainNav" className="landing-nav">
        <div className="nav-inner">
          <a href="/" className="nav-logo">AISEO</a>
          <div className="nav-links">
            <a href="/course2026" className={activeMenu === 'course' ? 'active' : ''}>수강안내</a>
            <a href="/support2026" className={activeMenu === 'support' ? 'active' : ''}>지원서비스</a>
            <a href="/events2026" className={activeMenu === 'events' ? 'active' : ''}>이벤트</a>
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
          <a href="/blog" className="nmm-link">블로그</a>
        </nav>
        <div className="nmm-cta">
          <a href="/?auth=login" className="nmm-btn-ghost">로그인</a>
          <a href="/?auth=login" className="nmm-btn-primary">지금 시작하기</a>
        </div>
      </div>

      {/* Body — 준비중 placeholder */}
      <div
        style={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '120px 24px 80px',
          textAlign: 'center',
          fontFamily: 'var(--font-ko)',
        }}
      >
        <div className="section-eyebrow" style={{ textAlign: 'center', marginBottom: 24 }}>
          {eyebrow}
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-ko)',
            fontSize: 'clamp(36px, 5vw, 56px)',
            fontWeight: 800,
            letterSpacing: -2,
            color: 'var(--text-primary)',
            lineHeight: 1.15,
            marginBottom: 32,
          }}
        >
          {title}
        </h1>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            background: 'var(--accent-light)',
            border: '1px solid rgba(196,168,245,0.25)',
            borderRadius: 'var(--radius-xl)',
            padding: '20px 40px',
            marginBottom: 40,
          }}
        >
          <span style={{ fontSize: 28 }}>🚧</span>
          <span
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: 'var(--accent-dark)',
              letterSpacing: -0.3,
            }}
          >
            준비중입니다
          </span>
        </div>
        <p
          style={{
            fontSize: 15,
            color: 'var(--text-muted)',
            lineHeight: 1.7,
            maxWidth: 440,
          }}
        >
          {description || (
            <>
              더 나은 서비스를 위해 준비하고 있습니다.<br />
              빠른 시일 내에 찾아뵙겠습니다.
            </>
          )}
        </p>
        <a
          href="/"
          className="btn-primary"
          style={{ marginTop: 40, textDecoration: 'none' }}
        >
          ← 홈으로 돌아가기
        </a>
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
        </div>
      </footer>
    </>
  );
}
