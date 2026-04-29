import '../landing.css';
import { useSubPageNav } from './useSubPageNav';

/**
 * 할인 이벤트 — `/events2026/paid`
 *
 * Real implementation begins here (replaces the Phase 1 ComingSoon2026
 * placeholder). Source design lives in `docs/events2026-paid (4).html`
 * — a long single-file marketing page for the paid (10만원 × 2) event
 * packages: EVENT 02 (검색 전략 + 배포) and EVENT 03 (콘텐츠 기획 +
 * 배포).
 *
 * Phase 4.1a ships only the page shell + HERO + Footer. Phases 4.1b
 * through 4.4 append: two-package preview, EVENT 02/03 detail with
 * 가격 박스 + core-card expandables, common targets, FAQ accordion,
 * compare cards, LAUNCH CTA with countdown, and the cross-link to
 * /events2026/free.
 *
 * Class naming: every selector specific to this port lives under the
 * `.evtpaid` wrapper so it can't collide with landing.css's `.hero`,
 * `.section-h2`, `.section-eyebrow`, `.section-sub`, etc.; and so it
 * stays separate from the `.evtfree` rules used on the FREE page.
 */
export function Events2026PaidPage() {
  // Shared landing-nav → scrolled transition + mobile hamburger,
  // matches Course2026 / Support2026 / Events2026 / Events2026Free.
  useSubPageNav();

  // CSR-only app, so `window` is always defined at render time.
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const canonicalUrl = `${origin}/events2026/paid`;
  const docTitle =
    'AISEO 2026 런칭 이벤트 — 두 가지 패키지 중 내게 맞는 한 가지를';
  const metaDescription =
    'AISEO 2026 런칭 이벤트 패키지. EVENT 02 검색 전략 / EVENT 03 콘텐츠 기획 — 각각 CORE 1 즉시 배포 포함, 정가 30만원 → 10만원. 자격 검토 없이 누구나 신청 가능, 각 7팀 한정.';

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
        Scoped CSS for the PAID event page. Same wrapper-prefix
        approach as `.evtfree`: every rule sits under `.evtpaid` so
        landing.css's `.hero / .section-h2 / .section-eyebrow /
        .section-sub` are overridden by specificity (0,2,0 > 0,1,0).
        Phase 4.1b–4.4 append more rules below the marker comments.
      */}
      <style>{`
        /* Local design-token additions used by the paid port. */
        .evtpaid {
          --accent-deep: #6B4FB8;
          --bg-dark: #0A0614;
          --bg-dark-2: #14102A;
        }

        /* ── HERO (다크 배경, 별, 프리즘) ── */
        .evtpaid .hero {
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
        .evtpaid .hero-stars {
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
          animation: evtpaidTwinkle 8s ease-in-out infinite;
        }
        @keyframes evtpaidTwinkle {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        .evtpaid .hero-glow {
          position: absolute; left: 50%; top: 50%;
          width: 800px; height: 800px;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle, rgba(196,168,245,0.18) 0%, rgba(196,168,245,0.05) 35%, transparent 70%);
          z-index: 0;
          pointer-events: none;
        }
        .evtpaid .hero-content {
          position: relative; z-index: 2; max-width: 860px;
          width: 100%;
        }
        .evtpaid .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.08); color: #fff;
          font-size: 12px; font-weight: 600; padding: 7px 16px;
          border-radius: 100px;
          border: 1px solid rgba(255,255,255,0.18);
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
          margin-bottom: 28px;
          letter-spacing: .4px;
          opacity: 0; transform: translateY(16px);
          animation: evtpaidFadeUp .6s ease forwards .1s;
        }
        .evtpaid .hero-badge-dot {
          width: 6px; height: 6px;
          background: var(--accent); border-radius: 50%;
          animation: evtpaidPulse 2s infinite;
        }
        @keyframes evtpaidPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .5; transform: scale(0.7); }
        }
        .evtpaid .hero-h1 {
          font-family: var(--font-ko);
          font-size: clamp(40px, 6vw, 72px);
          font-weight: 700;
          line-height: 1.18;
          letter-spacing: -2.5px;
          color: #fff;
          margin-bottom: 28px;
        }
        .evtpaid .hero-h1 .accent-text { color: var(--accent); }
        .evtpaid .hero-h1 .line {
          display: block;
          opacity: 0; transform: translateY(20px);
          animation: evtpaidFadeUp .7s ease forwards;
        }
        .evtpaid .hero-h1 .line:nth-child(1) { animation-delay: .2s; }
        .evtpaid .hero-h1 .line:nth-child(2) { animation-delay: .35s; }
        .evtpaid .hero-h1 .line:nth-child(3) { animation-delay: .5s; }
        .evtpaid .hero-sub {
          font-family: var(--font-ko);
          font-size: 16px; line-height: 1.85;
          color: rgba(255,255,255,0.7);
          max-width: 540px; margin: 0 auto;
          opacity: 0; animation: evtpaidFadeUp .6s ease forwards .7s;
        }

        .evtpaid .hero-prism {
          margin: 56px auto 0;
          width: 220px; height: 220px;
          position: relative;
          opacity: 0; animation: evtpaidFadeUp .8s ease forwards .9s;
        }
        .evtpaid .hero-prism::before {
          content: '';
          position: absolute; inset: -40px;
          background: radial-gradient(circle, rgba(196,168,245,0.35) 0%, transparent 60%);
          filter: blur(20px);
          z-index: 0;
        }
        .evtpaid .prism-svg {
          width: 100%; height: 100%;
          position: relative; z-index: 1;
          animation: evtpaidPrismFloat 8s ease-in-out infinite;
        }
        @keyframes evtpaidPrismFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(2deg); }
        }

        /* video stub card */
        .evtpaid .hero-video {
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
          opacity: 0; animation: evtpaidFadeUp .8s ease forwards 1.1s;
          z-index: 2;
        }
        .evtpaid .hero-video::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(circle at center, rgba(196,168,245,0.1) 0%, transparent 60%);
          pointer-events: none;
        }
        .evtpaid .hero-video-play {
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
        .evtpaid .hero-video-play:hover {
          transform: translate(-50%, -50%) scale(1.08);
          box-shadow: 0 14px 40px rgba(196,168,245,0.4);
        }
        .evtpaid .hero-video-play svg { width: 22px; height: 22px; margin-left: 3px; }
        .evtpaid .hero-video-label {
          position: absolute; bottom: 24px; left: 50%;
          transform: translateX(-50%);
          font-family: var(--font-en);
          font-size: 11px; font-weight: 600;
          color: rgba(255,255,255,0.55);
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        @keyframes evtpaidFadeUp { to { opacity: 1; transform: translateY(0); } }

        /* ── SECTION COMMON (override landing.css's section-* defaults) ── */
        .evtpaid section { padding: 120px 40px; }
        .evtpaid .section-inner { max-width: 1200px; margin: 0 auto; }
        .evtpaid .section-eyebrow {
          font-family: var(--font-en);
          font-size: 12px; font-weight: 600;
          color: var(--accent-dark);
          letter-spacing: 1.5px; text-transform: uppercase;
          margin-bottom: 16px;
          text-align: center;
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .evtpaid .section-eyebrow::before,
        .evtpaid .section-eyebrow::after {
          content: ''; width: 24px; height: 1px;
          background: var(--accent);
          opacity: 0.5;
        }
        .evtpaid .section-h2 {
          font-family: var(--font-ko);
          font-size: clamp(28px, 3.6vw, 42px);
          font-weight: 700; line-height: 1.3;
          letter-spacing: -1.2px;
          color: var(--text-primary);
          text-align: center;
          margin: 0 auto 18px;
          max-width: none;
        }
        .evtpaid .section-h2 .em { color: var(--accent-dark); }
        .evtpaid .section-sub {
          font-family: var(--font-ko);
          font-size: 16px; color: var(--text-secondary);
          line-height: 1.75; text-align: center;
          max-width: 620px; margin: 0 auto;
        }

        /* ── 두 패키지 미리보기 (Benefits) ── */
        .evtpaid .benefits {
          background: var(--bg);
          padding-top: 120px;
          padding-bottom: 60px;
        }
        .evtpaid .benefits-header { margin-bottom: 56px; }
        .evtpaid .benefits-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          max-width: 920px;
          margin: 0 auto;
        }
        .evtpaid .benefit-card {
          background: var(--bg-soft);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 32px 28px;
          position: relative;
          transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
          min-height: 220px;
          display: flex; flex-direction: column;
          text-decoration: none;
          color: inherit;
        }
        .evtpaid .benefit-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
          border-color: rgba(196,168,245,0.3);
        }
        .evtpaid .benefit-card.violet { background: linear-gradient(180deg, #F5EFFF 0%, #FAF6FF 100%); border-color: rgba(196,168,245,0.25); }
        .evtpaid .benefit-card.mint   { background: linear-gradient(180deg, #E8F7F0 0%, #F1FAF6 100%); border-color: rgba(127,200,166,0.25); }
        .evtpaid .benefit-eyebrow {
          font-family: var(--font-en);
          font-size: 10px; font-weight: 700;
          letter-spacing: 1.5px;
          color: var(--text-muted);
          margin-bottom: 18px;
        }
        .evtpaid .benefit-eyebrow .dot {
          display: inline-block; width: 4px; height: 4px;
          border-radius: 50%; background: var(--text-muted);
          margin: 0 8px; vertical-align: middle;
        }
        .evtpaid .benefit-title {
          font-family: var(--font-ko);
          font-size: 20px; font-weight: 700;
          letter-spacing: -.6px;
          margin-bottom: 12px;
          line-height: 1.4;
          color: var(--text-primary);
        }
        .evtpaid .benefit-desc {
          font-size: 13.5px;
          color: var(--text-secondary);
          line-height: 1.7;
          flex: 1;
        }
        .evtpaid .benefit-foot {
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px dashed rgba(0,0,0,0.08);
          font-size: 12px;
          color: var(--text-muted);
          display: flex; align-items: center; gap: 6px;
        }
        .evtpaid .benefit-foot::before {
          content: '→';
          color: var(--accent-dark);
          font-weight: 700;
        }

        @media (max-width: 900px) {
          .evtpaid section { padding: 80px 24px; }
          .evtpaid .hero { padding: 120px 24px 60px; min-height: auto; }
          .evtpaid .hero-prism { width: 160px; height: 160px; }
          .evtpaid .benefits-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 480px) {
          .evtpaid .hero-h1 { letter-spacing: -1.5px; }
          .evtpaid .section-h2 { letter-spacing: -.8px; }
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
                <a href="/events2026/free" role="menuitem">무료이벤트</a>
                <a href="/events2026/paid" className="active" role="menuitem">할인이벤트</a>
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

      <div className="evtpaid">
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
              <span className="line">지금 사장님께 더 필요한</span>
              <span className="line"><span className="accent-text">한 가지를</span> 골라보세요</span>
              <span className="line">합리적인 가격으로</span>
            </h1>
            <p className="hero-sub">
              검색 전략 또는 콘텐츠 기획 중 하나를 선택하시면,<br />
              배포까지 포함한 2단계 패키지로 한 번에 완성해드립니다.
            </p>

            <div className="hero-prism" aria-hidden="true">
              <svg className="prism-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="evtpaidPrismGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#C4A8F5" />
                    <stop offset="50%" stopColor="#9BB8F8" />
                    <stop offset="100%" stopColor="#F5C4E8" />
                  </linearGradient>
                  <linearGradient id="evtpaidPrismGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFD4A8" />
                    <stop offset="100%" stopColor="#C4A8F5" />
                  </linearGradient>
                  <linearGradient id="evtpaidPrismGrad3" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#9BB8F8" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#6B4FB8" stopOpacity="0.6" />
                  </linearGradient>
                </defs>
                <polygon points="100,30 160,90 130,160 70,160 40,90" fill="url(#evtpaidPrismGrad1)" opacity="0.85" />
                <polygon points="100,30 160,90 100,100" fill="url(#evtpaidPrismGrad2)" opacity="0.7" />
                <polygon points="100,100 160,90 130,160" fill="url(#evtpaidPrismGrad3)" opacity="0.8" />
                <polygon points="100,100 130,160 70,160" fill="url(#evtpaidPrismGrad1)" opacity="0.6" />
                <polygon points="100,100 70,160 40,90" fill="url(#evtpaidPrismGrad2)" opacity="0.5" />
                <polygon points="100,30 100,100 40,90" fill="url(#evtpaidPrismGrad3)" opacity="0.7" />
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

        {/* ── 두 패키지 미리보기 ── */}
        <section className="benefits">
          <div className="section-inner">
            <div className="benefits-header">
              <div className="section-eyebrow">두 가지 옵션</div>
              <h2 className="section-h2">
                시작점이 다른<br /><span className="em">두 가지 패키지</span>
              </h2>
              <p className="section-sub" style={{ marginTop: 14 }}>
                둘 다 같은 결과(검색 노출되는 사이트)로 끝나지만, 출발점이 다릅니다.<br />
                사장님 상황에 맞는 한 가지를 선택하시면 됩니다.
              </p>
            </div>

            <div className="benefits-grid">
              <a href="#event02" className="benefit-card violet">
                <div className="benefit-eyebrow">EVENT 02 <span className="dot"></span> PACKAGE A</div>
                <h3 className="benefit-title">🎯 검색 전략부터</h3>
                <p className="benefit-desc">키워드 · 경쟁군 · 검색 의도를 먼저 정리하고, 그 위에 사이트를 올립니다.</p>
                <div className="benefit-foot">001 + CORE1 · 30만원 → 10만원</div>
              </a>

              <a href="#event03" className="benefit-card mint">
                <div className="benefit-eyebrow">EVENT 03 <span className="dot"></span> PACKAGE B</div>
                <h3 className="benefit-title">✍️ 콘텐츠 기획부터</h3>
                <p className="benefit-desc">메뉴 구조 · 서비스 설명 · CTA · 톤앤매너를 먼저 설계하고 사이트를 올립니다.</p>
                <div className="benefit-foot">002 + CORE1 · 30만원 → 10만원</div>
              </a>
            </div>
          </div>
        </section>

        {/* Phases 4.2–4.4 will append EVENT 02/03 details, common
            targets, FAQ, compare cards, LAUNCH CTA, and cross-link. */}

        {/* Footer placeholder so the page closes cleanly between phases. */}
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
