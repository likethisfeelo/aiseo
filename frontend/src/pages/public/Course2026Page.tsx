import { useEffect } from 'react';
import '../landing.css';
import { CoursePage } from './CoursePage';
import { useSubPageNav } from './useSubPageNav';

/**
 * 수강안내 2026 — `/course2026`
 *
 * Top-of-page sections:
 *   1. Landing hero (image 1) — 동일 카피/배경.
 *   2. "온라인마케팅의 시작 AISEO.TIPS" — 랜딩의 sf-card 마크업을
 *      재사용하되 상위 3장(AI 홈페이지 제작 · 도메인 & 호스팅 · SEO 핵심강의)
 *      만 렌더링하고, 스크롤 스냅/sticky 이펙트는 꺼서 일반 컬럼으로
 *      길게 늘어놓는다 (image 2).
 *   3. 랜딩 "핵심 진입 서비스" 다크 섹션 (image 5) —
 *      "AI로 만든 홈페이지, 오늘 바로 공개하세요" entry-section 그대로,
 *      랜딩 공통의 마우스 팔로우 블롭 이펙트도 함께 유지.
 *
 * 아래 본문은 CoursePage.tsx 를 그대로 임베드해서 image 3(aiv5-hero —
 * Instructor 카드 포함) + image 4 (Step 1 맞춤형 진단) 을 보여준다.
 * CoursePage 의 나머지 섹션(#modules / #services / #packages / 최종
 * aiv5-cta-section / 하단 inquiry bar) 은 스코프된 CSS 로 숨겨서
 * 수강안내 페이지에서는 보이지 않게 만든다.
 *
 * 블롭 마우스 이펙트는 LandingPage 의 useEffect 에서 이식한 축소판
 * (palette fader 없이 커서 따라다니는 radial gradient 3-stack) 이다.
 */
