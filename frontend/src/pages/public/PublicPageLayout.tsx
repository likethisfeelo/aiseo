import { useEffect } from 'react';
import '../landing.css';

interface Props {
  children: React.ReactNode;
}

export function PublicPageLayout({ children }: Props) {
  useEffect(() => {
    // Nav scroll behavior
    const nav = document.getElementById('mainNav');
    const scrollHandler = () => {
      if (window.scrollY > 20) nav?.classList.add('scrolled');
      else nav?.classList.remove('scrolled');
    };
    window.addEventListener('scroll', scrollHandler, { passive: true } as EventListenerOptions);
    // Trigger immediately for sub-pages (start scrolled)
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
      window.removeEventListener('scroll', scrollHandler);
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
            <a href="/course">수강안내</a>
            <a href="/support">지원서비스</a>
            <a href="/events">이벤트</a>
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
          <a href="/course" className="nmm-link">수강안내</a>
          <a href="/support" className="nmm-link">지원서비스</a>
          <a href="/events" className="nmm-link">이벤트</a>
          <a href="/blog" className="nmm-link">블로그</a>
        </nav>
        <div className="nmm-cta">
          <a href="/?auth=login" className="nmm-btn-ghost">로그인</a>
          <a href="/?auth=login" className="nmm-btn-primary">지금 시작하기</a>
        </div>
      </div>

      {/* Page content */}
      <div style={{ paddingTop: 80 }}>
        {children}
      </div>

      {/* Minimal footer */}
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
