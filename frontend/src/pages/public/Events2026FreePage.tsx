import { useEffect, useState } from 'react';
import '../landing.css';
import { useSubPageNav } from './useSubPageNav';
import { EventSignupModal } from '../../components/EventSignupModal';
import { HeroVideoBox } from '../../components/HeroVideoBox';
import { SiteFooter } from '../../components/SiteFooter';

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

  // CORE 1 deployment card — closed by default; toggled by the chevron
  // button in the card header.
  const [coreOpen, setCoreOpen] = useState(false);

  // Event signup modal — `EVENT_01_FREE` is hardcoded for this page;
  // `signupSource` traces which CTA opened the modal.
  const [signupOpen, setSignupOpen] = useState(false);
  const [signupSource, setSignupSource] = useState('');
  const openSignup = (source: string) => {
    setSignupSource(source);
    setSignupOpen(true);
  };

  // ──────────────────────────────────────────────────────────────
  //  SCROLL-STEP PHASE ANIMATION
  //  Direct port of the events.html script: each [data-step] block's
  //  .scroll-step header lights up (number color → title color → desc
  //  opacity) as it crosses the viewport, fades out as the next block's
  //  header enters. Matching colors + thresholds from the source.
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const C_NUM_OFF: [number, number, number, number] = [196, 168, 245, 0.08];
    const C_NUM_ON: [number, number, number, number] = [107, 79, 184, 1];
    const C_TITLE_OFF: [number, number, number, number] = [10, 6, 20, 0.06];
    const C_TITLE_ON: [number, number, number, number] = [10, 6, 20, 1];

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
    const phase = (p: number, lo: number, hi: number) => clamp01((p - lo) / (hi - lo));
    const eio = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
    const lerpRgba = (
      from: [number, number, number, number],
      to: [number, number, number, number],
      t: number,
    ) => {
      const r = Math.round(lerp(from[0], to[0], t));
      const g = Math.round(lerp(from[1], to[1], t));
      const b = Math.round(lerp(from[2], to[2], t));
      const a = lerp(from[3], to[3], t).toFixed(3);
      return `rgba(${r},${g},${b},${a})`;
    };
    const headerProgress = (el: Element) => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const headerCenterY = rect.top + rect.height / 2;
      return clamp01(1 - headerCenterY / vh);
    };

    const stepBlocks = Array.from(document.querySelectorAll<HTMLElement>('.evtfree [data-step]'));
    if (stepBlocks.length === 0) return;

    const updateSteps = () => {
      stepBlocks.forEach((block, idx) => {
        const headerEl = block.querySelector<HTMLElement>('.scroll-step');
        if (!headerEl) return;

        const hp = headerProgress(headerEl);
        const numIn = eio(phase(hp, 0.25, 0.45));
        const titleIn = eio(phase(hp, 0.4, 0.6));
        const descIn = eio(phase(hp, 0.5, 0.7));

        let fadeOut = 0;
        const nextBlock = stepBlocks[idx + 1];
        if (nextBlock) {
          const nextHeader = nextBlock.querySelector<HTMLElement>('.scroll-step');
          if (nextHeader) {
            const nextHp = headerProgress(nextHeader);
            fadeOut = eio(phase(nextHp, 0.2, 0.45));
          }
        } else {
          fadeOut = eio(phase(hp, 0.95, 1.05));
        }

        const numVal = clamp01(numIn - fadeOut);
        const titleVal = clamp01(titleIn - fadeOut);
        const descVal = clamp01(descIn - fadeOut);

        const numEl = block.querySelector<HTMLElement>('.scroll-step-num');
        const titleEl = block.querySelector<HTMLElement>('.scroll-step-title');
        const descEl = block.querySelector<HTMLElement>('.scroll-step-desc');
        if (!numEl || !titleEl || !descEl) return;

        numEl.style.color = lerpRgba(C_NUM_OFF, C_NUM_ON, numVal);
        titleEl.style.color = lerpRgba(C_TITLE_OFF, C_TITLE_ON, titleVal);

        numEl.classList.toggle('lit', numVal > 0.5);
        titleEl.classList.toggle('lit', titleVal > 0.5);

        descEl.style.opacity = String(descVal);
        descEl.style.transform = `translateY(${(1 - descVal) * 12}px)`;
      });
    };

    let stepRaf = false;
    const onScroll = () => {
      if (stepRaf) return;
      stepRaf = true;
      requestAnimationFrame(() => {
        updateSteps();
        stepRaf = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateSteps);
    updateSteps();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', updateSteps);
    };
  }, []);

  // ──────────────────────────────────────────────────────────────
  //  FREE BUNDLE — auto-flip cycle (front ↔ back) for the 3 cards.
  //  IntersectionObserver pauses the cycle when the grid is offscreen.
  //  Timing matches the source: 1.2s initial delay, 0.4s stagger
  //  between cards, 4s back-face hold, 6s front-face hold, repeat.
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const grid = document.querySelector<HTMLElement>('.evtfree .free-bundle-grid');
    const cards = Array.from(document.querySelectorAll<HTMLElement>('.evtfree .free-card'));
    if (!grid || cards.length === 0) return;

    let inView = false;
    let cycleTimer: number | null = null;
    const staggerTimers: number[] = [];

    const flipAll = (toBack: boolean) => {
      staggerTimers.forEach(window.clearTimeout);
      staggerTimers.length = 0;
      cards.forEach((card, i) => {
        const t = window.setTimeout(() => {
          if (toBack) card.classList.add('flipped');
          else card.classList.remove('flipped');
        }, i * 400);
        staggerTimers.push(t);
      });
    };

    const stopCycle = () => {
      if (cycleTimer !== null) {
        window.clearTimeout(cycleTimer);
        cycleTimer = null;
      }
      staggerTimers.forEach(window.clearTimeout);
      staggerTimers.length = 0;
    };

    const cycle = () => {
      if (!inView) return;
      flipAll(true);
      // (cards.length - 1) * 400 stagger + 900ms flip duration + 4000ms back-face hold
      cycleTimer = window.setTimeout(() => {
        if (!inView) return;
        flipAll(false);
        // same stagger + flip + 6000ms front-face hold
        cycleTimer = window.setTimeout(cycle, (cards.length - 1) * 400 + 900 + 6000);
      }, (cards.length - 1) * 400 + 900 + 4000);
    };

    const startCycle = () => {
      if (cycleTimer !== null) return;
      cycleTimer = window.setTimeout(cycle, 1200);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            inView = true;
            startCycle();
          } else {
            inView = false;
            stopCycle();
          }
        });
      },
      { threshold: 0.15 },
    );
    observer.observe(grid);

    return () => {
      observer.disconnect();
      stopCycle();
      cards.forEach((c) => c.classList.remove('flipped'));
    };
  }, []);

  // ──────────────────────────────────────────────────────────────
  //  Reveal-on-scroll fade-in for the secondary card grids. Mirrors
  //  the events.html behavior so cards rise from translateY(20px).
  //  Initial styles are applied here (not in CSS) so a JS-disabled
  //  client still sees the cards.
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>(
        '.evtfree .event01-target, .evtfree .event01-coach-card, .evtfree .event01-result-card, .evtfree .benefit-card',
      ),
    );
    if (targets.length === 0) return;

    targets.forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            el.style.transition = `opacity .6s ease ${i * 0.05}s, transform .6s ease ${i * 0.05}s`;
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.12 },
    );
    targets.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

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

        /* ── 3 BENEFITS CARD GRID ── */
        .evtfree .benefits {
          background: var(--bg);
          padding-top: 120px;
          padding-bottom: 60px;
        }
        .evtfree .benefits-header { margin-bottom: 56px; }
        .evtfree .benefits-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          max-width: 1080px;
          margin: 0 auto;
        }
        .evtfree .benefit-card {
          background: var(--bg-soft);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 32px 28px;
          position: relative;
          transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
          min-height: 220px;
          display: flex; flex-direction: column;
        }
        .evtfree .benefit-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
          border-color: rgba(196,168,245,0.3);
        }
        .evtfree .benefit-card.violet { background: linear-gradient(180deg, #F5EFFF 0%, #FAF6FF 100%); border-color: rgba(196,168,245,0.25); }
        .evtfree .benefit-card.mint   { background: linear-gradient(180deg, #E8F7F0 0%, #F1FAF6 100%); border-color: rgba(127,200,166,0.25); }
        .evtfree .benefit-card.cream  { background: linear-gradient(180deg, #FBF6E8 0%, #FDFAF0 100%); border-color: rgba(220,180,90,0.2); }
        .evtfree .benefit-eyebrow {
          font-family: var(--font-en);
          font-size: 10px; font-weight: 700;
          letter-spacing: 1.5px;
          color: var(--text-muted);
          margin-bottom: 18px;
        }
        .evtfree .benefit-eyebrow .dot {
          display: inline-block; width: 4px; height: 4px;
          border-radius: 50%; background: var(--text-muted);
          margin: 0 8px; vertical-align: middle;
        }
        .evtfree .benefit-title {
          font-size: 20px; font-weight: 700;
          letter-spacing: -.6px;
          margin-bottom: 12px;
          line-height: 1.4;
          color: var(--text-primary);
        }
        .evtfree .benefit-desc {
          font-size: 13.5px;
          color: var(--text-secondary);
          line-height: 1.7;
          flex: 1;
        }
        .evtfree .benefit-foot {
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px dashed rgba(0,0,0,0.08);
          font-size: 12px;
          color: var(--text-muted);
          display: flex; align-items: center; gap: 6px;
        }
        .evtfree .benefit-foot::before {
          content: '→';
          color: var(--accent-dark);
          font-weight: 700;
        }

        /* ── EVENT 01 SECTION ── */
        .evtfree .event01 {
          background: var(--bg-soft);
          padding-top: 100px;
          padding-bottom: 100px;
          position: relative;
          overflow: hidden;
        }
        .evtfree .event01::before {
          content: '';
          position: absolute;
          top: -200px; left: 50%;
          transform: translateX(-50%);
          width: 800px; height: 400px;
          background: radial-gradient(ellipse, rgba(196,168,245,0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .evtfree .event01-inner {
          position: relative; z-index: 1;
          max-width: 1240px; margin: 0 auto;
        }

        /* ── FREE BUNDLE ── */
        .evtfree .free-bundle {
          max-width: 1240px;
          margin: 0 auto 80px;
          text-align: center;
        }
        .evtfree .free-bundle-eyebrow {
          display: inline-flex; align-items: center; gap: 10px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          padding: 8px 18px;
          border-radius: 100px;
          font-family: var(--font-en);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1.5px;
          color: var(--accent-deep);
          margin-bottom: 20px;
        }
        .evtfree .free-bundle-eyebrow .num {
          width: 22px; height: 22px;
          background: var(--accent);
          color: #fff;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px;
          font-weight: 800;
        }
        .evtfree .free-bundle-title {
          font-family: var(--font-ko);
          font-size: clamp(28px, 3.6vw, 42px);
          font-weight: 700;
          letter-spacing: -1.2px;
          color: var(--text-primary);
          line-height: 1.3;
          margin-bottom: 18px;
        }
        .evtfree .free-bundle-title .free { color: var(--accent-dark); }
        .evtfree .free-bundle-sub {
          font-size: 16px;
          color: var(--text-secondary);
          line-height: 1.75;
          margin: 0 auto 56px;
          max-width: 580px;
        }

        /* CORE 1 — 2단 구조 (상단 알림 + 하단 카드) */
        .evtfree .free-bundle-core {
          margin: -24px auto 56px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* 상단: 핵심 교육 알림 박스 */
        .evtfree .core-notice {
          display: flex; align-items: flex-start; gap: 14px;
          background: linear-gradient(135deg, rgba(196,168,245,0.16) 0%, rgba(155,184,248,0.12) 100%);
          border: 1px solid rgba(196,168,245,0.32);
          border-radius: var(--radius-lg);
          padding: 18px 24px;
        }
        .evtfree .core-notice-star {
          flex-shrink: 0;
          width: 28px; height: 28px;
          background: #FFE99A;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 6px rgba(255, 200, 80, 0.35);
          margin-top: 2px;
        }
        .evtfree .core-notice-star::before {
          content: '★';
          color: #E8A60E;
          font-size: 14px;
          line-height: 1;
        }
        .evtfree .core-notice-body { text-align: left; flex: 1; }
        .evtfree .core-notice-title {
          font-size: 15px; font-weight: 700;
          color: var(--accent-deep);
          letter-spacing: -.2px;
          margin-bottom: 4px;
          line-height: 1.4;
        }
        .evtfree .core-notice-sub {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.55;
          font-weight: 400;
        }

        /* 하단: CORE1 배포 카드 */
        .evtfree .core-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          text-align: left;
          transition: border-color .2s, box-shadow .2s;
          overflow: hidden;
        }
        .evtfree .core-card:hover {
          border-color: rgba(196,168,245,0.4);
          box-shadow: var(--shadow-md);
        }
        .evtfree .core-card-header {
          display: grid;
          grid-template-columns: auto 1fr auto auto;
          gap: 22px;
          align-items: center;
          padding: 22px 26px;
        }
        .evtfree .core-card-icon {
          width: 56px; height: 56px;
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent-deep) 100%);
          border-radius: var(--radius-md);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 14px rgba(139,111,212,0.3);
          flex-shrink: 0;
        }
        .evtfree .core-card-icon-text {
          font-family: var(--font-en);
          font-size: 12px;
          font-weight: 800;
          color: #fff;
          letter-spacing: .5px;
        }
        .evtfree .core-card-body { min-width: 0; }
        .evtfree .core-card-label {
          display: inline-flex;
          align-items: center;
          background: var(--accent-deep);
          color: #fff;
          font-family: var(--font-en);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .5px;
          padding: 4px 11px;
          border-radius: 6px;
          margin-bottom: 8px;
        }
        .evtfree .core-card-h {
          font-family: var(--font-ko);
          font-size: clamp(16px, 1.5vw, 18px);
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -.3px;
          margin-bottom: 10px;
          line-height: 1.4;
        }
        .evtfree .core-card-tags {
          display: flex; flex-wrap: wrap; gap: 6px;
        }
        .evtfree .core-card-tag {
          font-size: 12.5px;
          color: var(--text-muted);
          background: var(--bg-soft);
          border: 1px solid var(--border-soft);
          padding: 4px 10px;
          border-radius: 100px;
          font-weight: 500;
        }
        .evtfree .core-card-price {
          text-align: right;
          flex-shrink: 0;
          display: flex; align-items: center; gap: 6px;
        }
        .evtfree .core-card-price-strike {
          font-size: 13px;
          color: var(--text-muted);
          text-decoration: line-through;
          text-decoration-color: rgba(155,155,155,0.7);
          font-weight: 500;
        }
        .evtfree .core-card-price-arrow {
          color: var(--accent-dark);
          font-weight: 700;
          margin: 0 2px;
        }
        .evtfree .core-card-price-free {
          font-size: 17px;
          font-weight: 800;
          color: var(--accent-deep);
          letter-spacing: -.4px;
        }

        .evtfree .core-card-toggle {
          width: 38px; height: 38px;
          border-radius: 50%;
          background: var(--bg-soft);
          border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background .2s, border-color .2s, transform .3s;
          flex-shrink: 0;
          padding: 0;
          color: var(--accent-dark);
        }
        .evtfree .core-card-toggle:hover {
          background: var(--accent-light);
          border-color: rgba(196,168,245,0.4);
        }
        .evtfree .core-card-toggle svg {
          width: 16px; height: 16px;
          transition: transform .35s cubic-bezier(0.65, 0.05, 0.35, 1);
        }
        .evtfree .core-card-toggle[aria-expanded="true"] svg {
          transform: rotate(180deg);
        }

        .evtfree .core-card-expand {
          overflow: hidden;
          max-height: 0;
          transition: max-height .5s cubic-bezier(0.65, 0.05, 0.35, 1);
        }
        .evtfree .core-card-expand.open { max-height: 1500px; }
        .evtfree .core-card-expand-inner {
          border-top: 1px solid var(--border-soft);
          padding: 32px 30px 32px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 36px;
        }

        .evtfree .core-col-section + .core-col-section { margin-top: 26px; }
        .evtfree .core-col-h {
          display: inline-flex; align-items: center;
          background: var(--accent-deep);
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
          margin-bottom: 12px;
          letter-spacing: -.1px;
        }
        .evtfree .core-col-section.muted .core-col-h {
          background: var(--text-primary);
        }
        .evtfree .core-col-desc {
          font-size: 14.5px;
          color: var(--text-secondary);
          line-height: 1.75;
        }
        .evtfree .core-col-desc + .core-col-desc { margin-top: 14px; }

        .evtfree .core-col-list {
          list-style: none;
          display: flex; flex-direction: column;
          gap: 9px;
          padding: 0; margin: 0;
        }
        .evtfree .core-col-list.bullet li {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.6;
          padding-left: 16px;
          position: relative;
        }
        .evtfree .core-col-list.bullet li::before {
          content: '';
          position: absolute;
          left: 0; top: 9px;
          width: 5px; height: 5px;
          background: var(--accent);
          border-radius: 50%;
        }
        .evtfree .core-col-list.check li {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.6;
          padding-left: 22px;
          position: relative;
        }
        .evtfree .core-col-list.check li::before {
          content: '✓';
          position: absolute;
          left: 0; top: 0;
          color: var(--accent-dark);
          font-weight: 700;
          font-size: 13px;
        }

        .evtfree .core-col-chips {
          display: flex; flex-wrap: wrap; gap: 8px;
          margin-top: 4px;
        }
        .evtfree .core-col-chip {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--bg-soft);
          border: 1px solid var(--border-soft);
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 500;
          padding: 6px 12px;
          border-radius: 100px;
        }
        .evtfree .core-col-chip-icon { font-size: 14px; line-height: 1; }

        /* ── 3D FLIP CARDS (3 free cards) ── */
        .evtfree .free-bundle-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
          perspective: 1600px;
        }
        .evtfree .free-card {
          position: relative;
          min-height: 340px;
          transform-style: preserve-3d;
          transition: transform .9s cubic-bezier(0.65, 0.05, 0.35, 1);
          will-change: transform;
        }
        .evtfree .free-card.flipped { transform: rotateY(180deg); }

        .evtfree .free-face {
          position: absolute; inset: 0;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 36px 32px;
          display: flex; flex-direction: column;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          transition: box-shadow .25s ease, border-color .25s ease;
        }
        .evtfree .free-face.face-front { z-index: 2; }
        .evtfree .free-face.face-back {
          transform: rotateY(180deg);
          background: linear-gradient(160deg, var(--accent-deep) 0%, var(--accent-dark) 60%, #4A2D8F 100%);
          border-color: transparent;
          color: #fff;
          text-align: center;
          align-items: center;
          justify-content: center;
          padding: 36px 28px;
          overflow: hidden;
        }
        .evtfree .free-face.face-back::before {
          content: '';
          position: absolute;
          inset: -50%;
          background:
            radial-gradient(circle at 30% 20%, rgba(196,168,245,0.35) 0%, transparent 45%),
            radial-gradient(circle at 70% 80%, rgba(155,184,248,0.25) 0%, transparent 50%);
          pointer-events: none;
        }
        .evtfree .free-card:hover .free-face { box-shadow: var(--shadow-md); }

        .evtfree .free-card-head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 24px;
        }
        .evtfree .free-card-icon {
          font-family: var(--font-en);
          font-size: 32px;
          font-weight: 800;
          color: var(--accent-dark);
          letter-spacing: -1.5px;
          line-height: 1;
        }
        .evtfree .free-card-icon-unit {
          font-size: 16px;
          font-weight: 600;
          color: var(--accent);
          margin-left: 2px;
        }
        .evtfree .free-card-badge {
          font-family: var(--font-en);
          font-size: 10px;
          font-weight: 800;
          color: #fff;
          background: var(--accent-dark);
          padding: 5px 11px;
          border-radius: 100px;
          letter-spacing: 1.2px;
        }
        .evtfree .free-card-label {
          font-family: var(--font-en);
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
          letter-spacing: .5px;
          margin-bottom: 14px;
          text-transform: uppercase;
        }
        .evtfree .free-card-h {
          font-family: var(--font-ko);
          font-size: clamp(22px, 2.4vw, 28px);
          font-weight: 700;
          letter-spacing: -.8px;
          color: var(--text-primary);
          margin-bottom: 22px;
          line-height: 1.3;
        }
        .evtfree .free-card-list {
          list-style: none;
          display: flex; flex-direction: column;
          gap: 12px;
          margin: auto 0 0;
          padding: 0;
        }
        .evtfree .free-card-list li {
          font-size: 15.5px;
          color: var(--text-secondary);
          line-height: 1.6;
          padding-left: 16px;
          position: relative;
          font-weight: 400;
        }
        .evtfree .free-card-list li::before {
          content: '';
          position: absolute;
          left: 0; top: 11px;
          width: 5px; height: 5px;
          background: var(--accent);
          border-radius: 50%;
        }

        /* BACK FACE — 임팩트 메시지 */
        .evtfree .face-back-eyebrow {
          font-family: var(--font-en);
          font-size: 11px;
          font-weight: 700;
          color: rgba(255,255,255,0.6);
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 24px;
          position: relative; z-index: 1;
        }
        .evtfree .face-back-strike {
          font-family: var(--font-en);
          font-size: 22px;
          font-weight: 600;
          color: rgba(255,255,255,0.45);
          text-decoration: line-through;
          text-decoration-color: rgba(255,255,255,0.5);
          text-decoration-thickness: 2px;
          margin-bottom: 8px;
          position: relative; z-index: 1;
        }
        .evtfree .face-back-arrow {
          font-size: 20px;
          color: rgba(255,255,255,0.6);
          margin-bottom: 8px;
          position: relative; z-index: 1;
          line-height: 1;
        }
        .evtfree .face-back-headline {
          font-family: var(--font-en);
          font-size: clamp(48px, 5.5vw, 68px);
          font-weight: 800;
          color: #fff;
          letter-spacing: -2.5px;
          line-height: 1;
          margin-bottom: 10px;
          position: relative; z-index: 1;
        }
        .evtfree .face-back-headline .unit {
          font-size: 0.5em;
          font-weight: 600;
          color: var(--accent);
          margin-left: 4px;
          letter-spacing: -1px;
        }
        .evtfree .face-back-caption {
          font-size: 14px;
          font-weight: 500;
          color: rgba(255,255,255,0.78);
          line-height: 1.6;
          margin-top: 14px;
          max-width: 220px;
          position: relative; z-index: 1;
        }

        /* ── EVENT 01 — INTRO + STATS ── */
        .evtfree .event01 .section-h2 { margin-bottom: 16px; }
        .evtfree .event01-lead {
          font-family: var(--font-ko);
          text-align: center;
          font-size: 16px;
          color: var(--text-secondary);
          line-height: 1.8;
          max-width: 580px;
          margin: 0 auto 64px;
        }
        .evtfree .event01-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          max-width: 720px;
          margin: 0 auto 80px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 28px 0;
          box-shadow: var(--shadow-sm);
        }
        .evtfree .event01-stat {
          text-align: center;
          padding: 8px 24px;
          border-right: 1px solid var(--border-soft);
        }
        .evtfree .event01-stat:last-child { border-right: none; }
        .evtfree .event01-stat-num {
          font-family: var(--font-en);
          font-size: 32px;
          font-weight: 800;
          color: var(--accent-dark);
          line-height: 1;
          margin-bottom: 6px;
          letter-spacing: -1px;
        }
        .evtfree .event01-stat-num-unit {
          font-size: 18px;
          color: var(--accent);
        }
        .evtfree .event01-stat-label {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 500;
        }

        /* ── EVENT 01 — BLOCK 2 (자격 / 진행) ── */
        .evtfree .event01-block { margin-bottom: 80px; }
        .evtfree .event01-block-h {
          font-family: var(--font-ko);
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -.6px;
          margin-bottom: 8px;
          color: var(--text-primary);
          text-align: center;
        }
        .evtfree .event01-block-sub {
          text-align: center;
          font-size: 14px;
          color: var(--text-secondary);
          margin-bottom: 40px;
          line-height: 1.7;
        }

        /*
          SCROLL-STEP — dim by default; the Phase 3.4 useEffect light
          them up via inline styles as each header crosses the viewport.
          Without JS the content is still readable (numbers/title fade
          back in via the noscript fallback below the style block).
        */
        .evtfree .scroll-step {
          min-height: 50vh;
          display: flex; flex-direction: column;
          align-items: center; justify-content: flex-end;
          text-align: center;
          padding: 40px 24px 24px;
          position: relative;
        }
        .evtfree .scroll-step-num {
          font-family: var(--font-en);
          font-size: clamp(56px, 9vw, 96px);
          font-weight: 800;
          line-height: 1;
          letter-spacing: -3px;
          color: rgba(196,168,245,0.08);
          margin-bottom: 20px;
          will-change: color;
          position: relative;
        }
        .evtfree .scroll-step-num::after {
          content: '';
          position: absolute;
          left: 50%;
          bottom: -12px;
          transform: translateX(-50%) scaleX(0);
          width: 48px;
          height: 2px;
          background: var(--accent);
          border-radius: 2px;
          transform-origin: center;
          transition: transform .4s ease;
          will-change: transform;
        }
        .evtfree .scroll-step-num.lit::after { transform: translateX(-50%) scaleX(1); }
        .evtfree .scroll-step-title {
          font-family: var(--font-ko);
          font-size: clamp(26px, 3.6vw, 40px);
          font-weight: 700;
          letter-spacing: -1.2px;
          line-height: 1.3;
          margin: 0 auto 28px;
          color: rgba(10,6,20,0.06);
          will-change: color;
          max-width: 720px;
        }
        .evtfree .scroll-step-title .em {
          color: inherit;
          transition: color .3s ease;
        }
        .evtfree .scroll-step-title.lit .em { color: var(--accent-dark); }
        .evtfree .scroll-step-desc {
          font-size: 16px;
          line-height: 1.8;
          color: var(--text-secondary);
          max-width: 520px;
          margin: 0 auto;
          opacity: 0;
          transform: translateY(12px);
          will-change: opacity, transform;
        }
        .evtfree .scroll-step-content {
          margin-top: 32px;
          padding-bottom: 60px;
        }

        /* 이런 분께 — chip list */
        .evtfree .event01-targets {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          max-width: 920px;
          margin: 0 auto;
        }
        .evtfree .event01-target {
          display: flex; align-items: flex-start; gap: 12px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 18px 20px;
          transition: border-color .2s, transform .2s;
        }
        .evtfree .event01-target:hover {
          border-color: rgba(196,168,245,0.35);
          transform: translateY(-2px);
        }
        .evtfree .event01-target-icon {
          width: 28px; height: 28px;
          border-radius: 50%;
          background: var(--accent-light);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .evtfree .event01-target-icon svg {
          width: 14px; height: 14px;
          stroke: var(--accent-dark);
          stroke-width: 2.5;
          fill: none;
        }
        .evtfree .event01-target-text {
          font-family: var(--font-ko);
          font-size: 16.5px;
          color: var(--text-primary);
          line-height: 1.6;
          font-weight: 500;
          margin: 0;
        }

        /* 진행 단계 — timeline */
        .evtfree .event01-flow {
          max-width: 1240px;
          margin: 0 auto;
        }
        .evtfree .event01-flow-title {
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 32px;
        }
        .evtfree .event01-flow-title-pill {
          background: var(--accent-light);
          color: var(--accent-deep);
          padding: 7px 18px;
          border-radius: 100px;
          font-family: var(--font-en);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1.5px;
        }
        .evtfree .event01-flow-list {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          position: relative;
        }
        .evtfree .event01-flow-list::before {
          content: '';
          position: absolute;
          top: 38px;
          left: 12%; right: 12%;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, var(--accent) 20%, var(--accent) 80%, transparent 100%);
          opacity: 0.35;
          z-index: 0;
        }
        .evtfree .event01-flow-item {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 28px 24px;
          position: relative;
          z-index: 1;
          transition: border-color .2s, transform .2s, box-shadow .2s;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 14px;
        }
        .evtfree .event01-flow-item:hover {
          border-color: rgba(196,168,245,0.4);
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
        }
        .evtfree .event01-flow-num {
          font-family: var(--font-en);
          font-size: 12px;
          font-weight: 800;
          color: var(--accent-dark);
          letter-spacing: 1.2px;
          background: var(--accent-light);
          padding: 6px 12px;
          border-radius: 100px;
        }
        .evtfree .event01-flow-body strong {
          display: block;
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 10px;
          letter-spacing: -.3px;
          line-height: 1.4;
        }
        .evtfree .event01-flow-body span {
          font-size: 17px;
          color: var(--text-secondary);
          line-height: 1.65;
          display: block;
        }
        .evtfree .event01-flow-time {
          display: inline-block;
          margin-top: 10px;
          font-family: var(--font-en);
          font-size: 11px;
          font-weight: 700;
          color: var(--accent-deep);
          background: var(--accent-light);
          padding: 4px 11px;
          border-radius: 100px;
          letter-spacing: .3px;
        }

        .evtfree .event01-easy {
          text-align: center;
          margin: 32px auto 0;
          max-width: 720px;
          font-size: 13.5px;
          color: var(--text-muted);
          line-height: 1.7;
          font-style: italic;
        }
        .evtfree .event01-easy::before { content: '“ '; opacity: .5; }
        .evtfree .event01-easy::after { content: ' ”'; opacity: .5; }

        /* 1:1 코칭 — dual block */
        .evtfree .event01-coaching {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          max-width: 920px;
          margin: 0 auto;
        }
        .evtfree .event01-coach-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 40px 36px;
          position: relative;
          transition: border-color .2s, transform .2s;
        }
        .evtfree .event01-coach-card:hover {
          border-color: rgba(196,168,245,0.4);
          transform: translateY(-3px);
        }
        .evtfree .event01-coach-time {
          font-family: var(--font-en);
          font-size: 36px;
          font-weight: 800;
          color: var(--accent-dark);
          letter-spacing: -1.5px;
          line-height: 1;
          margin-bottom: 6px;
        }
        .evtfree .event01-coach-time-unit {
          font-size: 18px;
          font-weight: 600;
          color: var(--accent);
          margin-left: 2px;
        }
        .evtfree .event01-coach-label {
          font-family: var(--font-en);
          font-size: 12px; font-weight: 600;
          color: var(--text-muted);
          letter-spacing: .5px;
          margin-bottom: 18px;
          text-transform: uppercase;
        }
        .evtfree .event01-coach-h {
          font-family: var(--font-ko);
          font-size: clamp(24px, 2.6vw, 30px);
          font-weight: 700;
          margin-bottom: 18px;
          letter-spacing: -.8px;
          line-height: 1.3;
          color: var(--text-primary);
        }
        .evtfree .event01-coach-list {
          list-style: none;
          display: flex; flex-direction: column;
          gap: 10px;
          padding: 0; margin: 0;
        }
        .evtfree .event01-coach-list li {
          font-size: 18.5px;
          color: var(--text-secondary);
          line-height: 1.65;
          padding-left: 18px;
          position: relative;
          font-weight: 400;
        }
        .evtfree .event01-coach-list li::before {
          content: '';
          position: absolute;
          left: 0; top: 13px;
          width: 6px; height: 6px;
          background: var(--accent);
          border-radius: 50%;
        }
        .evtfree .event01-coach-total {
          text-align: center;
          margin: 28px auto 0;
          font-size: 14px;
          color: var(--text-secondary);
        }
        .evtfree .event01-coach-total strong {
          color: var(--accent-dark);
          font-weight: 700;
        }

        /* ── BLOCK 3 — 결과물 ── */
        .evtfree .event01-results {
          margin-top: 100px;
          padding-top: 80px;
          border-top: 1px solid var(--border-soft);
          text-align: center;
        }
        .evtfree .event01-results-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          max-width: 1080px;
          margin: 0 auto;
          text-align: left;
        }
        .evtfree .event01-result-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 40px 32px;
          transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
          position: relative;
          overflow: hidden;
        }
        .evtfree .event01-result-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
          border-color: rgba(196,168,245,0.3);
        }
        .evtfree .event01-result-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 4px; height: 0;
          background: linear-gradient(180deg, var(--accent), var(--accent-mid));
          transition: height .3s ease;
        }
        .evtfree .event01-result-card:hover::before { height: 100%; }
        .evtfree .event01-result-num {
          font-family: var(--font-en);
          font-size: 14px;
          font-weight: 800;
          color: var(--accent-dark);
          letter-spacing: 1px;
          margin-bottom: 16px;
          display: flex; align-items: center; gap: 8px;
        }
        .evtfree .event01-result-num::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border);
        }
        .evtfree .event01-result-h {
          font-family: var(--font-ko);
          font-size: clamp(22px, 2.4vw, 28px);
          font-weight: 700;
          letter-spacing: -.8px;
          margin-bottom: 18px;
          line-height: 1.3;
          color: var(--text-primary);
        }
        .evtfree .event01-result-list {
          list-style: none;
          display: flex; flex-direction: column;
          gap: 12px;
          padding: 0; margin: 0;
        }
        .evtfree .event01-result-list li {
          font-size: 18.5px;
          color: var(--text-secondary);
          line-height: 1.65;
          padding-left: 26px;
          position: relative;
          font-weight: 400;
        }
        .evtfree .event01-result-list li::before {
          content: '✓';
          position: absolute;
          left: 0; top: 0;
          color: var(--accent-dark);
          font-weight: 700;
          font-size: 16px;
        }
        .evtfree .event01-result-list li.note {
          margin-top: 8px;
          padding: 14px 16px 14px 18px;
          background: var(--accent-light);
          border-radius: var(--radius-sm);
          color: var(--accent-deep);
          font-size: 16.5px;
          font-style: italic;
          line-height: 1.6;
        }
        .evtfree .event01-result-list li.note::before { display: none; }
        .evtfree .event01-result-list li.highlight {
          color: var(--text-primary);
          font-weight: 500;
        }

        /* ── EVENT 01 CTA ── */
        .evtfree .event01-cta {
          margin-top: 64px;
          text-align: center;
        }
        .evtfree .event01-cta-row {
          display: inline-flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .evtfree .event01-btn {
          display: inline-flex; align-items: center; gap: 10px;
          background: var(--accent-dark);
          color: #fff;
          padding: 16px 30px;
          border-radius: var(--radius-md);
          font-size: 15px;
          font-weight: 700;
          text-decoration: none;
          border: 1.5px solid transparent;
          cursor: pointer;
          transition: background .2s, transform .15s, box-shadow .2s, border-color .2s, color .2s;
          box-shadow: 0 6px 20px rgba(139,111,212,0.25);
          font-family: var(--font-ko);
        }
        .evtfree .event01-btn:hover {
          background: var(--accent-deep);
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(139,111,212,0.35);
        }
        .evtfree .event01-btn.secondary {
          background: var(--bg-card);
          color: var(--text-primary);
          border-color: var(--border);
          box-shadow: none;
        }
        .evtfree .event01-btn.secondary:hover {
          border-color: var(--accent);
          background: var(--bg-soft);
          box-shadow: var(--shadow-sm);
        }
        .evtfree .event01-btn-arrow { transition: transform .2s; display: inline-block; }
        .evtfree .event01-btn:hover .event01-btn-arrow { transform: translateX(3px); }

        .evtfree .event01-cta-note {
          margin-top: 18px;
          font-size: 12.5px;
          color: var(--text-muted);
          letter-spacing: .2px;
        }

        /* ── CROSS-LINK ── */
        .evtfree .cross-link {
          background: #0A0614;
          padding: 80px 40px 100px;
          position: relative;
          overflow: hidden;
        }
        .evtfree .cross-link::before {
          content: '';
          position: absolute;
          top: -200px; right: -100px;
          width: 600px; height: 400px;
          background: radial-gradient(ellipse, rgba(196,168,245,0.18) 0%, transparent 65%);
          pointer-events: none;
        }
        .evtfree .cross-link::after {
          content: '';
          position: absolute;
          bottom: -150px; left: -80px;
          width: 500px; height: 350px;
          background: radial-gradient(ellipse, rgba(155,184,248,0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .evtfree .cross-link-inner {
          position: relative; z-index: 1;
          max-width: 1100px;
          margin: 0 auto;
          text-align: center;
        }
        .evtfree .cross-link-eyebrow {
          display: inline-flex; align-items: center; gap: 10px;
          font-family: var(--font-en);
          font-size: 12px;
          font-weight: 700;
          color: rgba(255,255,255,0.55);
          letter-spacing: 1.8px;
          text-transform: uppercase;
          margin-bottom: 18px;
        }
        .evtfree .cross-link-eyebrow::before,
        .evtfree .cross-link-eyebrow::after {
          content: ''; width: 24px; height: 1px;
          background: rgba(255,255,255,0.3);
        }
        .evtfree .cross-link-h {
          font-family: var(--font-ko);
          font-size: clamp(24px, 3vw, 36px);
          font-weight: 700;
          color: #fff;
          letter-spacing: -1px;
          line-height: 1.35;
          margin-bottom: 18px;
        }
        .evtfree .cross-link-h .em { color: var(--accent); }
        .evtfree .cross-link-sub {
          font-size: 16px;
          color: rgba(255,255,255,0.7);
          line-height: 1.75;
          max-width: 560px;
          margin: 0 auto 40px;
        }
        .evtfree .cross-card {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 24px;
          align-items: center;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: var(--radius-xl);
          padding: 28px 32px;
          text-decoration: none;
          transition: background .3s, border-color .3s, transform .25s;
          text-align: left;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .evtfree .cross-card:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(196,168,245,0.45);
          transform: translateY(-3px);
        }
        .evtfree .cross-card-badge {
          width: 64px; height: 64px;
          border-radius: 16px;
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent-deep) 100%);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          box-shadow: 0 6px 20px rgba(139,111,212,0.4);
          flex-shrink: 0;
        }
        .evtfree .cross-card-badge-num {
          font-family: var(--font-en);
          font-size: 22px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -.5px;
          line-height: 1;
        }
        .evtfree .cross-card-badge-tag {
          font-family: var(--font-en);
          font-size: 9px;
          font-weight: 700;
          color: rgba(255,255,255,0.85);
          letter-spacing: 1.2px;
          margin-top: 4px;
        }
        .evtfree .cross-card-body { min-width: 0; }
        .evtfree .cross-card-pkg {
          font-family: var(--font-en);
          font-size: 11px;
          font-weight: 800;
          color: var(--accent);
          letter-spacing: 1.5px;
          margin-bottom: 6px;
        }
        .evtfree .cross-card-h {
          font-family: var(--font-ko);
          font-size: clamp(18px, 2vw, 22px);
          font-weight: 700;
          color: #fff;
          letter-spacing: -.5px;
          line-height: 1.35;
          margin-bottom: 6px;
        }
        .evtfree .cross-card-desc {
          font-size: 14.5px;
          color: rgba(255,255,255,0.62);
          line-height: 1.55;
        }
        .evtfree .cross-card-arrow {
          width: 48px; height: 48px;
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          flex-shrink: 0;
          transition: background .25s, transform .25s, border-color .25s;
        }
        .evtfree .cross-card:hover .cross-card-arrow {
          background: var(--accent);
          border-color: var(--accent);
          transform: translateX(3px);
        }
        .evtfree .cross-card-arrow svg { width: 18px; height: 18px; }

        @media (max-width: 900px) {
          .evtfree section { padding: 80px 24px; }
          .evtfree .hero { padding: 120px 24px 60px; min-height: auto; }
          .evtfree .hero-prism { width: 160px; height: 160px; }
          .evtfree .benefits-grid { grid-template-columns: 1fr; }
          .evtfree .free-bundle-grid { grid-template-columns: 1fr; }
          .evtfree .free-bundle { margin-bottom: 56px; }
          .evtfree .free-face { padding: 28px 24px; }
          .evtfree .free-bundle-core { margin: -16px auto 40px; }
          .evtfree .core-card-header { grid-template-columns: auto 1fr auto; gap: 14px; padding: 18px 20px; }
          .evtfree .core-card-toggle { grid-column: 3; }
          .evtfree .core-card-price { grid-column: 1 / -1; justify-content: flex-end; padding-top: 10px; border-top: 1px dashed var(--border); }
          .evtfree .core-card-expand-inner { grid-template-columns: 1fr; gap: 26px; padding: 24px 22px; }
          .evtfree .core-notice { padding: 16px 20px; }
          .evtfree .core-notice-title { font-size: 14px; }
          .evtfree .core-notice-sub { font-size: 13px; }
          .evtfree .event01-stats { grid-template-columns: 1fr; padding: 8px 0; }
          .evtfree .event01-stat { border-right: none; border-bottom: 1px solid var(--border-soft); padding: 18px; }
          .evtfree .event01-stat:last-child { border-bottom: none; }
          .evtfree .event01-targets { grid-template-columns: 1fr; }
          .evtfree .event01-coaching { grid-template-columns: 1fr; }
          .evtfree .event01-flow-list { grid-template-columns: repeat(2, 1fr); }
          .evtfree .event01-flow-list::before { display: none; }
          .evtfree .event01-flow-item { padding: 22px 18px; }
          .evtfree .scroll-step { min-height: 40vh; padding: 30px 24px 16px; }
          .evtfree .scroll-step-content { margin-top: 20px; }
          .evtfree .event01-results-grid { grid-template-columns: 1fr; }
          .evtfree .event01-results { margin-top: 64px; padding-top: 56px; }
          .evtfree .cross-link { padding: 60px 24px 80px; }
          .evtfree .cross-card { grid-template-columns: auto 1fr; gap: 16px; padding: 22px 22px; }
          .evtfree .cross-card-arrow { grid-column: 1 / -1; justify-self: flex-end; width: 40px; height: 40px; }
          .evtfree .cross-card-h { font-size: 18px; }
          .evtfree .cross-card-badge { width: 56px; height: 56px; }
        }
        @media (max-width: 480px) {
          .evtfree .hero-h1 { letter-spacing: -1.5px; }
          .evtfree .section-h2 { letter-spacing: -.8px; }
          .evtfree .event01-flow-list { grid-template-columns: 1fr; }
          .evtfree .event01-cta-row { flex-direction: column; width: 100%; }
          .evtfree .event01-btn { width: 100%; justify-content: center; }
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
                <a href="/events2026/first" role="menuitem">첫완성패키지</a>
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
          <a href="/events2026/first" className="nmm-link nmm-sublink">└ 첫완성패키지</a>
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

            <HeroVideoBox />
          </div>
        </section>

        {/* ── 3 BENEFITS GRID ── */}
        <section className="benefits">
          <div className="section-inner">
            <div className="benefits-header">
              <div className="section-eyebrow">한눈에 보기</div>
              <h2 className="section-h2">
                이번 이벤트는<br /><span className="em">세 가지 혜택</span>으로 구성됩니다
              </h2>
              <p className="section-sub" style={{ marginTop: 14 }}>
                모두를 위한 이벤트가 아닙니다. 무료, 할인도, 검색 미션도 — 준비 같은 것은 안에서 시작됩니다.
              </p>
            </div>

            <div className="benefits-grid">
              <article className="benefit-card violet">
                <div className="benefit-eyebrow">CASE A <span className="dot"></span> 한정 무료</div>
                <h3 className="benefit-title">런칭 파트너 (무료)</h3>
                <p className="benefit-desc">이미 콘텐츠가 있는 분, 사장 자동화 기반을 만들고 싶은 분</p>
                <div className="benefit-foot">자격 검토 · 기간 한정</div>
              </article>

              <article className="benefit-card mint">
                <div className="benefit-eyebrow">CASE B <span className="dot"></span> 할인가</div>
                <h3 className="benefit-title">실전 패키지 (10만원)</h3>
                <p className="benefit-desc">홈페이지 내용부터 함께 짜야 할 분, 기존 사이트를 SEO로 개선할 분</p>
                <div className="benefit-foot">누구나 신청 가능 / 정가 30만원</div>
              </article>

              <article className="benefit-card cream">
                <div className="benefit-eyebrow">CASE C <span className="dot"></span> 동반</div>
                <h3 className="benefit-title">공동 — 디렉토리 SEO 네트워크</h3>
                <p className="benefit-desc">업종 카테고리에 맞는 검색 위치 검색 네트워크에 함께 노출</p>
                <div className="benefit-foot">수수료 없음 · 추후 동참 · 검색 결과 공동</div>
              </article>
            </div>
          </div>
        </section>

        {/* ── EVENT 01 SECTION ── */}
        <section className="event01" id="event01">
          <div className="event01-inner">

            {/* ── FREE BUNDLE (3가지 무료 제공) ── */}
            <div className="free-bundle">
              <div className="free-bundle-eyebrow">
                <span className="num">1</span>
                <span>EVENT 01</span>
              </div>
              <h3 className="free-bundle-title">
                3가지를 <span className="free">전부 무료</span>로<br />받아가시는 이벤트입니다
              </h3>
              <p className="free-bundle-sub">
                평소 정가로 제공되는 AISEO 핵심 3종 패키지 —<br />이번 한정으로 전체 무료
              </p>

              <div className="free-bundle-core">
                {/* 상단: 핵심 교육 알림 */}
                <div className="core-notice">
                  <div className="core-notice-star" aria-hidden="true"></div>
                  <div className="core-notice-body">
                    <div className="core-notice-title">CORE 1 — 핵심 교육</div>
                    <div className="core-notice-sub">사이트를 실제로 웹에 올리는 핵심 실습입니다</div>
                  </div>
                </div>

                {/*
                  하단: CORE1 배포 카드. Phase 3.2 ships the panel
                  rendered EXPANDED (`aria-expanded="true"` + `.open`)
                  so its content is visible while the toggle handler
                  is still pending in Phase 3.4.
                */}
                <div className="core-card">
                  <div className="core-card-header">
                    <div className="core-card-icon">
                      <span className="core-card-icon-text">CORE1</span>
                    </div>
                    <div className="core-card-body">
                      <span className="core-card-label">CORE 1 · Deployment</span>
                      <h4 className="core-card-h">AI 홈페이지 즉시 배포 + 기술적 SEO 셋팅</h4>
                      <div className="core-card-tags">
                        <span className="core-card-tag">#즉시배포</span>
                        <span className="core-card-tag">#서치콘솔</span>
                        <span className="core-card-tag">#GA4연동</span>
                        <span className="core-card-tag">#기술적SEO</span>
                      </div>
                    </div>
                    <div className="core-card-price">
                      <span className="core-card-price-strike">10만원</span>
                      <span className="core-card-price-arrow">→</span>
                      <span className="core-card-price-free">무료</span>
                    </div>
                    <button
                      type="button"
                      className="core-card-toggle"
                      aria-expanded={coreOpen}
                      aria-controls="evtfree-core-expand-1"
                      aria-label={coreOpen ? '접기' : '자세히 보기'}
                      onClick={() => setCoreOpen((v) => !v)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                  </div>

                  <div
                    className={`core-card-expand${coreOpen ? ' open' : ''}`}
                    id="evtfree-core-expand-1"
                  >
                    <div className="core-card-expand-inner">
                      {/* 좌 컬럼: 설명 + 추천 대상 */}
                      <div>
                        <div className="core-col-section">
                          <p className="core-col-desc">
                            AI로 만든 홈페이지를 실제 웹 주소에 올리는 것에서 끝나지 않습니다. 배포 직후 검색엔진이 내 사이트를 제대로 인식하고 데이터를 쌓을 수 있도록, Google Search Console · GA4 · 네이버 서치어드바이저 연동까지 원클릭 셋팅으로 한 번에 완성합니다.
                          </p>
                          <p className="core-col-desc">
                            ZIP 업로드부터 서브도메인 배포, 기술적 SEO 설정, 측정 코드 삽입까지 — 교육 당일 실제로 공개 가능한 URL과 데이터 수집 환경이 동시에 만들어집니다.
                          </p>
                        </div>

                        <div className="core-col-section">
                          <span className="core-col-h">이런 분께 추천합니다</span>
                          <ul className="core-col-list bullet">
                            <li>AI 도구로 홈페이지를 만들었지만 올리는 방법을 모르는 분</li>
                            <li>배포는 됐는데 Search Console · GA4가 연결이 안 된 분</li>
                            <li>검색 노출 기반을 처음부터 제대로 잡고 싶은 분</li>
                          </ul>
                        </div>
                      </div>

                      {/* 우 컬럼: 배우게 되는 것 + 진행 방식 */}
                      <div>
                        <div className="core-col-section">
                          <span className="core-col-h">배우게 되는 것</span>
                          <ul className="core-col-list check">
                            <li>AWS S3 버킷 생성 및 정적 웹 호스팅 · 서브도메인 배포</li>
                            <li>기술적 SEO — 메타 태그 · robots.txt · sitemap.xml 설정</li>
                            <li>Google Search Console 연동 · 소유권 인증 · 색인 요청</li>
                            <li>GA4 설치 · 기본 이벤트 수집 확인</li>
                            <li>네이버 서치어드바이저 등록 · 사이트맵 제출</li>
                            <li>배포 후 수정사항 재업로드 방법</li>
                          </ul>
                        </div>

                        <div className="core-col-section muted">
                          <span className="core-col-h">진행 방식</span>
                          <div className="core-col-chips">
                            <span className="core-col-chip"><span className="core-col-chip-icon">⏱</span>약 90~120분</span>
                            <span className="core-col-chip"><span className="core-col-chip-icon">💻</span>화상 실습</span>
                            <span className="core-col-chip"><span className="core-col-chip-icon">📋</span>SEO 셋팅 체크리스트</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/*
                3 FREE CARDS. Phase 3.2 renders the front face only;
                back-face markup is included so Phase 3.4's auto-flip
                cycle can toggle the .flipped class without further
                markup changes.
              */}
              <div className="free-bundle-grid">
                <article className="free-card" data-card="0">
                  <div className="free-face face-front">
                    <div className="free-card-head">
                      <div className="free-card-icon">01<span className="free-card-icon-unit">.</span></div>
                      <span className="free-card-badge">FREE</span>
                    </div>
                    <div className="free-card-label">PART 01 · BUILD</div>
                    <h4 className="free-card-h">AI 홈페이지 제작</h4>
                    <ul className="free-card-list">
                      <li>업종 맞춤 프롬프트 제공</li>
                      <li>디자인 템플릿 파일 제공</li>
                      <li>1시간 안에 완성 가능</li>
                      <li>1:1 라이브 코칭 동반</li>
                    </ul>
                  </div>
                  <div className="free-face face-back">
                    <div className="face-back-eyebrow">PART 01 · BUILD</div>
                    <div className="face-back-strike">정가 30만원</div>
                    <div className="face-back-arrow">↓</div>
                    <div className="face-back-headline">0<span className="unit">원</span></div>
                    <p className="face-back-caption">1시간 안에 내 사이트가 완성됩니다</p>
                  </div>
                </article>

                <article className="free-card" data-card="1">
                  <div className="free-face face-front">
                    <div className="free-card-head">
                      <div className="free-card-icon">02<span className="free-card-icon-unit">.</span></div>
                      <span className="free-card-badge">FREE</span>
                    </div>
                    <div className="free-card-label">PART 02 · DEPLOY</div>
                    <h4 className="free-card-h">도메인 &amp; 호스팅</h4>
                    <ul className="free-card-list">
                      <li>12개월 무료 서브도메인</li>
                      <li>1G 웹호스팅 무료 제공</li>
                      <li>SSL 보안 인증서 자동 적용</li>
                      <li>yourname.aiseo.tips 형태</li>
                    </ul>
                  </div>
                  <div className="free-face face-back">
                    <div className="face-back-eyebrow">PART 02 · DEPLOY</div>
                    <div className="face-back-strike">월 1.2만원 × 12</div>
                    <div className="face-back-arrow">↓</div>
                    <div className="face-back-headline">12<span className="unit">개월</span></div>
                    <p className="face-back-caption">호스팅 · 도메인 · SSL 모두 무료</p>
                  </div>
                </article>

                <article className="free-card" data-card="2">
                  <div className="free-face face-front">
                    <div className="free-card-head">
                      <div className="free-card-icon">03<span className="free-card-icon-unit">.</span></div>
                      <span className="free-card-badge">FREE</span>
                    </div>
                    <div className="free-card-label">PART 03 · CONNECT</div>
                    <h4 className="free-card-h">SEO 핵심강의</h4>
                    <ul className="free-card-list">
                      <li>sitemap · robots · 메타태그</li>
                      <li>네이버 · 구글 등록 노출 전략</li>
                      <li>키워드 리서치 실전 가이드</li>
                      <li>강의 후 즉시 적용 체크리스트</li>
                    </ul>
                  </div>
                  <div className="free-face face-back">
                    <div className="face-back-eyebrow">PART 03 · CONNECT</div>
                    <div className="face-back-strike">정가 10만원</div>
                    <div className="face-back-arrow">↓</div>
                    <div className="face-back-headline">10<span className="unit">년</span></div>
                    <p className="face-back-caption">노하우를 핵심만 쏙쏙 1시간으로</p>
                  </div>
                </article>
              </div>
            </div>

            {/* Phase 3.3 — INTRO + STATS + 5 targets + scroll-step 01·02 */}

            {/* INTRO */}
            <h2 className="section-h2">
              아무에게나 드리는<br />
              이벤트가 <span className="em">아닙니다</span>
            </h2>
            <p className="event01-lead">
              자기만의 비즈니스를 꾸준히 만들어오신 분들께,<br />
              선별하여 제공해드리는 런칭 한정 프로그램입니다.
            </p>

            {/* HERO STATS */}
            <div className="event01-stats">
              <div className="event01-stat">
                <div className="event01-stat-num">3<span className="event01-stat-num-unit">분</span></div>
                <div className="event01-stat-label">선착순 모집</div>
              </div>
              <div className="event01-stat">
                <div className="event01-stat-num">1:1</div>
                <div className="event01-stat-label">맞춤 코칭 1시간</div>
              </div>
              <div className="event01-stat">
                <div className="event01-stat-num">0<span className="event01-stat-num-unit">원</span></div>
                <div className="event01-stat-label">호스팅료 무료</div>
              </div>
            </div>

            {/* BLOCK 2-1 : 이런 분께 */}
            <div className="event01-block">
              <h3 className="event01-block-h">이런 분께 드리는 기회입니다</h3>
              <p className="event01-block-sub">아래 다섯 가지 중 두 가지 이상 해당되시는 분이라면, 망설이지 말고 신청해주세요.</p>

              <div className="event01-targets">
                <div className="event01-target">
                  <div className="event01-target-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></svg>
                  </div>
                  <p className="event01-target-text">창업 2년차 이상, 혼자 영업·서비스·마케팅을 다 하시는 1인 대표님</p>
                </div>
                <div className="event01-target">
                  <div className="event01-target-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></svg>
                  </div>
                  <p className="event01-target-text">기존 홈페이지의 월간 호스팅 비용이 아까우신 분</p>
                </div>
                <div className="event01-target">
                  <div className="event01-target-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></svg>
                  </div>
                  <p className="event01-target-text">AI 자동화 마케팅을 위해 개선된 홈페이지가 필요하신 분</p>
                </div>
                <div className="event01-target">
                  <div className="event01-target-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></svg>
                  </div>
                  <p className="event01-target-text">ChatGPT · Claude는 결제해서 쓰고 계시지만, 홈페이지 관리는 막막하신 분</p>
                </div>
                <div className="event01-target" style={{ gridColumn: '1 / -1' }}>
                  <div className="event01-target-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></svg>
                  </div>
                  <p className="event01-target-text">유료 광고가 아닌, SEO 검색 최적화를 통해 고객이 직접 검색해서 찾아오는 기반을 다지고 싶으신 분</p>
                </div>
              </div>
            </div>

            {/* BLOCK 2-2 : 자격 검사 / 진행 (scroll-step 01) */}
            <div className="event01-block" data-step="0">
              <div className="scroll-step">
                <div className="scroll-step-num">01</div>
                <h3 className="scroll-step-title">
                  무료 진행 대상을 <span className="em">선발</span>하기는 합니다.<br />하지만, 어렵지는 않습니다
                </h3>
                <p className="scroll-step-desc">
                  준비하실 것은 이미 사장님이 가지고 계신 자료뿐. 완성된 제안서나 정리된 기획서가 아니어도 괜찮습니다.
                </p>
              </div>

              <div className="scroll-step-content">
                <div className="event01-flow">
                  <div className="event01-flow-title">
                    <span className="event01-flow-title-pill">PROCESS</span>
                  </div>

                  <div className="event01-flow-list">
                    <div className="event01-flow-item">
                      <div className="event01-flow-num">STEP 01</div>
                      <div className="event01-flow-body">
                        <strong>신청 폼 작성</strong>
                        <span>사이트 하단의 신청 폼을 채워주세요. 담당 PM이 카카오톡으로 직접 연락드립니다.</span>
                      </div>
                    </div>
                    <div className="event01-flow-item">
                      <div className="event01-flow-num">STEP 02</div>
                      <div className="event01-flow-body">
                        <strong>카카오톡 사전 미팅</strong>
                        <span>업체 정보 · 목표 · 현황을 채팅으로 전달해주시면 됩니다.</span>
                        <span className="event01-flow-time">약 30분 소요</span>
                      </div>
                    </div>
                    <div className="event01-flow-item">
                      <div className="event01-flow-num">STEP 03</div>
                      <div className="event01-flow-body">
                        <strong>준비 자료 정리</strong>
                        <span>기존 홈페이지 · 카탈로그 · 사업 소개서 중 가지고 계신 것 무엇이든. 새로 만들어 오실 필요 없습니다.</span>
                      </div>
                    </div>
                    <div className="event01-flow-item">
                      <div className="event01-flow-num">STEP 04</div>
                      <div className="event01-flow-body">
                        <strong>1:1 코칭 일정 확정</strong>
                        <span>업종에 맞는 AI 홈페이지 제작 템플릿과 프롬프트를 미리 준비해 드립니다.</span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="event01-easy">형식 갖춘 제안서가 아니어도 됩니다. 이미 사장님이 가지고 계신 자료면 충분합니다.</p>
              </div>
            </div>

            {/* BLOCK 2-3 : 1:1 코칭 (scroll-step 02) */}
            <div className="event01-block" data-step="1">
              <div className="scroll-step">
                <div className="scroll-step-num">02</div>
                <h3 className="scroll-step-title">
                  1:1 코칭, 정해진 시간 안에서<br /><span className="em">섬세하게</span>
                </h3>
                <p className="scroll-step-desc">총 1시간. 그 안에서 사장님 사이트가 실제로 움직이기 시작합니다.</p>
              </div>

              <div className="scroll-step-content">
                <div className="event01-coaching">
                  <div className="event01-coach-card">
                    <div className="event01-coach-time">30<span className="event01-coach-time-unit">min</span></div>
                    <div className="event01-coach-label">PART 01 · BUILD</div>
                    <h4 className="event01-coach-h">AI 템플릿 활용 홈페이지 제작 강의</h4>
                    <ul className="event01-coach-list">
                      <li>업종 맞춤 프롬프트 제공</li>
                      <li>디자인 템플릿 파일 제공</li>
                      <li>그대로 복사해서 쓰는 구조</li>
                      <li>완성까지 함께 따라가는 라이브 가이드</li>
                    </ul>
                  </div>

                  <div className="event01-coach-card">
                    <div className="event01-coach-time">30<span className="event01-coach-time-unit">min</span></div>
                    <div className="event01-coach-label">PART 02 · CONNECT</div>
                    <h4 className="event01-coach-h">SEO 기초 셋팅 직접 연결</h4>
                    <ul className="event01-coach-list">
                      <li>사이트맵 · robots · 메타태그</li>
                      <li>검색 노출 기본 구조</li>
                      <li>OG 태그 등 광고용 메타 정보</li>
                      <li>운영 가능한 상태로 마무리</li>
                    </ul>
                  </div>
                </div>

                <p className="event01-coach-total">
                  <strong>총 60분 · 1:1 진행</strong> &nbsp;·&nbsp; 강의 후 1시간만 더 투자하면 바로 배포 가능
                </p>
              </div>
            </div>

            {/* BLOCK 3 : 결과물 (scroll-step 03) */}
            <div className="event01-results event01-block" data-step="2">
              <div className="scroll-step">
                <div className="section-eyebrow" style={{ marginBottom: 24 }}>AFTER THE SESSION</div>
                <div className="scroll-step-num">03</div>
                <h3 className="scroll-step-title">
                  강의로 끝나지 않습니다.<br />
                  <span className="em">실제로 운영되는 사이트</span>가 남습니다
                </h3>
                <p className="scroll-step-desc">이 1시간이 끝나면, 사장님은 이런 것들을 손에 쥐게 됩니다.</p>
              </div>

              <div className="scroll-step-content">
                <div className="event01-results-grid">
                  <article className="event01-result-card">
                    <div className="event01-result-num">RESULT 01</div>
                    <h4 className="event01-result-h">바로 운영 가능한<br />내 사이트</h4>
                    <ul className="event01-result-list">
                      <li>SEO 기초 연결이 모두 끝난 상태의 홈페이지</li>
                      <li className="highlight">수업 후 1시간만 투자하면 바로 배포 가능</li>
                      <li>OG 태그 등 광고용 메타 정보까지 자동 처리</li>
                      <li>도메인 연결까지 직접 연결 도움</li>
                    </ul>
                  </article>

                  <article className="event01-result-card">
                    <div className="event01-result-num">RESULT 02</div>
                    <h4 className="event01-result-h">AI 홈페이지 제작<br />노하우, 통째로</h4>
                    <ul className="event01-result-list">
                      <li>업종에 맞는 AI 홈페이지 제작 템플릿</li>
                      <li>그대로 복사해서 쓰는 프롬프트</li>
                      <li className="highlight">단순 제작이 아닌, 검색에 노출되는 구조로 만드는 법</li>
                      <li>다음 페이지 추가 시에도 적용 가능</li>
                    </ul>
                  </article>

                  <article className="event01-result-card">
                    <div className="event01-result-num">RESULT 03</div>
                    <h4 className="event01-result-h">광고 없이도 고객이<br />찾아오는 기반</h4>
                    <ul className="event01-result-list">
                      <li>SEO(검색최적화) 기본 셋팅 완료</li>
                      <li>홈페이지에서 시작하는 AI 자동화 마케팅의 출발점</li>
                      <li className="highlight">2027년 2월 28일까지 월 이용료 0원</li>
                      <li className="note">그 이후에도, 트렌드에 맞는 최소 비용으로 제공하는 것이 저희 운영 정책입니다.</li>
                    </ul>
                  </article>
                </div>

                {/* CTA */}
                <div className="event01-cta">
                  <div className="event01-cta-row">
                    <button
                      type="button"
                      className="event01-btn"
                      onClick={() => openSignup('free-block3-primary')}
                    >
                      <span>지금 신청하기</span>
                      <span className="event01-btn-arrow">→</span>
                    </button>
                    <button
                      type="button"
                      className="event01-btn secondary"
                      onClick={() => openSignup('free-block3-secondary')}
                    >
                      <span>내 자격이 되는지 먼저 확인</span>
                    </button>
                  </div>
                  <p className="event01-cta-note">선착순 3분 · 자격 검토 후 카카오톡으로 안내드립니다</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CROSS-LINK 배너 (PAID 페이지로) ── */}
        <section className="cross-link">
          <div className="cross-link-inner">
            <div className="cross-link-eyebrow">More Options</div>
            <h2 className="cross-link-h">
              자격 검토 없이 <span className="em">바로 시작</span>하고 싶다면
            </h2>
            <p className="cross-link-sub">
              EVENT 02·03 패키지는 누구나 신청 가능합니다.<br />
              합리적인 가격에 검색 전략 또는 콘텐츠 기획부터 한 번에.
            </p>

            <a href="/events2026/paid" className="cross-card">
              <div className="cross-card-badge">
                <span className="cross-card-badge-num">02·03</span>
                <span className="cross-card-badge-tag">PAID</span>
              </div>
              <div className="cross-card-body">
                <div className="cross-card-pkg">EVENT 02 · 03 · 합리적 가격</div>
                <div className="cross-card-h">두 가지 패키지 중 내게 맞는 한 가지를</div>
                <div className="cross-card-desc">001 검색 전략 또는 002 콘텐츠 기획 + CORE 1 배포 · 30만원 → 10만원</div>
              </div>
              <div className="cross-card-arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            </a>
          </div>
        </section>


        <SiteFooter />
      </div>

      <EventSignupModal
        open={signupOpen}
        onClose={() => setSignupOpen(false)}
        eventCode="EVENT_01_FREE"
        source={signupSource}
      />
    </>
  );
}
