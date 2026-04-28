import { useEffect, useState } from 'react';
import '../landing.css';
import './events2026.css';
import { useSubPageNav } from './useSubPageNav';
import { KAKAO_CHAT_URL } from '../../constants/contact';

const BANNER_CLOSED_KEY = 'events2026-banner-closed';

/**
 * 이벤트 2026 — `/events2026`
 *
 * Mirrors LandingPage's first screen exactly (hero + connected video
 * reveal section) but swaps the hero background for the event-themed
 * prism artwork. Desktop uses a 3:2 landscape image, mobile uses a 2:3
 * portrait image — same dimensions as the landing hero so the existing
 * `.hero-bg` / `.hero-noise` / bottom-fade chrome lines up unchanged.
 *
 * The background swap is done with a scoped `<style>` block targeting
 * `.events-hero-v1 .hero-bg` + a 600px mobile breakpoint, so landing's
 * own `.hero-bg` (served from the data URI in landing.css) stays
 * untouched.
 *
 * The video reveal useEffect is a direct port of the landing logic
 * (scroll-driven scale/radius/glow + click-to-play thumbnail +
 * auto-pause on scroll-out). The sub-page nav transition is handled
 * by the shared useSubPageNav hook, so the nav starts as the large
 * transparent `landing-nav` bar and collapses to the narrow pill once
 * the user scrolls ~½ viewport — same pattern the other 2026 pages use.
 */
export function Events2026Page() {
  // Shared landing-nav → scrolled transition + mobile hamburger.
  useSubPageNav();

  // ── Top fixed banner (sessionStorage 닫힘 보존) ──
  const [bannerOpen, setBannerOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    return sessionStorage.getItem(BANNER_CLOSED_KEY) !== '1';
  });
  const closeBanner = () => {
    setBannerOpen(false);
    try {
      sessionStorage.setItem(BANNER_CLOSED_KEY, '1');
    } catch {
      /* sessionStorage 비활성화/사파리 프라이빗 모드 — 무시 */
    }
  };

  // ── Video reveal (ported from LandingPage) ──
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

    // Click thumbnail to start video (only way to play)
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

    // Auto-pause when video scrolls out of view, show thumbnail again
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
  const docTitle = '이벤트 2026 | AISEO';
  const metaDescription =
    'AISEO 2026 이벤트. AI 웹사이트와 검색 최적화 수강생을 위한 한정 이벤트·오프라인 세션·프로모션 소식을 가장 먼저 확인하세요.';
  const ogImage = `${origin}/events/hero-pc.jpg`;

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

      {/* 0-1. 상단 고정 배너 (events2026 전용, sessionStorage) */}
      {bannerOpen && (
        <div className="e26-banner" role="region" aria-label="이벤트 안내">
          <span className="e26-banner-text">
            * 2026 런칭 파트너 모집 중 — 무료 · 10만원 · 검색 네트워크 등록
          </span>
          <button
            type="button"
            className="e26-banner-close"
            aria-label="배너 닫기"
            onClick={closeBanner}
          >
            ×
          </button>
        </div>
      )}

      {/* NAV — mirrors ComingSoon2026 with activeMenu=events */}
      <nav id="mainNav" className="landing-nav">
        <div className="nav-inner">
          <a href="/" className="nav-logo">AISEO</a>
          <div className="nav-links">
            <a href="/course2026">수강안내</a>
            <a href="/support2026">지원서비스</a>
            <a href="/events2026" className="active">이벤트</a>
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

      {/*
        HERO — layout/animations mirror LandingPage's hero 1:1. Only
        the background image is swapped (prism artwork, /events/*).
        Copy stays on the events theme while keeping the same three-line
        rhythm used by the landing h1.
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
          <div className="hero-mobile-cta">
            <a href="/?auth=signup" className="hero-mobile-btn-primary">이벤트 알림 받기 →</a>
          </div>
        </div>
      </section>

      {/*
        VIDEO REVEAL — identical markup to LandingPage so the
        landing.css rules (.video-reveal-section / sticky / frame-wrap /
        thumbnail / progress bar / hint) apply verbatim. The scroll
        logic is handled in the useEffect above.
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
        섹션 03~10 — 다음 페이즈에서 채워짐.
        지금은 페이지 골격만 잡아두고 commit.
      */}
      <section className="e26-section" id="benefits" aria-label="benefits placeholder" />
      <section className="e26-section e26-section-soft" id="step1" aria-label="step1 placeholder" />
      <section className="e26-section" id="step2" aria-label="step2 placeholder" />
      <section className="e26-section" id="directory" aria-label="directory placeholder" />
      <section className="e26-section e26-section-soft" id="why" aria-label="why placeholder" />
      <section className="e26-section" id="process" aria-label="process placeholder" />
      <section className="e26-section e26-section-soft" id="faq" aria-label="faq placeholder" />
      <section className="e26-section" id="finalcta" aria-label="finalcta placeholder" />

      {/* 0-2. 모바일 플로팅 카카오 버튼 */}
      <a
        href={KAKAO_CHAT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="e26-kakao-fab"
        aria-label="카카오 채팅으로 상담"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#1d1d1f"
            d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.86 5.32 4.66 6.74-.2.7-.74 2.55-.84 2.95-.13.49.18.49.38.36.16-.1 2.55-1.74 3.59-2.45.74.1 1.49.16 2.21.16 5.52 0 10-3.58 10-8s-4.48-8-10-8z"
          />
        </svg>
      </a>

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
