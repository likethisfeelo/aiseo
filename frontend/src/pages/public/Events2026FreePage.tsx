import '../landing.css';
import { useSubPageNav } from './useSubPageNav';

/**
 * 무료 이벤트 — `/events2026/free`
 *
 * Real implementation begins here (replaces the Phase 1 ComingSoon2026
 * placeholder). Source design lives in `docs/aiseo-events-2026 (17).html`
 * — a long single-file marketing page for the FREE 런칭 파트너 event.
 *
 * Phase 3.1 ships only the page shell + HERO + Footer. Phases 3.2–3.4
 * append the 3-Benefits grid, the EVENT 01 sections (FREE BUNDLE,
 * targets/stats, scroll-step blocks, results+CTA), and the CROSS-LINK
 * to /events2026/paid, plus the JS interactions (core-card toggle,
 * free-card auto-flip, scroll-step phase animation).
 *
 * Class naming: every selector specific to this port lives under the
 * `.evtfree` wrapper so it can't collide with landing.css's `.hero`,
 * `.section-h2`, `.section-eyebrow`, `.section-sub`, etc.
 */
export function Events2026FreePage() {
  // Shared landing-nav → scrolled transition + mobile hamburger,
  // matches Course2026 / Support2026 / Events2026.
  useSubPageNav();

  // CSR-only app, so `window` is always defined at render time.
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const canonicalUrl = `${origin}/events2026/free`;
  const docTitle =
    'AISEO 2026 런칭 이벤트 — 먼저 만나고, 함께 만들고, 한 발 앞서 시작하세요';
  const metaDescription =
    'AISEO 2026 무료 런칭 파트너 이벤트. AI 홈페이지 제작 + 도메인·호스팅 + SEO 핵심강의 — 정가 30만원 → 0원. 선착순 3팀, 자격 검토 후 1:1 코칭.';

  return (
    <>
      {/* React 19 native head metadata. */}
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

      {/*
        Scoped CSS for the FREE event page. Every rule is written
        under `.evtfree` so it overrides landing.css's `.hero`,
        `.section-h2`, etc. (specificity 0,2,0 > 0,1,0). Future
        phases append more rules below the marker comments.
      */}
      <style>{`
        /* Local design-token additions used by the events.html port. */
        .evtfree {
          --accent-deep: #6B4FB8;
          --bg-dark: #0A0614;
          --bg-dark-2: #14102A;
        }

        /* ── HERO (다크 배경, 별, 프리즘) ── */
        .evtfree .hero {
          all: unset;
          display: flex; align-items: center; justify-content: center;
          flex-direction: column;
          position: relative;
          min-height: 92vh;
          padding: 140px 40px 80px;
          background: radial-gradient(ellipse at top, #1A1235 0%, #0A0614 60%, #050309 100%);
          overflow: hidden;
          text-align: center;
          box-sizing: border-box;
          width: 100%;
        }
        .evtfree .hero-stars {
          position: absolute; inset: 0; z-index: 0;
          background-image:
            radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.8), transparent),
            radial-gradient(1px 1px at 60% 20%, rgba(196,168,245,0.7), transparent),
            radial-gradient(1.5px 1.5px at 40% 70%, rgba(255,255,255,0.6), transparent),
            radial-gradient(1px 1px at 80% 50%, rgba(155,184,248,0.7), transparent),
            radial-gradient(1px 1px at 15% 85%, rgba(255,255,255,0.5), transparent),
            radial-gradient(1.5px 1.5px at 90% 80%, rgba(196,168,245,0.6), transparent),
            radial-gradient(1px 1px at 35% 15%, rgba(255,255,255,0.7), transparent),
            radial-gradient(1px 1px at 70% 90%, rgba(155,184,248,0.5), transparent),
            radial-gradient(1.2px 1.2px at 50% 50%, rgba(255,255,255,0.4), transparent),
            radial-gradient(1px 1px at 25% 65%, rgba(196,168,245,0.5), transparent);
          background-size: 100% 100%;
          animation: evtfreeTwinkle 8s ease-in-out infinite;
        }
        @keyframes evtfreeTwinkle {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        .evtfree .hero-glow {
          position: absolute; left: 50%; top: 50%;
          width: 800px; height: 800px;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle, rgba(196,168,245,0.18) 0%, rgba(196,168,245,0.05) 35%, transparent 70%);
          z-index: 0;
          pointer-events: none;
        }
        .evtfree .hero-content {
          position: relative; z-index: 2; max-width: 860px;
          width: 100%;
        }
        .evtfree .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.08); color: #fff;
          font-size: 12px; font-weight: 600; padding: 7px 16px;
          border-radius: 100px;
          border: 1px solid rgba(255,255,255,0.18);
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
          margin-bottom: 28px;
          letter-spacing: .4px;
          opacity: 0; transform: translateY(16px);
          animation: evtfreeFadeUp .6s ease forwards .1s;
        }
        .evtfree .hero-badge-dot {
          width: 6px; height: 6px;
          background: var(--accent); border-radius: 50%;
          animation: evtfreePulse 2s infinite;
        }
        @keyframes evtfreePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .5; transform: scale(0.7); }
        }
        .evtfree .hero-h1 {
          font-family: var(--font-ko);
          font-size: clamp(40px, 6vw, 72px);
          font-weight: 700;
          line-height: 1.18;
          letter-spacing: -2.5px;
          color: #fff;
          margin-bottom: 28px;
        }
        .evtfree .hero-h1 .accent-text { color: var(--accent); }
        .evtfree .hero-h1 .line {
          display: block;
          opacity: 0; transform: translateY(20px);
          animation: evtfreeFadeUp .7s ease forwards;
        }
        .evtfree .hero-h1 .line:nth-child(1) { animation-delay: .2s; }
        .evtfree .hero-h1 .line:nth-child(2) { animation-delay: .35s; }
        .evtfree .hero-h1 .line:nth-child(3) { animation-delay: .5s; }
        .evtfree .hero-sub {
          font-family: var(--font-ko);
          font-size: 16px; line-height: 1.85;
          color: rgba(255,255,255,0.7);
          max-width: 540px; margin: 0 auto;
          opacity: 0; animation: evtfreeFadeUp .6s ease forwards .7s;
        }

        .evtfree .hero-prism {
          margin: 56px auto 0;
          width: 220px; height: 220px;
          position: relative;
          opacity: 0; animation: evtfreeFadeUp .8s ease forwards .9s;
        }
        .evtfree .hero-prism::before {
          content: '';
          position: absolute; inset: -40px;
          background: radial-gradient(circle, rgba(196,168,245,0.35) 0%, transparent 60%);
          filter: blur(20px);
          z-index: 0;
        }
        .evtfree .prism-svg {
          width: 100%; height: 100%;
          position: relative; z-index: 1;
          animation: evtfreePrismFloat 8s ease-in-out infinite;
        }
        @keyframes evtfreePrismFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(2deg); }
        }

        /* video card */
        .evtfree .hero-video {
          margin: 80px auto 0;
          max-width: 880px;
          background: rgba(20, 16, 42, 0.6);
          border: 1px solid rgba(196,168,245,0.18);
          border-radius: var(--radius-xl);
          aspect-ratio: 16/9;
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          box-shadow: 0 30px 80px rgba(196,168,245,0.15), 0 10px 30px rgba(0,0,0,0.3);
          opacity: 0; animation: evtfreeFadeUp .8s ease forwards 1.1s;
          z-index: 2;
        }
        .evtfree .hero-video::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(circle at center, rgba(196,168,245,0.1) 0%, transparent 60%);
          pointer-events: none;
        }
        .evtfree .hero-video-play {
          position: absolute; left: 50%; top: 50%;
          transform: translate(-50%, -50%);
          width: 64px; height: 64px;
          border-radius: 50%;
          background: rgba(255,255,255,0.95);
          border: none;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          transition: transform .2s, box-shadow .2s;
        }
        .evtfree .hero-video-play:hover {
          transform: translate(-50%, -50%) scale(1.08);
          box-shadow: 0 14px 40px rgba(196,168,245,0.4);
        }
        .evtfree .hero-video-play svg { width: 22px; height: 22px; margin-left: 3px; }
        .evtfree .hero-video-label {
          position: absolute; bottom: 24px; left: 50%;
          transform: translateX(-50%);
          font-family: var(--font-en);
          font-size: 11px; font-weight: 600;
          color: rgba(255,255,255,0.55);
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        @keyframes evtfreeFadeUp { to { opacity: 1; transform: translateY(0); } }

        /* ── SECTION COMMON (override landing.css's section-* defaults) ── */
        .evtfree section { padding: 120px 40px; }
        .evtfree .section-inner { max-width: 1200px; margin: 0 auto; }
        .evtfree .section-eyebrow {
          font-family: var(--font-en);
          font-size: 12px; font-weight: 600;
          color: var(--accent-dark);
          letter-spacing: 1.5px; text-transform: uppercase;
          margin-bottom: 16px;
          text-align: center;
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .evtfree .section-eyebrow::before,
        .evtfree .section-eyebrow::after {
          content: ''; width: 24px; height: 1px;
          background: var(--accent);
          opacity: 0.5;
        }
        .evtfree .section-h2 {
          font-family: var(--font-ko);
          font-size: clamp(28px, 3.6vw, 42px);
          font-weight: 700; line-height: 1.3;
          letter-spacing: -1.2px;
          color: var(--text-primary);
          text-align: center;
          margin: 0 auto 18px;
          max-width: none;
        }
        .evtfree .section-h2 .em { color: var(--accent-dark); }
        .evtfree .section-sub {
          font-family: var(--font-ko);
          font-size: 16px; color: var(--text-secondary);
          line-height: 1.75; text-align: center;
          max-width: 620px; margin: 0 auto;
        }

        @media (max-width: 900px) {
          .evtfree section { padding: 80px 24px; }
          .evtfree .hero { padding: 120px 24px 60px; min-height: auto; }
          .evtfree .hero-prism { width: 160px; height: 160px; }
        }
        @media (max-width: 480px) {
          .evtfree .hero-h1 { letter-spacing: -1.5px; }
          .evtfree .section-h2 { letter-spacing: -.8px; }
        }
      `}</style>

      {/* NAV — landing-style, with the Phase 1 events dropdown. */}
      <nav id="mainNav" className="landing-nav">
        <div className="nav-inner">
          <a href="/" className="nav-logo">AISEO</a>
          <div className="nav-links">
            <a href="/course2026">수강안내</a>
            <a href="/support2026">지원서비스</a>
            <div className="nav-item-has-sub">
              <a href="/events2026" className="active">이벤트</a>
              <div className="nav-submenu" role="menu">
                <a href="/events2026/free" className="active" role="menuitem">무료이벤트</a>
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

      <div className="evtfree">
        {/* ── HERO ── */}
        <section className="hero">
          <div className="hero-stars" aria-hidden="true"></div>
          <div className="hero-glow" aria-hidden="true"></div>
          <div className="hero-content">
            <div className="hero-badge">
              <span className="hero-badge-dot" aria-hidden="true"></span>
              <span>EVENTS 2026 · AISEO.TIPS</span>
            </div>
            <h1 className="hero-h1">
              <span className="line">먼저 만나고,</span>
              <span className="line"><span className="accent-text">함께 만들고,</span></span>
              <span className="line">한 발 앞서 시작하세요</span>
            </h1>
            <p className="hero-sub">
              AISEO 수강생과 함께하는 2026 런칭 · 오프라인 세션 · 한정 프로<br />
              모션. AI 사이트와 검색 노출을 실제로 끌어내는 자리를 가장 먼저 안내해드립니다.
            </p>

            <div className="hero-prism" aria-hidden="true">
              <svg className="prism-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="evtfreePrismGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#C4A8F5" />
                    <stop offset="50%" stopColor="#9BB8F8" />
                    <stop offset="100%" stopColor="#F5C4E8" />
                  </linearGradient>
                  <linearGradient id="evtfreePrismGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFD4A8" />
                    <stop offset="100%" stopColor="#C4A8F5" />
                  </linearGradient>
                  <linearGradient id="evtfreePrismGrad3" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#9BB8F8" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#6B4FB8" stopOpacity="0.6" />
                  </linearGradient>
                </defs>
                <polygon points="100,30 160,90 130,160 70,160 40,90" fill="url(#evtfreePrismGrad1)" opacity="0.85" />
                <polygon points="100,30 160,90 100,100" fill="url(#evtfreePrismGrad2)" opacity="0.7" />
                <polygon points="100,100 160,90 130,160" fill="url(#evtfreePrismGrad3)" opacity="0.8" />
                <polygon points="100,100 130,160 70,160" fill="url(#evtfreePrismGrad1)" opacity="0.6" />
                <polygon points="100,100 70,160 40,90" fill="url(#evtfreePrismGrad2)" opacity="0.5" />
                <polygon points="100,30 100,100 40,90" fill="url(#evtfreePrismGrad3)" opacity="0.7" />
                <line x1="100" y1="30" x2="100" y2="100" stroke="#fff" strokeWidth="0.5" opacity="0.4" />
                <line x1="100" y1="100" x2="160" y2="90" stroke="#fff" strokeWidth="0.5" opacity="0.3" />
                <line x1="100" y1="100" x2="40" y2="90" stroke="#fff" strokeWidth="0.5" opacity="0.3" />
              </svg>
            </div>

            <div className="hero-video">
              <button type="button" className="hero-video-play" aria-label="이벤트 영상 재생">
                <svg viewBox="0 0 24 24" fill="#0A0614" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
              <div className="hero-video-label">AISEO.TIPS 이벤트 영상 · 1분</div>
            </div>
          </div>
        </section>

        {/* Phase 3.2–3.4 will append the 3 Benefits / EVENT 01 / CROSS-LINK
            sections here, between the hero and the footer. */}

        {/* Footer — matches the other 2026 pages so the page closes cleanly
            even at the partial-port stage. */}
        <footer style={{ minHeight: 'auto', padding: '48px 40px', background: 'var(--bg-dark)', color: 'rgba(255,255,255,0.6)' }}>
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
      </div>
    </>
  );
}
