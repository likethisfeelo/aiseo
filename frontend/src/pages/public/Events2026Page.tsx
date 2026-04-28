import { useEffect, useRef, useState, type FormEvent } from 'react';
import '../landing.css';
import './events2026.css';
import { useSubPageNav } from './useSubPageNav';
import { KAKAO_CHAT_URL } from '../../constants/contact';

const BANNER_CLOSED_KEY = 'events2026-banner-closed';

const INDUSTRY_OPTIONS = [
  { id: 'pet', label: '반려동물' },
  { id: 'oneday', label: '원데이클래스' },
  { id: 'pt', label: 'PT·운동' },
  { id: 'custom', label: '맞춤제작' },
  { id: 'pro', label: '전문서비스' },
  { id: 'etc', label: '기타' },
];

const HAS_SITE_OPTIONS = [
  { id: 'yes', label: '있음' },
  { id: 'no', label: '없음' },
  { id: 'wip', label: '만드는 중' },
];

type DiagKey = 'A' | 'B' | 'C';

const DIAG_TABS: { key: DiagKey; label: string; sub: string }[] = [
  { key: 'A', label: '이미 콘텐츠가 있는 분', sub: '서비스/가격/사진/후기 보유' },
  { key: 'B', label: 'AI로 자동화 기틀을 만들고 싶은 분', sub: '예약·문의·콘텐츠 자동화' },
  { key: 'C', label: '두 경우 모두 해당하지 않는 분', sub: '실전 패키지가 더 잘 맞을 수 있어요' },
];

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

  // ── Placeholder 신청 모달 + 토스트 ──
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSource, setModalSource] = useState<string>('');
  const [toast, setToast] = useState<string>('');
  const toastTimerRef = useRef<number | undefined>(undefined);

  const openModal = (source: string) => {
    setModalSource(source);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(''), 2800);
  };

  // 모달 열렸을 때 ESC 닫기 + 본문 스크롤 잠금
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [modalOpen]);

  // 토스트 cleanup
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const handleModalSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    closeModal();
    showToast('신청 기능은 준비 중입니다. 잠시 후 다시 시도해주세요.');
  };

  // ── A/B/C 탭 진단 ──
  const [diagTab, setDiagTab] = useState<DiagKey>('A');
  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
            <button
              type="button"
              className="hero-mobile-btn-primary"
              onClick={() => openModal('hero')}
            >
              이벤트 알림 받기 →
            </button>
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

      {/* ══ 03. BENEFITS OVERVIEW · 3 카드 ══ */}
      <section className="e26-section" id="benefits">
        <div className="e26-section-inner">
          <div className="e26-section-head">
            <div className="e26-eyebrow">* 한눈에 보기</div>
            <h2 className="e26-h2">
              이번 이벤트는<br />세 가지 혜택으로 구성됩니다
            </h2>
            <p className="e26-lead">
              모두를 위한 이벤트가 아닙니다. 무료도, 할인도, 검색 지원도 — 결국 같은 조건 위에서 시작합니다.
            </p>
          </div>

          <div className="e26-benefit-grid">
            <article className="e26-benefit-card is-violet">
              <div className="e26-benefit-label">CARD 1 · 연보라</div>
              <h3 className="e26-benefit-title">런칭 파트너 (무료)</h3>
              <p className="e26-benefit-body">
                이미 콘텐츠가 있는 분{'\n'}AI로 자동화 기틀을 만들고 싶은 분
              </p>
              <div className="e26-benefit-foot">→ 업종 적합성 기준 선별</div>
            </article>

            <article className="e26-benefit-card is-mint">
              <div className="e26-benefit-label">CARD 2 · 민트</div>
              <h3 className="e26-benefit-title">실전 패키지 (10만원)</h3>
              <p className="e26-benefit-body">
                홈페이지 내용부터 함께 짜야 하는 분{'\n'}기존 사이트를 SEO로 개선하고 싶은 분
              </p>
              <div className="e26-benefit-foot">→ 누구나 신청 가능 / 정가 30만원</div>
            </article>

            <article className="e26-benefit-card is-yellow">
              <div className="e26-benefit-label">CARD 3 · 옐로우</div>
              <h3 className="e26-benefit-title">공통 — 디렉토리 SEO 네트워크</h3>
              <p className="e26-benefit-body">
                업종 카테고리에 맞는 분에 한해{'\n'}검색 네트워크에 함께 노출
              </p>
              <div className="e26-benefit-foot">수수료 없음 · 중개비 없음 · 강제 결제 없음</div>
            </article>
          </div>
        </div>
      </section>

      {/* ══ 04. 런칭 파트너 (무료) · A/B/C 탭 진단 ══ */}
      <section className="e26-section e26-section-soft" id="step1">
        <div className="e26-section-inner">
          <div className="e26-section-head">
            <div className="e26-eyebrow">* Step 1</div>
            <h2 className="e26-h2">수업만 무료로 받고 싶은 분께</h2>
            <p className="e26-lead">
              이번 무료 혜택은 아무나 받는 이벤트가 아닙니다. 검색 수요가 있고 카테고리 확장이 가능한 업종 중심으로 선별합니다.
            </p>
          </div>

          <div className="e26-diag-layout">
            <div className="e26-diag-tabs" role="tablist" aria-label="런칭 파트너 진단">
              {DIAG_TABS.map(t => (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={diagTab === t.key}
                  aria-controls="e26-diag-panel"
                  className={`e26-diag-tab${diagTab === t.key ? ' is-active' : ''}`}
                  onClick={() => setDiagTab(t.key)}
                >
                  <span className="e26-diag-tab-key">{t.key}</span>
                  <span className="e26-diag-tab-text">
                    <span className="e26-diag-tab-label">{t.label}</span>
                    <span className="e26-diag-tab-sub">{t.sub}</span>
                  </span>
                </button>
              ))}
            </div>

            <div
              className="e26-diag-panel"
              id="e26-diag-panel"
              role="tabpanel"
              aria-live="polite"
            >
              {diagTab === 'A' && (
                <>
                  <h4 className="e26-diag-panel-h4">이미 콘텐츠가 있는 분</h4>
                  <p className="e26-diag-panel-small">
                    서비스 소개, 가격표, 사진, 후기 — 콘텐츠는 있는 분. 필요한 건 호스팅 비용 줄이기, 더 쉬운 운영, 검색 노출 구조.
                  </p>
                  <h5 className="e26-diag-panel-h5">함께 진행하는 것</h5>
                  <ul className="e26-diag-list">
                    <li>기존 콘텐츠 기반 홈페이지 배포 구조 안내</li>
                    <li>SEO 기초 세팅 (sitemap, robots, 메타태그)</li>
                    <li>검색 노출 구조 점검</li>
                    <li>운영 방식 안내</li>
                  </ul>
                  <button
                    type="button"
                    className="e26-diag-cta"
                    onClick={() => openModal('step1-A')}
                  >
                    이 조건으로 신청하기 →
                  </button>
                </>
              )}
              {diagTab === 'B' && (
                <>
                  <h4 className="e26-diag-panel-h4">AI로 자동화 기틀을 만들고 싶은 분</h4>
                  <p className="e26-diag-panel-small">
                    예약, 문의, 콘텐츠 생산, SNS 연결까지 자동화 기반을 만들고 싶은 분.
                  </p>
                  <h5 className="e26-diag-panel-h5">함께 진행하는 것</h5>
                  <ul className="e26-diag-list">
                    <li>어떤 AI 툴로 만들지 가이드</li>
                    <li>제작 흐름 설계</li>
                    <li>자동화 구조 방향성 제안</li>
                    <li>운영 전략 안내</li>
                  </ul>
                  <button
                    type="button"
                    className="e26-diag-cta"
                    onClick={() => openModal('step1-B')}
                  >
                    이 조건으로 신청하기 →
                  </button>
                </>
              )}
              {diagTab === 'C' && (
                <>
                  <h4 className="e26-diag-panel-h4">괜찮습니다.</h4>
                  <p className="e26-diag-panel-small">
                    아래 실전 패키지(10만원)가 더 잘 맞을 수 있어요.
                  </p>
                  <button
                    type="button"
                    className="e26-diag-cta is-ghost"
                    onClick={() => scrollToId('step2')}
                  >
                    실전 패키지 보기 →
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="e26-diag-criteria">
            선별 기준 · 검색 수요가 있는 업종 · 카테고리 확장 가능성 · 실제 운영/실행 의지
          </div>
        </div>
      </section>

      {/* ══ 05. 실전 패키지 (10만원) · 2 카드 ══ */}
      <section className="e26-section" id="step2">
        <div className="e26-section-inner">
          <div className="e26-section-head">
            <div className="e26-eyebrow">* Step 2</div>
            <h2 className="e26-h2">
              혼자 하기 어려운 분을 위한<br />실전 제작 · 개선 패키지
            </h2>
            <p className="e26-lead">
              누구나 신청 가능합니다. 정가 30만원 → 런칭 기간 한정 10만원.
            </p>
          </div>

          <div className="e26-pkg-grid">
            {/* TYPE A · CONTENT BUILD */}
            <article className="e26-pkg-card">
              <div className="e26-pkg-label">TYPE A · CONTENT BUILD</div>
              <h3 className="e26-pkg-title">처음부터 내용을 짜야 할 때</h3>

              <div className="e26-pkg-block">
                <h4 className="e26-pkg-block-h">이런 분께</h4>
                <ul className="e26-pkg-list">
                  <li>뭘 써야 할지 모르겠음</li>
                  <li>홈페이지 문구가 없음</li>
                  <li>구조를 못 잡겠음</li>
                  <li>AI를 어떻게 써야 할지 모르겠음</li>
                </ul>
              </div>
              <div className="e26-pkg-block">
                <h4 className="e26-pkg-block-h">함께 진행하는 것</h4>
                <ul className="e26-pkg-list">
                  <li>업종 맞춤 사이트 구조 설계</li>
                  <li>페이지 구성안 작성</li>
                  <li>AI 템플릿 + 프롬프트 제공</li>
                  <li>시작용 문구 초안</li>
                  <li>바로 실행 가능한 제작 가이드</li>
                </ul>
              </div>

              <div className="e26-pkg-price-row">
                <span className="e26-pkg-price-old">정가 30만원</span>
                <span className="e26-pkg-price">10만원</span>
                <span className="e26-pkg-price-meta">런칭 기간 한정</span>
              </div>
              <button
                type="button"
                className="e26-pkg-cta"
                onClick={() => openModal('step2-typeA')}
              >
                TYPE A 신청하기 →
              </button>
            </article>

            {/* TYPE B · SEO REFRESH */}
            <article className="e26-pkg-card">
              <div className="e26-pkg-label">TYPE B · SEO REFRESH</div>
              <h3 className="e26-pkg-title">기존 내용을 SEO 중심으로 개선할 때</h3>

              <div className="e26-pkg-block">
                <h4 className="e26-pkg-block-h">이런 분께</h4>
                <ul className="e26-pkg-list">
                  <li>홈페이지는 이미 있음</li>
                  <li>검색 유입이 없음</li>
                  <li>설명이 약함</li>
                  <li>전환이 낮음</li>
                </ul>
              </div>
              <div className="e26-pkg-block">
                <h4 className="e26-pkg-block-h">함께 진행하는 것</h4>
                <ul className="e26-pkg-list">
                  <li>서비스 문구 개선</li>
                  <li>키워드 구조 개선</li>
                  <li>메타태그 방향 제안</li>
                  <li>FAQ 구성 제안</li>
                  <li>검색 친화 구조 리뉴얼</li>
                </ul>
              </div>

              <div className="e26-pkg-price-row">
                <span className="e26-pkg-price-old">정가 30만원</span>
                <span className="e26-pkg-price">10만원</span>
                <span className="e26-pkg-price-meta">런칭 기간 한정</span>
              </div>
              <button
                type="button"
                className="e26-pkg-cta"
                onClick={() => openModal('step2-typeB')}
              >
                TYPE B 신청하기 →
              </button>
            </article>
          </div>
        </div>
      </section>

      {/* ══ 06. 디렉토리 SEO 네트워크 (검정 섹션) ══ */}
      <section className="e26-dir-section" id="directory">
        <div className="e26-dir-inner">
          <div className="e26-section-head">
            <div className="e26-eyebrow">* 공통 혜택</div>
            <h2 className="e26-h2">
              내 업종을 찾는 사람이<br />검색하는 곳에도 함께 노출됩니다
            </h2>
            <p className="e26-lead">
              홈페이지 하나만 만드는 게 아닙니다. 업종별 네트워크 페이지에 함께 등록되어, 지역 검색 키워드에서 추가 노출 기회를 만듭니다.
            </p>
          </div>

          <div className="e26-dir-grid">
            <article className="e26-dir-card">
              <div className="e26-dir-card-icon" aria-hidden="true">🐶</div>
              <h3 className="e26-dir-card-title">반려동물</h3>
              <p className="e26-dir-card-sub">미용 · 훈련 · 호텔 · 돌봄 · 장례 · 용품</p>
            </article>
            <article className="e26-dir-card">
              <div className="e26-dir-card-icon" aria-hidden="true">🎨</div>
              <h3 className="e26-dir-card-title">원데이 클래스</h3>
              <p className="e26-dir-card-sub">도자기 · 베이킹 · 꽃꽂이 · 가죽공예 · 캔들 · 드로잉</p>
            </article>
            <article className="e26-dir-card">
              <div className="e26-dir-card-icon" aria-hidden="true">💪</div>
              <h3 className="e26-dir-card-title">1:1 PT · 운동</h3>
              <p className="e26-dir-card-sub">PT · 필라테스 · 요가 · 재활 · 체형교정</p>
            </article>
            <article className="e26-dir-card">
              <div className="e26-dir-card-icon" aria-hidden="true">🛠</div>
              <h3 className="e26-dir-card-title">맞춤 제작</h3>
              <p className="e26-dir-card-sub">가구 · 간판 · 인쇄 · 공방 · 주문제작 · 소품</p>
            </article>
            <article className="e26-dir-card">
              <div className="e26-dir-card-icon" aria-hidden="true">💼</div>
              <h3 className="e26-dir-card-title">전문 서비스</h3>
              <p className="e26-dir-card-sub">코칭 · 컨설팅 · 강의 · 상담 · 멘토링 · 과외</p>
            </article>
            <article className="e26-dir-card is-future">
              <div className="e26-dir-card-icon" aria-hidden="true">＋</div>
              <h3 className="e26-dir-card-title">향후 추가 예정</h3>
              <p className="e26-dir-card-sub">업종 카테고리는 단계적으로 확장됩니다</p>
            </article>
          </div>

          <div className="e26-dir-search" aria-label="검색 예시">
            "천안 강아지 미용 추천"<br />
            "세종 도자기 원데이클래스"<br />
            "대전 PT 추천"<br />
            "충남 맞춤가구 제작"<br />
            "청주 1:1 영어 코칭"
            <span className="e26-dir-search-arrow">→ 내 사이트 + 네트워크 페이지 동시 노출</span>
          </div>

          <div className="e26-dir-emphasis">
            <h3 className="e26-dir-emphasis-h">이 네트워크는 광고 플랫폼이 아닙니다.</h3>
            <p className="e26-dir-emphasis-list">
              · 매출 수수료 없음 · 중개 수수료 없음 · 월 강제 결제 없음
            </p>
            <p className="e26-dir-emphasis-foot">검색될 수 있는 구조를 만드는 데 집중합니다.</p>
          </div>
        </div>
      </section>
      {/* ══ 07. WHY ══ */}
      <section className="e26-section e26-section-soft e26-why" id="why">
        <div className="e26-section-inner">
          <div className="e26-section-head">
            <div className="e26-eyebrow">* 솔직히 말하면</div>
            <h2 className="e26-h2">
              초기 런칭 단계에서는 광고보다<br />실제 사례와 데이터가 더 중요합니다
            </h2>
          </div>
          <div className="e26-why-body">
            <p>
              그래서 지금은 일부 업종 대상으로 혜택가 + 검색 네트워크 등록까지 함께 제공합니다.
            </p>
            <p>
              이 사례들이 AISEO.TIPS의 다음 콘텐츠가 됩니다. 선별이 까다로운 이유입니다.
            </p>
          </div>
        </div>
      </section>

      {/* ══ 08. 신청 프로세스 (4 STEPS) ══ */}
      <section className="e26-section" id="process">
        <div className="e26-section-inner">
          <div className="e26-section-head">
            <div className="e26-eyebrow">* 신청 프로세스</div>
            <h2 className="e26-h2">신청부터 시작까지, 4단계</h2>
            <p className="e26-lead">
              빠르면 5영업일 내에 진행됩니다. 적합성 확인부터 실제 시작까지 흐름을 미리 확인해보세요.
            </p>
          </div>

          <div className="e26-steps-grid">
            <article className="e26-step-card">
              <div className="e26-step-num">1</div>
              <h3 className="e26-step-title">정보 입력</h3>
              <p className="e26-step-desc">업종 · 지역 · 현재 상태 · 연락처</p>
            </article>
            <article className="e26-step-card">
              <div className="e26-step-num">2</div>
              <h3 className="e26-step-title">적합성 확인</h3>
              <p className="e26-step-desc">런칭 파트너 / 실전 패키지 중 어디에 맞는지 안내</p>
            </article>
            <article className="e26-step-card">
              <div className="e26-step-num">3</div>
              <h3 className="e26-step-title">맞춤 방향 제안</h3>
              <p className="e26-step-desc">어떻게 진행할지 1:1 상담 (15-20분)</p>
            </article>
            <article className="e26-step-card">
              <div className="e26-step-num">4</div>
              <h3 className="e26-step-title">시작</h3>
              <p className="e26-step-desc">선별 시 5영업일 내 진행</p>
            </article>
          </div>
        </div>
      </section>

      {/* ══ 09. FAQ ══ */}
      <section className="e26-section e26-section-soft" id="faq">
        <div className="e26-section-inner">
          <div className="e26-section-head">
            <div className="e26-eyebrow">* FAQ</div>
            <h2 className="e26-h2">자주 묻는 질문</h2>
          </div>

          <div className="e26-faq-list">
            <details className="e26-faq-item">
              <summary className="e26-faq-summary">무료는 왜 해주나요?</summary>
              <p className="e26-faq-answer">
                초기 성공 사례와 업종별 레퍼런스를 함께 만들기 위해서입니다. 일종의 베타 파트너 개념입니다.
              </p>
            </details>
            <details className="e26-faq-item">
              <summary className="e26-faq-summary">아무나 무료 가능한가요?</summary>
              <p className="e26-faq-answer">
                아닙니다. 카테고리 적합 업종 중심으로 선별합니다. 적합하지 않은 경우 10만원 패키지를 안내드립니다.
              </p>
            </details>
            <details className="e26-faq-item">
              <summary className="e26-faq-summary">홈페이지가 아예 없어도 되나요?</summary>
              <p className="e26-faq-answer">네. 10만원 TYPE A 패키지가 적합합니다.</p>
            </details>
            <details className="e26-faq-item">
              <summary className="e26-faq-summary">지역 제한 있나요?</summary>
              <p className="e26-faq-answer">
                전국 가능합니다. 다만 일부 지역 키워드부터 우선 노출됩니다.
              </p>
            </details>
            <details className="e26-faq-item">
              <summary className="e26-faq-summary">디렉토리 등록은 무조건 되나요?</summary>
              <p className="e26-faq-answer">
                업종 적합성과 콘텐츠 품질 기준 충족 시 등록됩니다.
              </p>
            </details>
            <details className="e26-faq-item">
              <summary className="e26-faq-summary">등록 후에 수수료나 월 결제가 있나요?</summary>
              <p className="e26-faq-answer">
                없습니다. 디렉토리 등록 자체는 일회성이며, 추후 광고 모델로 전환할 계획도 없습니다.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* ══ 10. FINAL CTA (검정 + 프리즘) ══ */}
      <section className="e26-final" id="finalcta">
        <div className="e26-final-inner">
          <div className="e26-final-eyebrow">* 마지막으로</div>
          <h2 className="e26-final-h2">첫 사례를 함께 만들 분을 찾습니다</h2>
          <p className="e26-final-sub">
            광고 플랫폼이 아니라, 검색될 구조를 만듭니다.<br />
            지금 신청하면 적합성 확인 후 1:1 안내드립니다.
          </p>
          <div className="e26-final-ctas">
            <button
              type="button"
              className="e26-final-btn is-primary"
              onClick={() => openModal('final-eligibility')}
            >
              내가 대상인지 확인하기 →
            </button>
            <button
              type="button"
              className="e26-final-btn is-secondary"
              onClick={() => openModal('final-package')}
            >
              10만원 패키지 신청
            </button>
            <a
              href={KAKAO_CHAT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="e26-final-btn is-kakao"
            >
              카카오 상담
            </a>
          </div>
        </div>
      </section>

      {/* 0-3. Placeholder 신청 모달 */}
      {modalOpen && (
        <div
          className="e26-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="e26-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="e26-modal">
            <button
              type="button"
              className="e26-modal-close"
              aria-label="닫기"
              onClick={closeModal}
            >
              ×
            </button>
            <div className="e26-modal-head">
              <div className="e26-modal-eyebrow">* 2026 런칭 파트너 신청</div>
              <h3 id="e26-modal-title" className="e26-modal-title">
                기본 정보를 알려주세요
              </h3>
              <p className="e26-modal-sub">
                업종 적합성 확인 후 1:1 안내드립니다. 모든 정보는 신청 검토 외 용도로 사용되지 않습니다.
              </p>
            </div>
            <form className="e26-modal-body" onSubmit={handleModalSubmit}>
              <input type="hidden" name="source" value={modalSource} />
              <div className="e26-field">
                <label className="e26-field-label" htmlFor="e26-name">이름</label>
                <input
                  id="e26-name"
                  name="name"
                  type="text"
                  className="e26-field-input"
                  placeholder="홍길동"
                  required
                />
              </div>
              <div className="e26-field">
                <label className="e26-field-label" htmlFor="e26-industry">업종</label>
                <select
                  id="e26-industry"
                  name="industry"
                  className="e26-field-select"
                  defaultValue=""
                  required
                >
                  <option value="" disabled>선택해주세요</option>
                  {INDUSTRY_OPTIONS.map(o => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="e26-field">
                <label className="e26-field-label" htmlFor="e26-region">지역</label>
                <input
                  id="e26-region"
                  name="region"
                  type="text"
                  className="e26-field-input"
                  placeholder="예: 천안 / 세종"
                  required
                />
              </div>
              <div className="e26-field">
                <span className="e26-field-label">홈페이지 유무</span>
                <div className="e26-radio-group" role="radiogroup">
                  {HAS_SITE_OPTIONS.map((o, i) => (
                    <label key={o.id} className="e26-radio">
                      <input
                        type="radio"
                        name="hasSite"
                        value={o.id}
                        defaultChecked={i === 0}
                      />
                      <span className="e26-radio-label">{o.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="e26-field">
                <label className="e26-field-label" htmlFor="e26-concern">지금 가장 큰 고민 (한 줄)</label>
                <textarea
                  id="e26-concern"
                  name="concern"
                  className="e26-field-textarea"
                  rows={2}
                  placeholder="예: 검색에서 안 나옵니다 / 콘텐츠를 어떻게 시작할지 모르겠어요"
                  required
                />
              </div>
              <div className="e26-field">
                <label className="e26-field-label" htmlFor="e26-phone">연락처</label>
                <input
                  id="e26-phone"
                  name="phone"
                  type="tel"
                  className="e26-field-input"
                  placeholder="010-0000-0000"
                  required
                />
              </div>
              <button type="submit" className="e26-submit">신청 보내기 →</button>
            </form>
          </div>
        </div>
      )}

      {/* 토스트 */}
      {toast && <div className="e26-toast" role="status">{toast}</div>}

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