export function Course2026Page() {
  // Shared landing-nav → scrolled transition + mobile hamburger.
  useSubPageNav();

  useEffect(() => {
    // ── Mouse gradient blob (from LandingPage) ──
    // Three layered radial gradients that lazily follow the cursor.
    // Pure cosmetic, ignored on touch devices (no mousemove events).
    const CONFIGS = [
      { size: 600, blur: 38, alphaScale: 1.0, lerp: 0.055 },
      { size: 460, blur: 52, alphaScale: 0.55, lerp: 0.034 },
      { size: 320, blur: 62, alphaScale: 0.28, lerp: 0.018 },
    ];
    const PALETTES = [
      ['rgba(167,139,250,0.56)', 'rgba(196,181,253,0.36)', 'rgba(155,184,248,0.24)', 'rgba(196,168,245,0.12)'],
      ['rgba(134,239,172,0.44)', 'rgba(167,243,208,0.28)', 'rgba(52,211,153,0.16)', 'rgba(16,185,129,0.08)'],
      ['rgba(253,186,116,0.44)', 'rgba(254,215,170,0.28)', 'rgba(251,146,60,0.16)', 'rgba(234,88,12,0.08)'],
      ['rgba(249,168,212,0.48)', 'rgba(252,207,232,0.30)', 'rgba(236,72,153,0.16)', 'rgba(219,39,119,0.08)'],
      ['rgba(147,197,253,0.48)', 'rgba(191,219,254,0.30)', 'rgba(59,130,246,0.16)', 'rgba(37,99,235,0.08)'],
    ];
    const makeGradient = (p: string[], scale: number) => {
      const s = (rgba: string) =>
        rgba.replace(/([\d.]+)\)$/, (_, a) =>
          Math.min(parseFloat(a) * scale, 1).toFixed(2) + ')',
        );
      return `radial-gradient(circle at center, ${s(p[0])} 0%, ${s(p[1])} 22%, ${s(p[2])} 45%, ${s(p[3])} 62%, transparent 78%)`;
    };
    let paletteIdx = 0;
    let lastSwitch = 0;
    const blobs = CONFIGS.map((cfg) => {
      const el = document.createElement('div');
      Object.assign(el.style, {
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: '0',
        width: cfg.size + 'px',
        height: cfg.size + 'px',
        borderRadius: '50%',
        transform: 'translate(-50%, -50%)',
        filter: `blur(${cfg.blur}px)`,
        mixBlendMode: 'normal',
        transition: 'opacity 0.7s ease',
        opacity: '0',
        left: '0',
        top: '0',
        willChange: 'left, top',
      });
      document.body.appendChild(el);
      return { el, x: innerWidth / 2, y: innerHeight / 2, cfg };
    });
    const applyPalette = () => {
      const p = PALETTES[paletteIdx];
      blobs.forEach((b) => {
        b.el.style.background = makeGradient(p, b.cfg.alphaScale);
      });
    };
    applyPalette();
    let mouseX = innerWidth / 2;
    let mouseY = innerHeight / 2;
    let blobVisible = false;
    const mouseMoveHandler = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!blobVisible) {
        blobVisible = true;
        blobs.forEach((b) => (b.el.style.opacity = '1'));
      }
    };
    const mouseLeaveHandler = () => {
      blobVisible = false;
      blobs.forEach((b) => (b.el.style.opacity = '0'));
    };
    document.addEventListener('mousemove', mouseMoveHandler, { passive: true });
    document.addEventListener('mouseleave', mouseLeaveHandler);

    let blobRaf = 0;
    const tick = (now: number) => {
      blobRaf = requestAnimationFrame(tick);
      if (now - lastSwitch > 3000) {
        paletteIdx = (paletteIdx + 1) % PALETTES.length;
        lastSwitch = now;
        applyPalette();
      }
      let targetX = mouseX;
      let targetY = mouseY;
      blobs.forEach((b) => {
        b.x += (targetX - b.x) * b.cfg.lerp;
        b.y += (targetY - b.y) * b.cfg.lerp;
        b.el.style.left = b.x.toFixed(1) + 'px';
        b.el.style.top = b.y.toFixed(1) + 'px';
        targetX = b.x;
        targetY = b.y;
      });
    };
    blobRaf = requestAnimationFrame(tick);

    return () => {
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseleave', mouseLeaveHandler);
      cancelAnimationFrame(blobRaf);
      blobs.forEach((b) => b.el.remove());
    };
  }, []);

  // CSR-only app, so `window` is always defined at render time.
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const canonicalUrl = `${origin}/course2026`;
  const docTitle = '수강안내 2026 | AISEO';
  const metaDescription =
    'AISEO 2026 수강안내. AI 홈페이지 제작 · 도메인 & 호스팅 · SEO 핵심강의 3가지 트랙과 맞춤형 진단을 한 페이지에서 확인하세요.';

  return (
    <>
      {/* React 19 hoisted head metadata */}
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
        Scoped CSS overrides:
        - `.cp2026-features` renders the sf-card markup as a non-sticky
          vertical stack (sf-section's 500vh height + sticky are disabled).
        - `.cp2026-course-wrap` hides CoursePage sections we don't want on
          /course2026 (modules / services / packages / final CTA / inquiry
          bar). The hero (`.aiv5-hero`) and Step 1 `#diagnosis` stay visible.
      */}
      <style>{`
        .cp2026-features {
          padding: 80px 40px 60px;
          position: relative;
          z-index: 1;
          background: transparent;
        }
        .cp2026-features-head {
          text-align: center;
          max-width: 720px;
          margin: 0 auto 36px;
        }
        .cp2026-features-head .sf-title {
          font-size: 36px;
          font-weight: 700;
          letter-spacing: -1.5px;
          line-height: 1.2;
          color: var(--text-primary);
          margin: 8px 0;
        }
        .cp2026-features-head .sf-sub {
          font-size: 16px;
          color: var(--text-secondary);
          line-height: 1.6;
        }
        .cp2026-features-stack {
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        /* Force every sf-card open (no sticky/accordion dependency). */
        .cp2026-features-stack .sf-card {
          height: auto !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
          border-color: rgba(0,0,0,0.08);
          background: var(--bg-card);
        }
        .cp2026-features-stack .sf-card-hd {
          cursor: default;
          height: 56px;
        }
        .cp2026-features-stack .sf-card-hd::after {
          display: none;
        }
        .cp2026-features-stack .sf-card-bd {
          opacity: 1 !important;
          height: auto !important;
          display: grid;
          grid-template-columns: 1fr 1fr;
          overflow: visible;
          transition: none;
        }
        @media (max-width: 900px) {
          .cp2026-features { padding: 56px 20px 40px; }
          .cp2026-features-head .sf-title { font-size: 26px; }
          .cp2026-features-stack .sf-card-bd { grid-template-columns: 1fr; }
          .cp2026-features-stack .sf-card-img { display: none; }
        }

        /* Hero: fit exactly in 100vh on 1920×1080, image top-aligned */
        .hero {
          height: 90vh;
          min-height: unset;
          padding-bottom: 40px;
          overflow: hidden;
        }
        .hero-bg {
          background-position: top center !important;
        }

        /* Hide CoursePage sub-sections not needed on /course2026. */
        .cp2026-course-wrap #modules,
        .cp2026-course-wrap #services,
        .cp2026-course-wrap #packages,
        .cp2026-course-wrap .aiv5-cta-section,
        .cp2026-course-wrap .aiv5-inq-bar {
          display: none !important;
        }

        /*
          Solid backgrounds for aiv5-hero and #diagnosis so the mouse
          blob effect stays behind them instead of bleeding through the
          translucent .aiv5-hero-left / .aiv5-hero-right and the bare
          diagnosis section. Matches the opaque card treatment the
          sf-cards above already have.
        */
        .cp2026-course-wrap { position: relative; z-index: 1; }
        .cp2026-course-wrap .aiv5-hero-left,
        .cp2026-course-wrap .aiv5-hero-right {
          background: #ffffff;
        }
        .cp2026-course-wrap .aiv5-section#diagnosis {
          background: #ffffff;
          border: 1px solid #E5E7EB;
          border-radius: 28px;
          padding: 40px 36px;
          box-shadow: 0 8px 24px rgba(10,6,20,0.07), 0 2px 6px rgba(10,6,20,0.04);
        }
        @media (max-width: 900px) {
          .cp2026-course-wrap .aiv5-section#diagnosis {
            padding: 28px 20px;
            border-radius: 22px;
          }
        }
      `}</style>

      {/* NAV */}
      <nav id="mainNav" className="landing-nav">
        <div className="nav-inner">
          <a href="/" className="nav-logo">AISEO</a>
          <div className="nav-links">
            <a href="/course2026" className="active">수강안내</a>
            <a href="/support2026">지원서비스</a>
            <a href="/events2026">이벤트</a>
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

      {/* ══ SECTION 1 — HERO (랜딩 동일) ══ */}
      <section className="hero" id="hero">
        <div className="hero-bg"></div>
        <div className="hero-noise"></div>
        <div className="hero-grid"></div>
        <div className="hero-content">
          <div className="hero-badge">
            <div className="hero-badge-dot"></div>
            AI시대에 맞는 소상공인들을 위한 AISEO.TIPS
          </div>
          <h1 className="hero-h1">
            <span className="word w1">AI로 만들고,</span><br />
            <span className="word w2 accent-text">검색에 올리고,</span><br />
            <span className="word w3">온라인 마케팅을 시작하세요</span>
          </h1>
          <p className="hero-sub">
            AI로 원하는 사이트를 만들고, 10년 전문가의 핵심 SEO 노하우로 검색엔진에서 쉽게 찾아지도록 만들어드립니다.
          </p>
          <div className="hero-mobile-cta">
            <a href="/?auth=signup" className="hero-mobile-btn-primary">수강신청하기 →</a>
          </div>
        </div>
      </section>

      {/* ══ SECTION 2 — 온라인마케팅의 시작 (상위 3개 카드, 스크롤 이펙트 없음) ══ */}
      <section className="cp2026-features">
        <div className="cp2026-features-head">
          <div className="section-eyebrow">ALL-IN-ONE PLATFORM</div>
          <h2 className="sf-title">온라인마케팅의 시작 AISEO.TIPS</h2>
          <p className="sf-sub">시작부터 분석까지 AISEO에서 모두 함께 시작하세요.</p>
        </div>
        <div className="cp2026-features-stack">
          {/* Card 0: AI 홈페이지 제작 */}
          <div className="sf-card">
            <div className="sf-card-hd">
              <span className="sf-dot" style={{ background: '#C4A8F5', boxShadow: '0 0 0 3px rgba(196,168,245,0.15)' }}></span>
              <span className="sf-label">AI 홈페이지 제작</span>
              <span className="sf-hd-sub">내 비즈니스에 맞는 사이트를 AI로</span>
            </div>
            <div className="sf-card-bd">
              <div className="sf-card-text">
                <h3>프롬프트 하나로<br />내 사이트가 완성됩니다</h3>
                <p>AI 홈페이지 제작 프롬프트 &amp; 템플릿을 제공합니다. 내 비즈니스에 맞는 사이트를 만드는 비법을 쉽고 빠르게 익히고 바로 적용하세요.</p>
                <ul className="sf-feature-list">
                  <li className="sf-feature-item"><div className="sf-check" style={{ background: '#F0EBFF', color: '#8B6FD4' }}>✓</div><span>업종별 AI 프롬프트 템플릿 제공</span></li>
                  <li className="sf-feature-item"><div className="sf-check" style={{ background: '#F0EBFF', color: '#8B6FD4' }}>✓</div><span>ChatGPT · Claude로 페이지 즉시 생성</span></li>
                  <li className="sf-feature-item"><div className="sf-check" style={{ background: '#F0EBFF', color: '#8B6FD4' }}>✓</div><span>모바일/PC 반응형 자동 적용</span></li>
                  <li className="sf-feature-item"><div className="sf-check" style={{ background: '#F0EBFF', color: '#8B6FD4' }}>✓</div><span>비개발자도 1시간 안에 완성</span></li>
                </ul>
              </div>
              <div className="sf-card-img" style={{ '--card-bg1': '#F0EBFF', '--card-bg2': '#EBE4FF' } as React.CSSProperties}>
                <div className="sf-img-placeholder">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#C4A8F5" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8 12h8M8 8h4" /><circle cx="17" cy="17" r="3" /><path d="M19.5 19.5L22 22" /></svg>
                  <span>이미지 영역</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 1: 도메인 & 호스팅 */}
          <div className="sf-card">
            <div className="sf-card-hd">
              <span className="sf-dot" style={{ background: '#10B981', boxShadow: '0 0 0 3px rgba(16,185,129,0.15)' }}></span>
              <span className="sf-label">도메인 &amp; 호스팅</span>
              <span className="sf-hd-sub">서브도메인 무료 · 업로드 한 번으로 서비스 시작</span>
            </div>
            <div className="sf-card-bd">
              <div className="sf-card-text">
                <h3>만든 사이트를<br />바로 세상에 올리세요</h3>
                <p>12개월 무료 서브도메인과 1G 호스팅을 제공합니다. 파일 업로드 한 번으로 내 사이트가 실제 인터넷에 서비스됩니다. 매달 나가는 호스팅 비용 걱정 없이 시작하세요.</p>
                <ul className="sf-feature-list">
                  <li className="sf-feature-item"><div className="sf-check" style={{ background: '#D1FAE5', color: '#059669' }}>✓</div><span>12개월 무료 서브도메인 제공 (yourname.aiseo.tips)</span></li>
                  <li className="sf-feature-item"><div className="sf-check" style={{ background: '#D1FAE5', color: '#059669' }}>✓</div><span>1G 웹호스팅 무료 제공</span></li>
                  <li className="sf-feature-item"><div className="sf-check" style={{ background: '#D1FAE5', color: '#059669' }}>✓</div><span>파일 업로드 한 번으로 즉시 서비스</span></li>
                  <li className="sf-feature-item"><div className="sf-check" style={{ background: '#D1FAE5', color: '#059669' }}>✓</div><span>SSL 보안 인증서 자동 적용</span></li>
                </ul>
              </div>
              <div className="sf-card-img" style={{ '--card-bg1': '#D1FAE5', '--card-bg2': '#A7F3D0' } as React.CSSProperties}>
                <div className="sf-img-placeholder">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="1.5"><circle cx="12" cy="12" r="9" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" /></svg>
                  <span>이미지 영역</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: SEO 핵심강의 */}
          <div className="sf-card">
            <div className="sf-card-hd">
              <span className="sf-dot" style={{ background: '#F59E0B', boxShadow: '0 0 0 3px rgba(245,158,11,0.15)' }}></span>
              <span className="sf-label">SEO 핵심강의</span>
              <span className="sf-hd-sub">기술적 SEO · 한번에 그리고 쉽게</span>
            </div>
            <div className="sf-card-bd">
              <div className="sf-card-text">
                <h3>10년 노하우를<br />핵심만 쏙쏙 배웁니다</h3>
                <p>검색노출을 위한 SEO 핵심강의를 제공합니다. 기술적 SEO의 복잡함을 없애고, 소상공인·1인 대표도 바로 적용할 수 있는 핵심만 담았습니다.</p>
                <ul className="sf-feature-list">
                  <li className="sf-feature-item"><div className="sf-check" style={{ background: '#FEF3C7', color: '#D97706' }}>✓</div><span>sitemap · robots · 메타태그 완전 정복</span></li>
                  <li className="sf-feature-item"><div className="sf-check" style={{ background: '#FEF3C7', color: '#D97706' }}>✓</div><span>네이버 · 구글 동시 상위 노출 전략</span></li>
                  <li className="sf-feature-item"><div className="sf-check" style={{ background: '#FEF3C7', color: '#D97706' }}>✓</div><span>키워드 리서치 실전 가이드</span></li>
                  <li className="sf-feature-item"><div className="sf-check" style={{ background: '#FEF3C7', color: '#D97706' }}>✓</div><span>강의 수강 후 즉시 적용 가능한 체크리스트</span></li>
                </ul>
              </div>
              <div className="sf-card-img" style={{ '--card-bg1': '#FEF3C7', '--card-bg2': '#FDE68A' } as React.CSSProperties}>
                <div className="sf-img-placeholder">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="1.5"><path d="M12 3L2 9l10 6 10-6-10-6z" /><path d="M2 15l10 6 10-6" /><path d="M2 12l10 6 10-6" /></svg>
                  <span>이미지 영역</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SECTION 3 — 핵심 진입 서비스 (랜딩 entry-section, 마우스 블롭 이펙트 유지) ══ */}
      <section className="entry-section">
        <div className="entry-inner">
          <div className="entry-eyebrow">핵심 진입 서비스</div>
          <h2 className="entry-h2">AI로 만든 홈페이지,<br />오늘 바로 공개하세요</h2>
          <p className="entry-sub">
            드래그&amp;드롭 한 번으로 배포까지. 5분이면 됩니다.<br />
            기술 지식 없어도, 도메인이 없어도, 지금 당장 시작할 수 있습니다.
          </p>

          <div className="entry-steps">
            <div className="entry-step">
              <div className="entry-step-num">① AI로 제작</div>
              <div className="entry-step-title">어떤 도구든 OK</div>
              <div className="entry-step-desc">Framer, Claude, Webflow, Figma 어디서 만들든 ZIP으로 내보내면 됩니다</div>
            </div>
            <div className="entry-arrow">→</div>
            <div className="entry-step active">
              <div className="entry-step-num">② AISEO에 올리고</div>
              <div className="entry-step-title">드래그&amp;드롭</div>
              <div className="entry-step-desc">ZIP 파일 하나면 끝. 업로드하는 순간 SEO 자동 검증까지 완료</div>
            </div>
            <div className="entry-arrow">→</div>
            <div className="entry-step">
              <div className="entry-step-num">③ 즉시 라이브</div>
              <div className="entry-step-title">완전 공개</div>
              <div className="entry-step-desc">서브도메인으로 바로 공개, 검색엔진 등록 · 측정코드 설정까지 당일 완성</div>
            </div>
          </div>

          <div className="entry-features">
            <div className="entry-feat">
              <div className="entry-feat-icon">🔍</div>
              <div>
                <div className="entry-feat-title">SEO 5가지 자동 검증</div>
                <div className="entry-feat-desc">업로드 즉시 기술적 SEO 핵심 항목을 자동으로 점검합니다</div>
              </div>
            </div>
            <div className="entry-feat">
              <div className="entry-feat-icon">📡</div>
              <div>
                <div className="entry-feat-title">원클릭 서비스 연결</div>
                <div className="entry-feat-desc">GA4 · Search Console · 네이버 웹마스터를 강의와 함께 직접 세팅</div>
              </div>
            </div>
          </div>

          <div className="entry-price-bar">
            <div>
              <div className="entry-price-amount">10만원</div>
              <div className="entry-price-meta">1회 완결 · 당일 배포 · 실습 포함</div>
            </div>
            <a
              href="/?auth=signup"
              className="entry-price-btn"
              style={{ textDecoration: 'none', display: 'inline-block' }}
            >
              배포 교육 신청하기 →
            </a>
          </div>
        </div>
      </section>

      {/* ══ 아래로: CoursePage 의 aiv5-hero (image 3) + #diagnosis (image 4) ══ */}
      <div className="cp2026-course-wrap">
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
        </div>
      </footer>
    </>
  );
}
