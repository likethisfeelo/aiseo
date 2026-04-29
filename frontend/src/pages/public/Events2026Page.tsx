import { useEffect } from 'react';
import '../landing.css';
import './events2026.css';
import { useSubPageNav } from './useSubPageNav';
import { KAKAO_CHAT_URL } from '../../constants/contact';

/**
 * 이벤트 2026 — `/events2026`
 *
 * Phase 2 rebuild: hero + video reveal kept identical to LandingPage's
 * first screen (background + video are the user-requested invariants),
 * but every section below the video is being replaced with the new
 * events.html design (see `docs/events.html`). Phase 2.1 strips the
 * legacy body (banner, diag tabs, packages, directory, FAQ, modal,
 * toast, kakao FAB) and lays down the new scoped CSS + the first
 * "솔직히 말하면" (Solidly) section. Subsequent phases (2.2–2.4) add
 * the events list, how-it-works, common-benefit, and final CTA.
 *
 * Class naming: new sections are scoped under `.evtmain` to avoid
 * colliding with `.section-eyebrow / .section-h2 / .section-sub`
 * already defined in landing.css for the landing/persona blocks.
 */
export function Events2026Page() {
  // Shared landing-nav → scrolled transition + mobile hamburger.
  useSubPageNav();

  // ── Video reveal (ported from LandingPage; identical to previous
  // implementation so the landing.css rules continue to apply 1:1).
  useEffect(() => {
    const vidSection = document.getElementById('videoRevealSection');
    const vidWrap = document.getElementById('videoFrameWrap');
    const vidLabel = document.getElementById('videoRevealLabel');
    const vidHint = document.getElementById('videoScrollHint');
    const vidGlow = document.getElementById('videoBgGlow');
    const ytPlayer = document.getElementById('ytPlayer') as HTMLIFrameElement | null;
    const vidProgressBar = document.getElementById('videoProgressBar');
    const vidThumbnail = document.getElementById('videoThumbnail');
    let videoStarted = false;
    let vidRaf = 0;

    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
    const lerpV = (a: number, b: number, t: number) => a + (b - a) * t;

    const vidGetProgress = () => {
      if (!vidSection) return 0;
      const rect = vidSection.getBoundingClientRect();
      const total = vidSection.offsetHeight - window.innerHeight;
      return clamp(-rect.top / total, 0, 1);
    };
    const vidApplyProgress = (p: number) => {
      if (!vidWrap || !vidLabel || !vidHint || !vidGlow || !vidProgressBar) return;
      const growEnd = 0.78;
      const phase1 = clamp(p / growEnd, 0, 1);
      const ease = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
      const e1 = ease(phase1);
      vidLabel.style.opacity = '0';
      vidLabel.style.marginBottom = '0px';
      vidHint.style.opacity = String(Math.max(0, 1 - p * 6));
      const scaleVal = lerpV(0.68, 1, e1);
      vidWrap.style.transform = 'scale(' + scaleVal + ')';
      vidWrap.style.borderRadius = Math.round(lerpV(20, 0, e1)) + 'px';
      const sh = lerpV(0.14, 0.02, e1);
      vidWrap.style.boxShadow =
        '0 ' + Math.round(lerpV(20, 2, e1)) + 'px ' +
        Math.round(lerpV(80, 12, e1)) + 'px rgba(0,0,0,' + sh.toFixed(2) + ')';
      const glowVal = clamp((p - 0.65) / 0.35, 0, 1);
      vidGlow.style.opacity = ease(glowVal).toFixed(3);
      vidProgressBar.style.width = p * 100 + '%';
    };
    const vidTick = () => {
      vidApplyProgress(vidGetProgress());
      vidRaf = requestAnimationFrame(vidTick);
    };

    let vidObs: IntersectionObserver | undefined;
    if (vidSection) {
      vidObs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) vidRaf = requestAnimationFrame(vidTick);
            else cancelAnimationFrame(vidRaf);
          });
        },
        { rootMargin: '200px' },
      );
      vidObs.observe(vidSection);
    }

    const thumbClick = () => {
      if (!vidThumbnail) return;
      vidThumbnail.style.opacity = '0';
      vidThumbnail.style.pointerEvents = 'none';
      if (!videoStarted && ytPlayer) {
        videoStarted = true;
        ytPlayer.src =
          'https://www.youtube.com/embed/mXlMAkHhgYs?autoplay=1&rel=0&modestbranding=1&color=white&enablejsapi=1';
        ytPlayer.style.pointerEvents = 'auto';
        vidWrap?.classList.add('playing');
      }
    };
    if (vidThumbnail) vidThumbnail.addEventListener('click', thumbClick);

    let vidVisObs: IntersectionObserver | undefined;
    if (vidWrap && ytPlayer) {
      vidVisObs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting && videoStarted) {
              ytPlayer.src =
                'https://www.youtube.com/embed/mXlMAkHhgYs?enablejsapi=1&rel=0&modestbranding=1&color=white';
              ytPlayer.style.pointerEvents = 'none';
              vidWrap.classList.remove('playing');
              videoStarted = false;
              if (vidThumbnail) {
                vidThumbnail.style.opacity = '1';
                vidThumbnail.style.pointerEvents = 'auto';
              }
            }
          });
        },
        { threshold: 0.1 },
      );
      vidVisObs.observe(vidWrap);
    }

    return () => {
      cancelAnimationFrame(vidRaf);
      vidObs?.disconnect();
      vidVisObs?.disconnect();
      if (vidThumbnail) vidThumbnail.removeEventListener('click', thumbClick);
    };
  }, []);

  // CSR-only app, so `window` is always defined at render time.
  // Canonical / og:url must be absolute so social crawlers resolve them.
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const canonicalUrl = `${origin}/events2026`;
  const docTitle = 'AISEO 2026 이벤트 — 광고가 아닌 검색될 구조를 만드는';
  const metaDescription =
    'AISEO 2026 런칭 이벤트. 일회성 광고가 아닌, 검색될 구조를 만듭니다. 무료 런칭 파트너 / 10만원 실전 패키지 / 검색 네트워크 등록 — 첫 사례를 함께 만들 분을 찾습니다.';
  const ogImage = `${origin}/events/hero-pc.jpg`;

  // Reference KAKAO_CHAT_URL so the import isn't flagged unused while the
  // final CTA section (Phase 2.4) is still pending. The actual link is
  // wired up in the kakao final-btn in that phase.
  void KAKAO_CHAT_URL;

  return (
    <>
      {/*
        React 19 native head metadata — rendering <title> / <meta> /
        <link> inside a component auto-hoists them into <head>. Same
        pattern used by ComingSoon2026 / BlogPostPage / Support2026.
      */}
      <title>{docTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="AISEO" />
      <meta property="og:title" content={docTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={docTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={ogImage} />

      {/*
        Scoped hero-bg override. Landing's `.hero-bg` is set via a huge
        base64 data URI in landing.css — we just punch a more-specific
        selector in front of it with !important. Keep the landing rule
        untouched so `/` stays identical.
      */}
      <style>{`
        .events-hero-v1 .hero-bg {
          background: url("/events/hero-pc.jpg") center/cover no-repeat !important;
        }
        @media (max-width: 600px) {
          .events-hero-v1 .hero-bg {
            background: url("/events/hero-mobile.jpg") center/cover no-repeat !important;
          }
        }
      `}</style>

      {/*
        Scoped CSS for the events.html port. Every selector is prefixed
        with `.evtmain` so it can't bleed into other pages, and so the
        existing `.section-eyebrow / .section-h2 / .section-sub` rules
        in landing.css aren't overridden globally.
      */}
      <style>{`
        .evtmain { --accent-deep: #6B4FB8; --bg-dark: #0A0614; --bg-dark-2: #14102A; }
        .evtmain section { padding: 110px 40px; }
        .evtmain .section-inner { max-width: 1100px; margin: 0 auto; }
        .evtmain .section-eyebrow {
          font-family: var(--font-en);
          font-size: 12px; font-weight: 700;
          color: var(--accent-dark);
          letter-spacing: 1.8px; text-transform: uppercase;
          margin-bottom: 16px;
          text-align: center;
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .evtmain .section-eyebrow::before,
        .evtmain .section-eyebrow::after {
          content: ''; width: 24px; height: 1px;
          background: var(--accent); opacity: 0.5;
        }
        .evtmain .section-eyebrow.dark { color: rgba(196,168,245,0.85); }
        .evtmain .section-eyebrow.dark::before,
        .evtmain .section-eyebrow.dark::after { background: rgba(196,168,245,0.45); }
        .evtmain .section-h2 {
          font-family: var(--font-ko);
          font-size: clamp(28px, 3.6vw, 42px);
          font-weight: 700; line-height: 1.3;
          letter-spacing: -1.2px;
          color: var(--text-primary);
          text-align: center;
          margin: 0 auto 18px;
          max-width: none;
        }
        .evtmain .section-h2 .em { color: var(--accent-dark); }
        .evtmain .section-sub {
          font-family: var(--font-ko);
          font-size: 16px; color: var(--text-secondary);
          line-height: 1.8; text-align: center;
          max-width: 620px; margin: 0 auto;
        }

        /* ── 솔직히 말하면 ── */
        .evtmain .solidly { background: var(--bg-soft); padding: 100px 40px; }
        .evtmain .solidly-inner { max-width: 720px; margin: 0 auto; text-align: center; }
        .evtmain .solidly-h {
          font-family: var(--font-ko);
          font-size: clamp(24px, 2.8vw, 34px);
          font-weight: 700;
          letter-spacing: -1px;
          line-height: 1.4;
          color: var(--text-primary);
          margin-bottom: 24px;
        }
        .evtmain .solidly-h .em { color: var(--accent-dark); }
        .evtmain .solidly-body {
          font-size: 17px; line-height: 1.85;
          color: var(--text-secondary);
        }
        .evtmain .solidly-body strong { color: var(--text-primary); font-weight: 600; }

        /* ── EVENTS LIST ── */
        .evtmain .events-list { background: var(--bg); padding: 110px 40px; }
        .evtmain .events-list-inner { max-width: 1100px; margin: 0 auto; }
        .evtmain .events-list-header { margin-bottom: 56px; }

        .evtmain .event-card {
          display: block;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 44px 48px;
          text-decoration: none;
          color: inherit;
          margin-bottom: 24px;
          transition: transform .25s ease, box-shadow .3s ease, border-color .25s ease;
          position: relative;
          overflow: hidden;
        }
        .evtmain .event-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
          border-color: rgba(196,168,245,0.4);
        }
        .evtmain .event-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 4px; height: 0;
          background: linear-gradient(180deg, var(--accent), var(--accent-deep));
          transition: height .4s ease;
        }
        .evtmain .event-card:hover::before { height: 100%; }

        .evtmain .event-card-head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 28px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .evtmain .event-card-status {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .evtmain .event-card-status::before {
          content: '';
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #4ADE80;
          animation: evtmainLivePulse 2s infinite;
        }
        @keyframes evtmainLivePulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.6); }
          50% { opacity: 0.7; box-shadow: 0 0 0 6px rgba(74, 222, 128, 0); }
        }
        .evtmain .event-card-date {
          font-family: var(--font-en);
          font-size: 13px;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: .5px;
        }

        .evtmain .event-card-tag-row {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .evtmain .event-card-num {
          font-family: var(--font-en);
          font-size: 12px;
          font-weight: 800;
          color: #fff;
          background: var(--accent-deep);
          padding: 6px 14px;
          border-radius: 6px;
          letter-spacing: 1px;
        }
        .evtmain .event-card-num.free {
          background: linear-gradient(135deg, var(--accent-deep) 0%, var(--accent-dark) 100%);
        }
        .evtmain .event-card-tag {
          font-family: var(--font-en);
          font-size: 11px;
          font-weight: 700;
          color: var(--accent-deep);
          background: var(--accent-light);
          padding: 5px 11px;
          border-radius: 100px;
          letter-spacing: 1.2px;
        }

        .evtmain .event-card-h {
          font-family: var(--font-ko);
          font-size: clamp(28px, 3.4vw, 40px);
          font-weight: 700;
          letter-spacing: -1.2px;
          line-height: 1.3;
          color: var(--text-primary);
          margin-bottom: 18px;
        }
        .evtmain .event-card-sub {
          font-size: 17px;
          line-height: 1.7;
          color: var(--text-secondary);
          margin-bottom: 26px;
          max-width: 640px;
        }

        .evtmain .event-card-meta {
          list-style: none;
          display: flex; flex-direction: column;
          gap: 8px;
          margin: 0 0 32px;
          padding: 0;
        }
        .evtmain .event-card-meta li {
          font-size: 15px;
          color: var(--text-primary);
          line-height: 1.55;
          padding-left: 16px;
          position: relative;
          font-weight: 500;
        }
        .evtmain .event-card-meta li::before {
          content: '·';
          position: absolute;
          left: 0; top: -2px;
          color: var(--accent-dark);
          font-weight: 800;
          font-size: 18px;
        }
        .evtmain .event-card-meta strong { font-weight: 700; color: var(--accent-dark); }

        .evtmain .event-card-foot {
          display: flex; align-items: center; justify-content: space-between;
          padding-top: 24px;
          border-top: 1px dashed var(--border);
          gap: 12px;
          flex-wrap: wrap;
        }
        .evtmain .event-card-tags { display: flex; flex-wrap: wrap; gap: 10px; }
        .evtmain .event-card-tags span {
          font-size: 13px;
          color: var(--text-muted);
          font-weight: 500;
        }
        .evtmain .event-card-cta {
          font-size: 16px;
          font-weight: 700;
          color: var(--accent-dark);
          display: flex; align-items: center; gap: 6px;
          transition: color .2s;
        }
        .evtmain .event-card:hover .event-card-cta { color: var(--accent-deep); }
        .evtmain .event-card-cta-arrow { transition: transform .25s; display: inline-block; }
        .evtmain .event-card:hover .event-card-cta-arrow { transform: translateX(4px); }

        @media (max-width: 900px) {
          .evtmain section { padding: 80px 24px; }
          .evtmain .solidly { padding: 70px 24px; }
          .evtmain .events-list { padding: 80px 24px; }
          .evtmain .event-card { padding: 32px 26px; }
          .evtmain .event-card-h { letter-spacing: -.8px; }
        }
        @media (max-width: 480px) {
          .evtmain .section-h2 { letter-spacing: -.8px; }
        }
      `}</style>

      {/* NAV */}
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

      {/*
        HERO — kept identical to the previous Events2026 hero (prism BG
        + landing-style copy). User explicitly asked to preserve the
        background and the connected video reveal.
      */}
      <section className="hero events-hero-v1" id="hero">
        <div className="hero-bg"></div>
        <div className="hero-noise"></div>
        <div className="hero-grid"></div>
        <div className="hero-content">
          <div className="hero-badge">
            <div className="hero-badge-dot"></div>
            EVENTS 2026 · AISEO.TIPS
          </div>
          <h1 className="hero-h1">
            <span className="word w1">먼저 만나고,</span><br/>
            <span className="word w2 accent-text">함께 배우고,</span><br/>
            <span className="word w3">한발 앞서 시작하세요</span>
          </h1>
          <p className="hero-sub">
            AISEO 수강생과 함께하는 2026 이벤트·오프라인 세션·한정 프로모션.
            AI 사이트와 검색 노출을 실제로 돌려보는 자리를 가장 먼저 안내해드립니다.
          </p>
        </div>
      </section>

      {/*
        VIDEO REVEAL — identical markup to LandingPage so the
        landing.css rules (.video-reveal-section / sticky / frame-wrap /
        thumbnail / progress bar / hint) apply verbatim.
      */}
      <div className="video-reveal-section" id="videoRevealSection">
        <div className="video-reveal-sticky" id="videoRevealSticky">
          <div className="video-bg-glow" id="videoBgGlow"></div>
          <div
            className="video-reveal-label"
            id="videoRevealLabel"
            style={{ display: 'none', margin: 0 }}
          ></div>
          <div className="video-frame-wrap" id="videoFrameWrap">
            <div id="videoThumbnail">
              <div className="vt-placeholder">
                <div className="vt-play-ring">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M8 5L19 12L8 19V5Z" />
                  </svg>
                </div>
                <span className="vt-label">AISEO 데모 영상 · 5분</span>
              </div>
            </div>
            <div className="video-play-overlay" id="videoPlayOverlay"></div>
            <iframe
              id="ytPlayer"
              src="https://www.youtube.com/embed/mXlMAkHhgYs?enablejsapi=1&rel=0&modestbranding=1&color=white"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
            <div className="video-progress-bar" id="videoProgressBar"></div>
          </div>
          <div className="video-scroll-hint" id="videoScrollHint">
            <span>스크롤해서 열기</span>
            <svg
              className="scroll-arrow"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: 'var(--text-muted)' }}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      </div>

      {/*
        ── EVENTS.HTML PORT — wrapped in `.evtmain` for CSS scoping.
        Phase 2.1 ships only the "솔직히 말하면" section; subsequent
        phases append events-list, how-it-works, common-benefit, and
        the final CTA below this comment.
      */}
      <main className="evtmain">
        {/* ── 솔직히 말하면 ── */}
        <section className="solidly">
          <div className="solidly-inner">
            <div className="section-eyebrow">Honestly</div>
            <h2 className="solidly-h">
              초기 런칭 단계에서는 광고보다<br />
              <span className="em">실제 사례와 데이터</span>가 더 중요합니다
            </h2>
            <p className="solidly-body">
              AI 시대에 맞춘 홈페이지 제작과 검색 전략으로, 흐름에 맞는 <strong>마케팅 자산</strong>을 만들어드립니다.
              나만의 사업을 꾸준히 일궈오신 사장님들을 <strong>파트너</strong>로 찾습니다. 선별이 까다로운 이유입니다.
            </p>
          </div>
        </section>

        {/* ── NOW LIVE — 진행 중인 이벤트 ── */}
        <section className="events-list" id="events-list">
          <div className="events-list-inner">
            <div className="events-list-header">
              <div className="section-eyebrow">Now Live</div>
              <h2 className="section-h2">진행 중인 이벤트</h2>
              <p className="section-sub">관심 있는 이벤트를 클릭해 자세한 내용을 확인해보세요.</p>
            </div>

            {/* EVENT 01 — 무료 (런칭 파트너) */}
            <a href="/events2026/free" className="event-card">
              <div className="event-card-head">
                <span className="event-card-status">진행 중</span>
                <span className="event-card-date">2026.04.30 OPEN</span>
              </div>

              <div className="event-card-tag-row">
                <span className="event-card-num free">EVENT 01</span>
                <span className="event-card-tag">FREE · 런칭 파트너</span>
              </div>

              <h3 className="event-card-h">
                3가지를 전부 무료로<br />받아가시는 이벤트
              </h3>
              <p className="event-card-sub">
                AI 홈페이지 제작 + 도메인·호스팅 + SEO 핵심강의를 전부 무료로 제공합니다.
                선별된 첫 사례 파트너를 모집합니다.
              </p>

              <ul className="event-card-meta">
                <li>정가 30만원 → <strong>0원</strong></li>
                <li>선착순 3팀 한정 · 자격 검토 후 선별</li>
                <li>1:1 코칭 + 12개월 무료 호스팅 포함</li>
              </ul>

              <div className="event-card-foot">
                <div className="event-card-tags">
                  <span>#런칭파트너</span>
                  <span>#자격검토</span>
                  <span>#완전무료</span>
                </div>
                <span className="event-card-cta">
                  자세히 보기 <span className="event-card-cta-arrow">→</span>
                </span>
              </div>
            </a>

            {/* EVENT 02·03 — 10만원 패키지 */}
            <a href="/events2026/paid" className="event-card">
              <div className="event-card-head">
                <span className="event-card-status">진행 중</span>
                <span className="event-card-date">2026.04.30 OPEN</span>
              </div>

              <div className="event-card-tag-row">
                <span className="event-card-num">EVENT 02 · 03</span>
                <span className="event-card-tag">PAID · 합리적 가격</span>
              </div>

              <h3 className="event-card-h">
                두 가지 패키지 중<br />내게 맞는 한 가지를
              </h3>
              <p className="event-card-sub">
                검색 전략 또는 콘텐츠 기획 + CORE 1 배포 — 사장님 상황에 맞는 출발점을 골라
                한 번에 사이트 공개까지 끝냅니다.
              </p>

              <ul className="event-card-meta">
                <li>30만원 → <strong>10만원</strong> (각 패키지)</li>
                <li>각 7팀 한정 · 총 14팀</li>
                <li>자격 검토 없이 누구나 신청 가능</li>
              </ul>

              <div className="event-card-foot">
                <div className="event-card-tags">
                  <span>#누구나신청</span>
                  <span>#검색전략</span>
                  <span>#콘텐츠기획</span>
                </div>
                <span className="event-card-cta">
                  자세히 보기 <span className="event-card-cta-arrow">→</span>
                </span>
              </div>
            </a>
          </div>
        </section>
      </main>

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
