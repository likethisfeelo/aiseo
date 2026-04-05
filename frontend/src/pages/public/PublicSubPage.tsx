import { useEffect } from 'react';
import '../landing.css';
import { CoursePage } from './CoursePage';

interface Props {
  pageKey: string;
  title: string;
}

export function PublicSubPage({ pageKey, title }: Props) {
  useEffect(() => {
    // Nav starts scrolled on sub-pages
    const nav = document.getElementById('mainNav');
    nav?.classList.add('scrolled');

    // Mobile hamburger
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
    menu?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

    return () => {
      if (btn) btn.removeEventListener('click', hamburgerHandler);
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <>
      {/* NAV */}
      <nav id="mainNav" className="scrolled">
        <div className="nav-inner">
          <a href="/" className="nav-logo">AISEO</a>
          <div className="nav-links">
            <a href="/#course" className={pageKey === 'course' ? 'active' : ''}>수강안내</a>
            <a href="/#support" className={pageKey === 'support' ? 'active' : ''}>지원서비스</a>
            <a href="/#events" className={pageKey === 'events' ? 'active' : ''}>이벤트</a>
            <a href="/#blog" className={pageKey === 'blog' ? 'active' : ''}>블로그</a>
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
          <a href="/#course" className="nmm-link">수강안내</a>
          <a href="/#support" className="nmm-link">지원서비스</a>
          <a href="/#events" className="nmm-link">이벤트</a>
          <a href="/#blog" className="nmm-link">블로그</a>
        </nav>
        <div className="nmm-cta">
          <a href="/?auth=login" className="nmm-btn-ghost">로그인</a>
          <a href="/?auth=login" className="nmm-btn-primary">지금 시작하기</a>
        </div>
      </div>

      {/* Page content */}
      {pageKey === 'course' ? (
        <CoursePage />
      ) : (
        <div style={{
          minHeight: '80vh',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          paddingTop: 72, padding: '120px 24px 80px',
          textAlign: 'center',
          fontFamily: 'var(--font-ko)',
        }}>
          <div className="section-eyebrow" style={{ textAlign: 'center', marginBottom: 24 }}>
            {pageKey.toUpperCase()}
          </div>
          <h1 style={{
            fontFamily: 'var(--font-ko)',
            fontSize: 'clamp(36px, 5vw, 56px)',
            fontWeight: 800,
            letterSpacing: -2,
            color: 'var(--text-primary)',
            lineHeight: 1.15,
            marginBottom: 32,
          }}>
            {title}
          </h1>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 12,
            background: 'var(--accent-light)',
            border: '1px solid rgba(196,168,245,0.25)',
            borderRadius: 'var(--radius-xl)',
            padding: '20px 40px',
            marginBottom: 40,
          }}>
            <span style={{ fontSize: 28 }}>🚧</span>
            <span style={{
              fontSize: 18, fontWeight: 600,
              color: 'var(--accent-dark)',
              letterSpacing: -0.3,
            }}>
              준비중입니다
            </span>
          </div>
          <p style={{
            fontSize: 15, color: 'var(--text-muted)',
            lineHeight: 1.7, maxWidth: 400,
          }}>
            더 나은 서비스를 위해 준비하고 있습니다.<br />
            빠른 시일 내에 찾아뵙겠습니다.
          </p>
          <a href="/" className="btn-primary" style={{
            marginTop: 40, textDecoration: 'none',
          }}>
            ← 홈으로 돌아가기
          </a>
        </div>
      )}

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
