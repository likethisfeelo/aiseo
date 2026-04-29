import { useState } from 'react';
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

  // CORE-CARD expandables (4 across the two packages: 001 / CORE 1 in
  // event02, 002 / CORE 1 in event03). Tracked as a Set so the toggle
  // handler stays generic; closed by default.
  const [openCards, setOpenCards] = useState<Set<string>>(new Set());
  const toggleCard = (id: string) =>
    setOpenCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const isOpen = (id: string) => openCards.has(id);

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

        /* ── PKG SECTION (EVENT 02 / 03) ── */
        .evtpaid .pkg-section {
          background: var(--bg-soft);
          padding: 100px 40px;
          position: relative;
          overflow: hidden;
        }
        .evtpaid .pkg-section.alt { background: var(--bg); }
        .evtpaid .pkg-section::before {
          content: '';
          position: absolute;
          top: -160px; left: 50%;
          transform: translateX(-50%);
          width: 700px; height: 380px;
          background: radial-gradient(ellipse, rgba(196,168,245,0.10) 0%, transparent 70%);
          pointer-events: none;
        }
        .evtpaid .pkg-section-inner {
          position: relative; z-index: 1;
          max-width: 1240px;
          margin: 0 auto;
        }

        /* tag pill 헤더 */
        .evtpaid .event01-tag-row { text-align: center; }
        .evtpaid .event01-tag {
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
          margin: 0 auto 20px;
        }
        .evtpaid .event01-tag .num {
          width: 22px; height: 22px;
          background: var(--accent);
          color: #fff;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px;
          font-weight: 800;
        }

        .evtpaid .pkg-section .section-h2 { margin-bottom: 16px; }
        .evtpaid .event01-lead {
          font-family: var(--font-ko);
          text-align: center;
          font-size: 16px;
          color: var(--text-secondary);
          line-height: 1.8;
          max-width: 580px;
          margin: 0 auto 56px;
        }

        /* 가격 박스 */
        .evtpaid .pkg-price {
          max-width: 520px;
          margin: 0 auto 56px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 32px 36px;
          box-shadow: var(--shadow-sm);
        }
        .evtpaid .pkg-price-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 0;
          font-size: 16px;
          color: var(--text-secondary);
          gap: 20px;
        }
        .evtpaid .pkg-price-row .label {
          color: var(--text-primary);
          font-weight: 600;
          font-size: 16px;
          letter-spacing: -.2px;
        }
        .evtpaid .pkg-price-row .label small {
          display: block;
          font-size: 13px;
          color: var(--text-muted);
          margin-top: 4px;
          font-weight: 400;
          letter-spacing: .1px;
        }
        .evtpaid .pkg-price-row .num {
          font-family: var(--font-en);
          font-weight: 700;
          color: var(--text-primary);
          font-size: 17px;
          flex-shrink: 0;
        }
        .evtpaid .pkg-price-divider {
          border-top: 1px dashed var(--border);
          margin: 14px 0 10px;
        }
        .evtpaid .pkg-price-sum {
          display: flex; align-items: center; justify-content: space-between;
          padding: 6px 0 18px;
          font-size: 15px;
          color: var(--text-muted);
        }
        .evtpaid .pkg-price-sum .num {
          font-family: var(--font-en);
          font-weight: 600;
          color: var(--text-secondary);
          font-size: 16px;
        }
        .evtpaid .pkg-price-final {
          background: linear-gradient(135deg, var(--accent-deep) 0%, var(--accent-dark) 100%);
          color: #fff;
          border-radius: var(--radius-md);
          padding: 22px 26px;
          display: flex; align-items: center; justify-content: space-between;
          margin-top: 8px;
          box-shadow: 0 6px 18px rgba(107, 79, 184, 0.25);
        }
        .evtpaid .pkg-price-final .label {
          font-size: 14.5px;
          font-weight: 600;
          color: rgba(255,255,255,0.9);
          letter-spacing: .3px;
        }
        .evtpaid .pkg-price-final .num {
          font-family: var(--font-en);
          font-size: 38px;
          font-weight: 800;
          letter-spacing: -1.8px;
          line-height: 1;
        }
        .evtpaid .pkg-price-final .num .unit {
          font-size: 18px;
          font-weight: 600;
          color: var(--accent);
          margin-left: 3px;
        }
        .evtpaid .pkg-price-saved {
          text-align: center;
          margin-top: 16px;
          font-size: 14px;
          color: var(--accent-deep);
          font-weight: 700;
          letter-spacing: .2px;
        }
        .evtpaid .pkg-price-saved::before {
          content: '★ ';
          color: #E8A60E;
        }

        /* free-bundle-core wrapper (재사용: 사전 카드 + CORE notice + CORE 1 카드 묶음) */
        .evtpaid .free-bundle-core {
          margin: 0 auto 56px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* CORE NOTICE 박스 */
        .evtpaid .core-notice {
          display: flex; align-items: flex-start; gap: 14px;
          background: linear-gradient(135deg, rgba(196,168,245,0.16) 0%, rgba(155,184,248,0.12) 100%);
          border: 1px solid rgba(196,168,245,0.32);
          border-radius: var(--radius-lg);
          padding: 18px 24px;
        }
        .evtpaid .core-notice-star {
          flex-shrink: 0;
          width: 28px; height: 28px;
          background: #FFE99A;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 6px rgba(255, 200, 80, 0.35);
          margin-top: 2px;
        }
        .evtpaid .core-notice-star::before {
          content: '★';
          color: #E8A60E;
          font-size: 14px;
          line-height: 1;
        }
        .evtpaid .core-notice-body { text-align: left; flex: 1; }
        .evtpaid .core-notice-title {
          font-size: 15px; font-weight: 700;
          color: var(--accent-deep);
          letter-spacing: -.2px;
          margin-bottom: 4px;
          line-height: 1.4;
        }
        .evtpaid .core-notice-sub {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.55;
          font-weight: 400;
        }

        /* CORE CARD (확장형) */
        .evtpaid .core-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          text-align: left;
          transition: border-color .2s, box-shadow .2s;
          overflow: hidden;
        }
        .evtpaid .core-card:hover {
          border-color: rgba(196,168,245,0.4);
          box-shadow: var(--shadow-md);
        }
        .evtpaid .core-card-header {
          display: grid;
          grid-template-columns: auto 1fr auto auto;
          gap: 22px;
          align-items: center;
          padding: 22px 26px;
        }
        .evtpaid .core-card-icon {
          width: 56px; height: 56px;
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent-deep) 100%);
          border-radius: var(--radius-md);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 14px rgba(139,111,212,0.3);
          flex-shrink: 0;
        }
        .evtpaid .core-card-icon-text {
          font-family: var(--font-en);
          font-size: 12px;
          font-weight: 800;
          color: #fff;
          letter-spacing: .5px;
        }
        .evtpaid .core-card-body { min-width: 0; }
        .evtpaid .core-card-label {
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
        .evtpaid .core-card-h {
          font-family: var(--font-ko);
          font-size: clamp(16px, 1.5vw, 18px);
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -.3px;
          margin-bottom: 10px;
          line-height: 1.4;
        }
        .evtpaid .core-card-tags {
          display: flex; flex-wrap: wrap; gap: 6px;
        }
        .evtpaid .core-card-tag {
          font-size: 12.5px;
          color: var(--text-muted);
          background: var(--bg-soft);
          border: 1px solid var(--border-soft);
          padding: 4px 10px;
          border-radius: 100px;
          font-weight: 500;
        }
        .evtpaid .core-card-price {
          text-align: right;
          flex-shrink: 0;
          display: flex; align-items: center; gap: 6px;
        }
        .evtpaid .core-card-price-strike {
          font-size: 13px;
          color: var(--text-muted);
          text-decoration: line-through;
          text-decoration-color: rgba(155,155,155,0.7);
          font-weight: 500;
        }
        .evtpaid .core-card-price-arrow {
          color: var(--accent-dark);
          font-weight: 700;
          margin: 0 2px;
        }
        .evtpaid .core-card-price-free {
          font-size: 17px;
          font-weight: 800;
          color: var(--accent-deep);
          letter-spacing: -.4px;
        }
        .evtpaid .core-card-toggle {
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
        .evtpaid .core-card-toggle:hover {
          background: var(--accent-light);
          border-color: rgba(196,168,245,0.4);
        }
        .evtpaid .core-card-toggle svg {
          width: 16px; height: 16px;
          transition: transform .35s cubic-bezier(0.65, 0.05, 0.35, 1);
        }
        .evtpaid .core-card-toggle[aria-expanded="true"] svg {
          transform: rotate(180deg);
        }
        .evtpaid .core-card-expand {
          overflow: hidden;
          max-height: 0;
          transition: max-height .5s cubic-bezier(0.65, 0.05, 0.35, 1);
        }
        .evtpaid .core-card-expand.open { max-height: 1500px; }
        .evtpaid .core-card-expand-inner {
          border-top: 1px solid var(--border-soft);
          padding: 32px 30px 32px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 36px;
        }
        .evtpaid .core-col-section + .core-col-section { margin-top: 26px; }
        .evtpaid .core-col-h {
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
        .evtpaid .core-col-section.muted .core-col-h {
          background: var(--text-primary);
        }
        .evtpaid .core-col-desc {
          font-size: 14.5px;
          color: var(--text-secondary);
          line-height: 1.75;
        }
        .evtpaid .core-col-desc + .core-col-desc { margin-top: 14px; }
        .evtpaid .core-col-list {
          list-style: none;
          display: flex; flex-direction: column;
          gap: 9px;
          padding: 0; margin: 0;
        }
        .evtpaid .core-col-list.bullet li {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.6;
          padding-left: 16px;
          position: relative;
        }
        .evtpaid .core-col-list.bullet li::before {
          content: '';
          position: absolute;
          left: 0; top: 9px;
          width: 5px; height: 5px;
          background: var(--accent);
          border-radius: 50%;
        }
        .evtpaid .core-col-list.check li {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.6;
          padding-left: 22px;
          position: relative;
        }
        .evtpaid .core-col-list.check li::before {
          content: '✓';
          position: absolute;
          left: 0; top: 0;
          color: var(--accent-dark);
          font-weight: 700;
          font-size: 13px;
        }
        .evtpaid .core-col-chips {
          display: flex; flex-wrap: wrap; gap: 8px;
          margin-top: 4px;
        }
        .evtpaid .core-col-chip {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--bg-soft);
          border: 1px solid var(--border-soft);
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 500;
          padding: 6px 12px;
          border-radius: 100px;
        }
        .evtpaid .core-col-chip-icon { font-size: 14px; line-height: 1; }

        /* PKG SECTION CTA */
        .evtpaid .event01-cta {
          margin-top: 64px;
          text-align: center;
        }
        .evtpaid .event01-cta-row {
          display: inline-flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .evtpaid .event01-btn {
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
        .evtpaid .event01-btn:hover {
          background: var(--accent-deep);
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(139,111,212,0.35);
        }
        .evtpaid .event01-btn.secondary {
          background: var(--bg-card);
          color: var(--text-primary);
          border-color: var(--border);
          box-shadow: none;
        }
        .evtpaid .event01-btn.secondary:hover {
          border-color: var(--accent);
          background: var(--bg-soft);
          box-shadow: var(--shadow-sm);
        }
        .evtpaid .event01-btn-arrow { transition: transform .2s; display: inline-block; }
        .evtpaid .event01-btn:hover .event01-btn-arrow { transform: translateX(3px); }
        .evtpaid .event01-cta-note {
          margin-top: 18px;
          font-size: 12.5px;
          color: var(--text-muted);
          letter-spacing: .2px;
        }

        @media (max-width: 900px) {
          .evtpaid section { padding: 80px 24px; }
          .evtpaid .hero { padding: 120px 24px 60px; min-height: auto; }
          .evtpaid .hero-prism { width: 160px; height: 160px; }
          .evtpaid .benefits-grid { grid-template-columns: 1fr; }
          .evtpaid .pkg-section { padding: 60px 24px; }
          .evtpaid .pkg-price { padding: 26px 24px; }
          .evtpaid .pkg-price-final { padding: 18px 20px; }
          .evtpaid .pkg-price-final .num { font-size: 30px; }
          .evtpaid .pkg-price-row .label { font-size: 14.5px; }
          .evtpaid .pkg-price-row .label small { font-size: 12px; }
          .evtpaid .pkg-price-row .num { font-size: 15px; }
          .evtpaid .core-card-header { grid-template-columns: auto 1fr auto; gap: 14px; padding: 18px 20px; }
          .evtpaid .core-card-toggle { grid-column: 3; }
          .evtpaid .core-card-price { grid-column: 1 / -1; justify-content: flex-end; padding-top: 10px; border-top: 1px dashed var(--border); }
          .evtpaid .core-card-expand-inner { grid-template-columns: 1fr; gap: 26px; padding: 24px 22px; }
          .evtpaid .core-notice { padding: 16px 20px; }
          .evtpaid .core-notice-title { font-size: 14px; }
          .evtpaid .core-notice-sub { font-size: 13px; }
        }
        @media (max-width: 480px) {
          .evtpaid .hero-h1 { letter-spacing: -1.5px; }
          .evtpaid .section-h2 { letter-spacing: -.8px; }
          .evtpaid .event01-cta-row { flex-direction: column; width: 100%; }
          .evtpaid .event01-btn { width: 100%; justify-content: center; }
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

        {/* ══════════════════════════════════════════════
              EVENT 02 — 패키지 A (검색 전략 + 배포)
        ══════════════════════════════════════════════ */}
        <section className="pkg-section" id="event02">
          <div className="pkg-section-inner">
            <div className="event01-tag-row">
              <div className="event01-tag">
                <span className="num">2</span>
                <span>EVENT 02 · 패키지 A</span>
              </div>
            </div>

            <h2 className="section-h2">
              검색에서 보이는 길을<br />
              <span className="em">먼저 그려두는</span> 패키지
            </h2>
            <p className="event01-lead">
              "어떤 키워드로, 어떤 고객에게 보일 것인가"를 먼저 정리하고,<br />
              그 위에 사이트를 올립니다.
            </p>

            {/* 가격 박스 */}
            <div className="pkg-price">
              <div className="pkg-price-row">
                <span className="label">001 SEO 검색노출전략 점검<small>업종 분석 · 키워드 전략 · 경쟁군 분석</small></span>
                <span className="num">20만원</span>
              </div>
              <div className="pkg-price-row">
                <span className="label">CORE1 즉시 배포 + 기술적 SEO 셋팅<small>실제 웹 주소에 올리고 검색엔진 연동까지</small></span>
                <span className="num">10만원</span>
              </div>
              <div className="pkg-price-divider"></div>
              <div className="pkg-price-sum">
                <span>합계</span>
                <span className="num">30만원</span>
              </div>
              <div className="pkg-price-final">
                <span className="label">EVENT 02 패키지 가격</span>
                <span className="num">10<span className="unit">만원</span></span>
              </div>
              <div className="pkg-price-saved">20만원 절감 · 약 66% off</div>
            </div>

            {/* 001 카드 + CORE 1 카드 */}
            <div className="free-bundle-core">
              {/* 001 카드 */}
              <div className="core-card">
                <div className="core-card-header">
                  <div className="core-card-icon">
                    <span className="core-card-icon-text">001</span>
                  </div>
                  <div className="core-card-body">
                    <span className="core-card-label">001 · Pre-launch</span>
                    <h4 className="core-card-h">SEO 검색노출전략 점검</h4>
                    <div className="core-card-tags">
                      <span className="core-card-tag">#업종분석</span>
                      <span className="core-card-tag">#키워드전략</span>
                      <span className="core-card-tag">#경쟁군분석</span>
                    </div>
                  </div>
                  <div className="core-card-price">
                    <span className="core-card-price-strike">20만원</span>
                    <span className="core-card-price-arrow">→</span>
                    <span className="core-card-price-free">포함</span>
                  </div>
                  <button
                    type="button"
                    className="core-card-toggle"
                    aria-expanded={isOpen('001')}
                    aria-controls="evtpaid-expand-001"
                    aria-label={isOpen('001') ? '접기' : '자세히 보기'}
                    onClick={() => toggleCard('001')}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>
                <div className={`core-card-expand${isOpen('001') ? ' open' : ''}`} id="evtpaid-expand-001">
                  <div className="core-card-expand-inner">
                    <div>
                      <div className="core-col-section">
                        <p className="core-col-desc">
                          홈페이지를 만들기 전에 "어떤 키워드로, 어떤 고객에게 보여야 하는가"를 먼저 정리하는 세션입니다. 사업자 기준으로 업종 포지셔닝, 경쟁군 분석, 메인·서브 키워드 선정, 검색 의도 분류까지 한 번에 다룹니다.
                        </p>
                        <p className="core-col-desc">
                          제작 방향이 잡힌 후 홈페이지를 만들면, 구조 수정 없이 바로 검색 노출 구조로 연결됩니다.
                        </p>
                      </div>
                      <div className="core-col-section">
                        <span className="core-col-h">이런 분께 추천합니다</span>
                        <ul className="core-col-list bullet">
                          <li>홈페이지를 만들기 전에 검색 전략부터 잡고 싶은 사업자</li>
                          <li>내 업종에서 어떤 키워드가 효과적인지 모르는 분</li>
                          <li>경쟁사 대비 차별화 포인트를 검색 관점에서 정리하고 싶은 분</li>
                        </ul>
                      </div>
                    </div>
                    <div>
                      <div className="core-col-section">
                        <span className="core-col-h">다루는 내용</span>
                        <ul className="core-col-list check">
                          <li>업종 포지셔닝 및 타겟 고객 정의</li>
                          <li>경쟁군 분석 및 검색 상위 구조 파악</li>
                          <li>메인/서브 키워드 선정 (지역 키워드 포함)</li>
                          <li>검색 의도 유형 분류</li>
                          <li>키워드 우선순위 문서화</li>
                        </ul>
                      </div>
                      <div className="core-col-section muted">
                        <span className="core-col-h">진행 방식</span>
                        <div className="core-col-chips">
                          <span className="core-col-chip"><span className="core-col-chip-icon">⏱</span>1회 약 60분</span>
                          <span className="core-col-chip"><span className="core-col-chip-icon">💬</span>화상 컨설팅</span>
                          <span className="core-col-chip"><span className="core-col-chip-icon">📋</span>키워드 전략서</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CORE 1 알림 */}
              <div className="core-notice">
                <div className="core-notice-star" aria-hidden="true"></div>
                <div className="core-notice-body">
                  <div className="core-notice-title">CORE 1 — 핵심 교육</div>
                  <div className="core-notice-sub">사이트를 실제로 웹에 올리는 핵심 실습입니다</div>
                </div>
              </div>

              {/* CORE 1 카드 (event02) */}
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
                    <span className="core-card-price-free">포함</span>
                  </div>
                  <button
                    type="button"
                    className="core-card-toggle"
                    aria-expanded={isOpen('core-02')}
                    aria-controls="evtpaid-expand-core-02"
                    aria-label={isOpen('core-02') ? '접기' : '자세히 보기'}
                    onClick={() => toggleCard('core-02')}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>
                <div className={`core-card-expand${isOpen('core-02') ? ' open' : ''}`} id="evtpaid-expand-core-02">
                  <div className="core-card-expand-inner">
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

            {/* CTA */}
            <div className="event01-cta">
              <div className="event01-cta-row">
                <a href="#" className="event01-btn">
                  <span>EVENT 02 신청하기</span>
                  <span className="event01-btn-arrow">→</span>
                </a>
                <a href="#event03" className="event01-btn secondary">
                  <span>EVENT 03도 비교해보기</span>
                </a>
              </div>
              <p className="event01-cta-note">누구나 신청 가능 · 자격 검토 없이 바로 진행</p>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
              EVENT 03 — 패키지 B (콘텐츠 기획 + 배포)
        ══════════════════════════════════════════════ */}
        <section className="pkg-section alt" id="event03">
          <div className="pkg-section-inner">
            <div className="event01-tag-row">
              <div className="event01-tag">
                <span className="num">3</span>
                <span>EVENT 03 · 패키지 B</span>
              </div>
            </div>

            <h2 className="section-h2">
              무엇을 어떻게 쓸지<br />
              <span className="em">먼저 정리하는</span> 패키지
            </h2>
            <p className="event01-lead">
              메뉴 구조 · 서비스 설명 · CTA · 톤앤매너까지 —<br />
              홈페이지에 들어갈 모든 것을 기획하고, 사이트를 올립니다.
            </p>

            {/* 가격 박스 */}
            <div className="pkg-price">
              <div className="pkg-price-row">
                <span className="label">002 홈페이지 · 콘텐츠 기획<small>메뉴 구조 · CTA 작성 · 콘텐츠 기획</small></span>
                <span className="num">20만원</span>
              </div>
              <div className="pkg-price-row">
                <span className="label">CORE1 즉시 배포 + 기술적 SEO 셋팅<small>실제 웹 주소에 올리고 검색엔진 연동까지</small></span>
                <span className="num">10만원</span>
              </div>
              <div className="pkg-price-divider"></div>
              <div className="pkg-price-sum">
                <span>합계</span>
                <span className="num">30만원</span>
              </div>
              <div className="pkg-price-final">
                <span className="label">EVENT 03 패키지 가격</span>
                <span className="num">10<span className="unit">만원</span></span>
              </div>
              <div className="pkg-price-saved">20만원 절감 · 약 66% off</div>
            </div>

            {/* 002 카드 + CORE 1 카드 */}
            <div className="free-bundle-core">
              {/* 002 카드 */}
              <div className="core-card">
                <div className="core-card-header">
                  <div className="core-card-icon">
                    <span className="core-card-icon-text">002</span>
                  </div>
                  <div className="core-card-body">
                    <span className="core-card-label">002 · Pre-launch</span>
                    <h4 className="core-card-h">홈페이지 및 콘텐츠 기획 · 내용 설계</h4>
                    <div className="core-card-tags">
                      <span className="core-card-tag">#메뉴구조</span>
                      <span className="core-card-tag">#CTA작성</span>
                      <span className="core-card-tag">#콘텐츠기획</span>
                    </div>
                  </div>
                  <div className="core-card-price">
                    <span className="core-card-price-strike">20만원</span>
                    <span className="core-card-price-arrow">→</span>
                    <span className="core-card-price-free">포함</span>
                  </div>
                  <button
                    type="button"
                    className="core-card-toggle"
                    aria-expanded={isOpen('002')}
                    aria-controls="evtpaid-expand-002"
                    aria-label={isOpen('002') ? '접기' : '자세히 보기'}
                    onClick={() => toggleCard('002')}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>
                <div className={`core-card-expand${isOpen('002') ? ' open' : ''}`} id="evtpaid-expand-002">
                  <div className="core-card-expand-inner">
                    <div>
                      <div className="core-col-section">
                        <p className="core-col-desc">
                          홈페이지에 어떤 내용을, 어떤 순서로, 어떤 문장으로 담을지 설계하는 교육입니다. 단순히 문장을 다듬는 수준이 아니라, 메뉴 구조부터 서비스 설명 정리, 소개 문장과 CTA, 전체 콘텐츠 방향까지 홈페이지 제작 전 필요한 모든 기획을 한 번에 마칩니다.
                        </p>
                        <p className="core-col-desc">
                          이 교육을 마치면 AI 도구에 명확한 방향을 넣을 수 있는 상태가 되어, 만들어지는 결과물의 완성도가 크게 높아집니다.
                        </p>
                      </div>
                      <div className="core-col-section">
                        <span className="core-col-h">이런 분께 추천합니다</span>
                        <ul className="core-col-list bullet">
                          <li>홈페이지에 뭘 써야 할지 막막한 분</li>
                          <li>서비스 설명이 너무 길거나 핵심이 없다는 피드백을 받은 분</li>
                          <li>기획 없이 만들었다가 처음부터 다시 고친 경험이 있는 분</li>
                        </ul>
                      </div>
                    </div>
                    <div>
                      <div className="core-col-section">
                        <span className="core-col-h">다루는 내용</span>
                        <ul className="core-col-list check">
                          <li>홈페이지 메뉴 구조 설계 (페이지 수 · 우선순위)</li>
                          <li>서비스 설명 정리 및 핵심 문장 추출</li>
                          <li>소개 문장 · CTA 문구 작성</li>
                          <li>콘텐츠 방향 및 톤앤매너 설정</li>
                          <li>AI 도구에 넣을 프롬프트 방향 정리</li>
                        </ul>
                      </div>
                      <div className="core-col-section muted">
                        <span className="core-col-h">진행 방식</span>
                        <div className="core-col-chips">
                          <span className="core-col-chip"><span className="core-col-chip-icon">⏱</span>1회 약 60~80분</span>
                          <span className="core-col-chip"><span className="core-col-chip-icon">💬</span>화상 컨설팅</span>
                          <span className="core-col-chip"><span className="core-col-chip-icon">📋</span>콘텐츠 기획서</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CORE 1 알림 */}
              <div className="core-notice">
                <div className="core-notice-star" aria-hidden="true"></div>
                <div className="core-notice-body">
                  <div className="core-notice-title">CORE 1 — 핵심 교육</div>
                  <div className="core-notice-sub">사이트를 실제로 웹에 올리는 핵심 실습입니다</div>
                </div>
              </div>

              {/* CORE 1 카드 (event03) */}
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
                    <span className="core-card-price-free">포함</span>
                  </div>
                  <button
                    type="button"
                    className="core-card-toggle"
                    aria-expanded={isOpen('core-03')}
                    aria-controls="evtpaid-expand-core-03"
                    aria-label={isOpen('core-03') ? '접기' : '자세히 보기'}
                    onClick={() => toggleCard('core-03')}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>
                <div className={`core-card-expand${isOpen('core-03') ? ' open' : ''}`} id="evtpaid-expand-core-03">
                  <div className="core-card-expand-inner">
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

            {/* CTA */}
            <div className="event01-cta">
              <div className="event01-cta-row">
                <a href="#" className="event01-btn">
                  <span>EVENT 03 신청하기</span>
                  <span className="event01-btn-arrow">→</span>
                </a>
                <a href="#event02" className="event01-btn secondary">
                  <span>EVENT 02도 비교해보기</span>
                </a>
              </div>
              <p className="event01-cta-note">누구나 신청 가능 · 자격 검토 없이 바로 진행</p>
            </div>
          </div>
        </section>

        {/* Phases 4.3–4.4 will append common targets, FAQ, compare cards,
            LAUNCH CTA with countdown, and the cross-link banner. */}

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
