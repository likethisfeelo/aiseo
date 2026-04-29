import { useEffect, useState } from 'react';
import '../landing.css';
import { useSubPageNav } from './useSubPageNav';
import { EventSignupModal } from '../../components/EventSignupModal';
import type { EventCode } from '../../api';

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

  // FAQ accordion — single-open, matches the events.html behavior of
  // collapsing all other items when a new one is opened. `null` means
  // every item is closed.
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const toggleFaq = (id: string) =>
    setOpenFaq((prev) => (prev === id ? null : id));

  // Event signup modal — `eventCode` toggles between EVENT 02 / 03
  // depending on which CTA was clicked. `signupSource` traces the
  // origin button so we can attribute conversions later.
  const [signupOpen, setSignupOpen] = useState(false);
  const [signupCode, setSignupCode] = useState<EventCode>('EVENT_02_PAID');
  const [signupSource, setSignupSource] = useState('');
  const openSignup = (code: EventCode, source: string) => {
    setSignupCode(code);
    setSignupSource(source);
    setSignupOpen(true);
  };

  // ──────────────────────────────────────────────────────────────
  //  COUNTDOWN — target: 2026-04-30 00:00 KST (the EVENT 02·03 open
  //  date). Once the diff hits zero the .launch-countdown is hidden
  //  and .launch-live gets the `.show` class; matches the source JS.
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const cdEl = document.getElementById('launchCountdown');
    const liveEl = document.getElementById('launchLive');
    if (!cdEl || !liveEl) return;

    const numEls = {
      days: cdEl.querySelector<HTMLElement>('[data-cd="days"]'),
      hours: cdEl.querySelector<HTMLElement>('[data-cd="hours"]'),
      minutes: cdEl.querySelector<HTMLElement>('[data-cd="minutes"]'),
      seconds: cdEl.querySelector<HTMLElement>('[data-cd="seconds"]'),
    };
    const target = new Date('2026-04-30T00:00:00+09:00').getTime();
    const pad = (n: number) => String(n).padStart(2, '0');

    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        cdEl.style.display = 'none';
        liveEl.classList.add('show');
        return true; // stop ticking
      }
      const days = Math.floor(diff / 86_400_000);
      const hours = Math.floor((diff / 3_600_000) % 24);
      const minutes = Math.floor((diff / 60_000) % 60);
      const seconds = Math.floor((diff / 1_000) % 60);
      if (numEls.days) numEls.days.textContent = pad(days);
      if (numEls.hours) numEls.hours.textContent = pad(hours);
      if (numEls.minutes) numEls.minutes.textContent = pad(minutes);
      if (numEls.seconds) numEls.seconds.textContent = pad(seconds);
      return false;
    };

    if (tick()) return;
    const intervalId = window.setInterval(() => {
      if (tick()) window.clearInterval(intervalId);
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  // ──────────────────────────────────────────────────────────────
  //  Reveal-on-scroll fade-in for the secondary card grids. Mirrors
  //  the events.html behavior so cards rise from translateY(20px).
  //  Initial dim is applied in JS (not CSS) so a JS-disabled client
  //  still sees the cards.
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>(
        '.evtpaid .benefit-card, .evtpaid .event01-target, .evtpaid .compare-card, .evtpaid .launch-slot',
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

  // Hero video stub — quick scale feedback on click.
  useEffect(() => {
    const btn = document.querySelector<HTMLButtonElement>('.evtpaid .hero-video-play');
    if (!btn) return;
    const onClick = () => {
      btn.style.transform = 'translate(-50%, -50%) scale(0.92)';
      window.setTimeout(() => {
        btn.style.transform = 'translate(-50%, -50%) scale(1)';
      }, 150);
    };
    btn.addEventListener('click', onClick);
    return () => btn.removeEventListener('click', onClick);
  }, []);

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

        /* ── 공통 타겟 ── */
        .evtpaid .common-targets {
          background: var(--bg);
          padding: 100px 40px 80px;
        }
        .evtpaid .common-targets-inner {
          max-width: 1100px;
          margin: 0 auto;
        }
        .evtpaid .event01-targets {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          max-width: 920px;
          margin: 0 auto;
        }
        .evtpaid .event01-target {
          display: flex; align-items: flex-start; gap: 12px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 18px 20px;
          transition: border-color .2s, transform .2s;
        }
        .evtpaid .event01-target:hover {
          border-color: rgba(196,168,245,0.35);
          transform: translateY(-2px);
        }
        .evtpaid .event01-target-icon {
          width: 28px; height: 28px;
          border-radius: 50%;
          background: var(--accent-light);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .evtpaid .event01-target-icon svg {
          width: 14px; height: 14px;
          stroke: var(--accent-dark);
          stroke-width: 2.5;
          fill: none;
        }
        .evtpaid .event01-target-text {
          font-family: var(--font-ko);
          font-size: 16.5px;
          color: var(--text-primary);
          line-height: 1.6;
          font-weight: 500;
          margin: 0;
        }

        /* ── FAQ ── */
        .evtpaid .faq-section {
          background: var(--bg-soft);
          padding: 100px 40px;
        }
        .evtpaid .faq-inner {
          max-width: 800px;
          margin: 0 auto;
        }
        .evtpaid .faq-list { margin-top: 48px; }
        .evtpaid .faq-item {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          margin-bottom: 10px;
          transition: border-color .2s, box-shadow .2s;
          overflow: hidden;
        }
        .evtpaid .faq-item:hover {
          border-color: rgba(196,168,245,0.35);
        }
        .evtpaid .faq-q {
          width: 100%;
          background: transparent;
          border: none;
          padding: 26px 30px;
          text-align: left;
          cursor: pointer;
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px;
          font-family: inherit;
        }
        .evtpaid .faq-q-text {
          font-family: var(--font-ko);
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary);
          letter-spacing: -.3px;
          line-height: 1.5;
          flex: 1;
        }
        .evtpaid .faq-q-icon {
          flex-shrink: 0;
          width: 32px; height: 32px;
          border-radius: 50%;
          background: var(--accent-light);
          display: flex; align-items: center; justify-content: center;
          color: var(--accent-dark);
          transition: transform .35s cubic-bezier(0.65, 0.05, 0.35, 1);
        }
        .evtpaid .faq-q-icon svg { width: 15px; height: 15px; }
        .evtpaid .faq-q[aria-expanded="true"] .faq-q-icon { transform: rotate(180deg); }
        .evtpaid .faq-a {
          overflow: hidden;
          max-height: 0;
          transition: max-height .4s cubic-bezier(0.65, 0.05, 0.35, 1);
        }
        .evtpaid .faq-a.open { max-height: 500px; }
        .evtpaid .faq-a-inner {
          padding: 22px 30px 28px;
          font-size: 16px;
          color: var(--text-secondary);
          line-height: 1.8;
          border-top: 1px dashed var(--border);
        }
        .evtpaid .faq-a-inner strong {
          color: var(--text-primary);
          font-weight: 700;
        }

        /* ── A vs B 비교 ── */
        .evtpaid .compare-section {
          background: var(--bg);
          padding: 100px 40px 120px;
        }
        .evtpaid .compare-inner {
          max-width: 1100px;
          margin: 0 auto;
        }
        .evtpaid .compare-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 22px;
          margin-top: 56px;
          position: relative;
        }
        .evtpaid .compare-grid::before {
          content: 'OR';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: var(--bg);
          color: var(--accent-dark);
          font-family: var(--font-en);
          font-size: 13px;
          font-weight: 800;
          width: 44px; height: 44px;
          border-radius: 50%;
          border: 2px solid var(--accent-light);
          display: flex; align-items: center; justify-content: center;
          letter-spacing: 1px;
          z-index: 2;
        }
        .evtpaid .compare-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 36px 32px;
          transition: transform .25s, box-shadow .25s, border-color .25s;
          display: flex;
          flex-direction: column;
        }
        .evtpaid .compare-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
          border-color: rgba(196,168,245,0.4);
        }
        .evtpaid .compare-card-icon {
          font-size: 40px;
          margin-bottom: 18px;
          line-height: 1;
        }
        .evtpaid .compare-card-pkg {
          font-family: var(--font-en);
          font-size: 12px;
          font-weight: 800;
          color: var(--accent-deep);
          letter-spacing: 1.5px;
          margin-bottom: 10px;
        }
        .evtpaid .compare-card-h {
          font-family: var(--font-ko);
          font-size: clamp(24px, 2.6vw, 30px);
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -.8px;
          line-height: 1.3;
          margin-bottom: 14px;
        }
        .evtpaid .compare-card-sub {
          font-size: 16px;
          color: var(--text-secondary);
          line-height: 1.7;
          margin-bottom: 26px;
          padding-bottom: 26px;
          border-bottom: 1px dashed var(--border);
        }
        .evtpaid .compare-card-list {
          list-style: none;
          display: flex; flex-direction: column;
          gap: 13px;
          margin: 0 0 30px;
          padding: 0;
        }
        .evtpaid .compare-card-list li {
          font-size: 16px;
          color: var(--text-primary);
          line-height: 1.55;
          padding-left: 24px;
          position: relative;
          font-weight: 500;
        }
        .evtpaid .compare-card-list li::before {
          content: '✓';
          position: absolute;
          left: 0; top: 0;
          color: var(--accent-dark);
          font-weight: 800;
          font-size: 15px;
        }
        .evtpaid .compare-cta {
          display: inline-flex; align-items: center; justify-content: center;
          gap: 8px;
          background: var(--accent-dark);
          color: #fff;
          padding: 16px 28px;
          border-radius: var(--radius-md);
          font-size: 15.5px;
          font-weight: 700;
          text-decoration: none;
          margin-top: auto;
          transition: background .2s, transform .15s, box-shadow .2s;
          text-align: center;
          box-shadow: 0 4px 14px rgba(139,111,212,0.22);
          cursor: pointer;
          border: none;
          font-family: var(--font-ko);
        }
        .evtpaid .compare-cta:hover {
          background: var(--accent-deep);
          transform: translateY(-2px);
          box-shadow: 0 8px 22px rgba(139,111,212,0.32);
        }

        /* ── LAUNCH CTA (선착순 7팀 + 카운트다운) ── */
        .evtpaid .launch-cta {
          background: linear-gradient(135deg, #14102A 0%, #1F1840 50%, #2D1F5E 100%);
          padding: 80px 40px 100px;
          position: relative;
          overflow: hidden;
        }
        .evtpaid .launch-cta::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(1px 1px at 15% 20%, rgba(255,255,255,0.7), transparent),
            radial-gradient(1px 1px at 80% 30%, rgba(196,168,245,0.8), transparent),
            radial-gradient(1.5px 1.5px at 50% 70%, rgba(255,255,255,0.6), transparent),
            radial-gradient(1px 1px at 25% 85%, rgba(155,184,248,0.7), transparent),
            radial-gradient(1px 1px at 70% 60%, rgba(196,168,245,0.5), transparent);
          opacity: 0.7;
          pointer-events: none;
        }
        .evtpaid .launch-cta::after {
          content: '';
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 800px; height: 600px;
          background: radial-gradient(ellipse, rgba(196,168,245,0.18) 0%, transparent 65%);
          pointer-events: none;
        }
        .evtpaid .launch-cta-inner {
          position: relative; z-index: 1;
          max-width: 980px;
          margin: 0 auto;
          text-align: center;
        }
        .evtpaid .launch-cta-eyebrow {
          display: inline-flex; align-items: center; gap: 10px;
          background: rgba(255,255,255,0.08);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.18);
          padding: 8px 18px;
          border-radius: 100px;
          font-family: var(--font-en);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1.8px;
          color: rgba(255,255,255,0.9);
          margin-bottom: 24px;
        }
        .evtpaid .launch-cta-eyebrow .star {
          color: #FFD75A;
          font-size: 13px;
          line-height: 1;
        }
        .evtpaid .launch-cta-eyebrow .pulse {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #4ADE80;
          animation: evtpaidLaunchPulse 2s infinite;
        }
        @keyframes evtpaidLaunchPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.6); }
          50% { opacity: 0.6; box-shadow: 0 0 0 8px rgba(74, 222, 128, 0); }
        }
        .evtpaid .launch-cta-h {
          font-family: var(--font-ko);
          font-size: clamp(28px, 4vw, 44px);
          font-weight: 700;
          color: #fff;
          letter-spacing: -1.4px;
          line-height: 1.25;
          margin-bottom: 16px;
        }
        .evtpaid .launch-cta-h .accent { color: var(--accent); }
        .evtpaid .launch-cta-sub {
          font-size: 16px;
          color: rgba(255,255,255,0.72);
          line-height: 1.7;
          margin-bottom: 48px;
        }
        .evtpaid .launch-cta-sub strong {
          color: #fff;
          font-weight: 600;
        }

        /* 카운트다운 */
        .evtpaid .launch-countdown {
          display: inline-flex;
          gap: 12px;
          margin-bottom: 48px;
          padding: 20px 28px;
          background: rgba(0,0,0,0.35);
          border: 1px solid rgba(196,168,245,0.25);
          border-radius: var(--radius-lg);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .evtpaid .launch-countdown-label {
          align-self: center;
          font-family: var(--font-en);
          font-size: 11px;
          font-weight: 700;
          color: rgba(255,255,255,0.55);
          letter-spacing: 1.5px;
          text-transform: uppercase;
          padding-right: 18px;
          margin-right: 6px;
          border-right: 1px solid rgba(255,255,255,0.15);
        }
        .evtpaid .launch-countdown-unit {
          text-align: center;
          min-width: 60px;
        }
        .evtpaid .launch-countdown-num {
          font-family: var(--font-en);
          font-size: 32px;
          font-weight: 800;
          color: #fff;
          line-height: 1;
          letter-spacing: -1px;
        }
        .evtpaid .launch-countdown-name {
          font-family: var(--font-en);
          font-size: 10px;
          font-weight: 600;
          color: rgba(196,168,245,0.85);
          letter-spacing: 1.2px;
          margin-top: 6px;
          text-transform: uppercase;
        }

        /* 라이브 라벨 (오픈 후) */
        .evtpaid .launch-live {
          display: none;
          align-items: center;
          gap: 12px;
          margin-bottom: 48px;
          padding: 16px 24px;
          background: rgba(74,222,128,0.12);
          border: 1px solid rgba(74,222,128,0.35);
          border-radius: 100px;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
        }
        .evtpaid .launch-live.show { display: inline-flex; }
        .evtpaid .launch-live::before {
          content: '';
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #4ADE80;
          animation: evtpaidLaunchPulse 2s infinite;
        }

        /* 두 패키지 슬롯 */
        .evtpaid .launch-slots {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          max-width: 720px;
          margin: 0 auto 36px;
        }
        .evtpaid .launch-slot {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: var(--radius-lg);
          padding: 24px 22px;
          text-align: left;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          transition: background .25s, border-color .25s, transform .25s;
          text-decoration: none;
          display: block;
          width: 100%;
          font: inherit;
          color: inherit;
          cursor: pointer;
        }
        .evtpaid .launch-slot:hover {
          background: rgba(196,168,245,0.12);
          border-color: rgba(196,168,245,0.5);
          transform: translateY(-3px);
        }
        .evtpaid .launch-slot-head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 14px;
        }
        .evtpaid .launch-slot-pkg {
          font-family: var(--font-en);
          font-size: 11px;
          font-weight: 800;
          color: var(--accent);
          letter-spacing: 1.5px;
        }
        .evtpaid .launch-slot-count {
          font-family: var(--font-en);
          font-size: 11px;
          font-weight: 700;
          color: rgba(255,255,255,0.85);
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.18);
          padding: 4px 10px;
          border-radius: 100px;
          letter-spacing: .5px;
        }
        .evtpaid .launch-slot-h {
          font-family: var(--font-ko);
          font-size: 18px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -.5px;
          line-height: 1.4;
          margin-bottom: 14px;
        }
        .evtpaid .launch-slot-cta {
          display: flex; align-items: center; justify-content: space-between;
          padding-top: 14px;
          border-top: 1px dashed rgba(255,255,255,0.15);
          font-size: 14px;
          font-weight: 600;
          color: var(--accent);
          transition: color .2s;
        }
        .evtpaid .launch-slot:hover .launch-slot-cta { color: #fff; }
        .evtpaid .launch-slot-cta-arrow { transition: transform .25s; display: inline-block; }
        .evtpaid .launch-slot:hover .launch-slot-cta-arrow {
          transform: translateX(3px);
        }
        .evtpaid .launch-cta-note {
          font-size: 13px;
          color: rgba(255,255,255,0.55);
          line-height: 1.65;
          max-width: 520px;
          margin: 0 auto;
        }

        /* ── CROSS-LINK (FREE 페이지로) ── */
        .evtpaid .cross-link {
          background: #0A0614;
          padding: 80px 40px 100px;
          position: relative;
          overflow: hidden;
        }
        .evtpaid .cross-link::before {
          content: '';
          position: absolute;
          top: -200px; right: -100px;
          width: 600px; height: 400px;
          background: radial-gradient(ellipse, rgba(196,168,245,0.18) 0%, transparent 65%);
          pointer-events: none;
        }
        .evtpaid .cross-link::after {
          content: '';
          position: absolute;
          bottom: -150px; left: -80px;
          width: 500px; height: 350px;
          background: radial-gradient(ellipse, rgba(155,184,248,0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .evtpaid .cross-link-inner {
          position: relative; z-index: 1;
          max-width: 1100px;
          margin: 0 auto;
          text-align: center;
        }
        .evtpaid .cross-link-eyebrow {
          display: inline-flex; align-items: center; gap: 10px;
          font-family: var(--font-en);
          font-size: 12px;
          font-weight: 700;
          color: rgba(255,255,255,0.55);
          letter-spacing: 1.8px;
          text-transform: uppercase;
          margin-bottom: 18px;
        }
        .evtpaid .cross-link-eyebrow::before,
        .evtpaid .cross-link-eyebrow::after {
          content: ''; width: 24px; height: 1px;
          background: rgba(255,255,255,0.3);
        }
        .evtpaid .cross-link-h {
          font-family: var(--font-ko);
          font-size: clamp(24px, 3vw, 36px);
          font-weight: 700;
          color: #fff;
          letter-spacing: -1px;
          line-height: 1.35;
          margin-bottom: 18px;
        }
        .evtpaid .cross-link-h .em { color: var(--accent); }
        .evtpaid .cross-link-sub {
          font-size: 16px;
          color: rgba(255,255,255,0.7);
          line-height: 1.75;
          max-width: 560px;
          margin: 0 auto 40px;
        }
        .evtpaid .cross-card {
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
        .evtpaid .cross-card:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(196,168,245,0.45);
          transform: translateY(-3px);
        }
        .evtpaid .cross-card-badge {
          width: 64px; height: 64px;
          border-radius: 16px;
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent-deep) 100%);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          box-shadow: 0 6px 20px rgba(139,111,212,0.4);
          flex-shrink: 0;
        }
        .evtpaid .cross-card-badge-num {
          font-family: var(--font-en);
          font-size: 22px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -.5px;
          line-height: 1;
        }
        .evtpaid .cross-card-badge-tag {
          font-family: var(--font-en);
          font-size: 9px;
          font-weight: 700;
          color: rgba(255,255,255,0.85);
          letter-spacing: 1.2px;
          margin-top: 4px;
        }
        .evtpaid .cross-card-body { min-width: 0; }
        .evtpaid .cross-card-pkg {
          font-family: var(--font-en);
          font-size: 11px;
          font-weight: 800;
          color: var(--accent);
          letter-spacing: 1.5px;
          margin-bottom: 6px;
        }
        .evtpaid .cross-card-h {
          font-family: var(--font-ko);
          font-size: clamp(18px, 2vw, 22px);
          font-weight: 700;
          color: #fff;
          letter-spacing: -.5px;
          line-height: 1.35;
          margin-bottom: 6px;
        }
        .evtpaid .cross-card-desc {
          font-size: 14.5px;
          color: rgba(255,255,255,0.62);
          line-height: 1.55;
        }
        .evtpaid .cross-card-arrow {
          width: 48px; height: 48px;
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          flex-shrink: 0;
          transition: background .25s, transform .25s, border-color .25s;
        }
        .evtpaid .cross-card:hover .cross-card-arrow {
          background: var(--accent);
          border-color: var(--accent);
          transform: translateX(3px);
        }
        .evtpaid .cross-card-arrow svg { width: 18px; height: 18px; }

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
          .evtpaid .common-targets { padding: 80px 24px 60px; }
          .evtpaid .event01-targets { grid-template-columns: 1fr; }
          .evtpaid .faq-section { padding: 60px 24px; }
          .evtpaid .faq-q { padding: 20px 24px; }
          .evtpaid .faq-q-text { font-size: 16px; }
          .evtpaid .faq-a-inner { padding: 16px 24px 24px; font-size: 14.5px; }
          .evtpaid .compare-section { padding: 60px 24px 80px; }
          .evtpaid .compare-grid { grid-template-columns: 1fr; gap: 30px; }
          .evtpaid .compare-grid::before { display: none; }
          .evtpaid .launch-cta { padding: 60px 24px 80px; }
          .evtpaid .launch-countdown { gap: 8px; padding: 16px 18px; flex-wrap: wrap; justify-content: center; }
          .evtpaid .launch-countdown-label { padding-right: 0; margin-right: 0; border-right: none; padding-bottom: 8px; flex-basis: 100%; text-align: center; }
          .evtpaid .launch-countdown-unit { min-width: 52px; }
          .evtpaid .launch-countdown-num { font-size: 26px; }
          .evtpaid .launch-slots { grid-template-columns: 1fr; gap: 12px; }
          .evtpaid .launch-slot { padding: 20px 18px; }
          .evtpaid .cross-link { padding: 60px 24px 80px; }
          .evtpaid .cross-card { grid-template-columns: auto 1fr; gap: 16px; padding: 22px 22px; }
          .evtpaid .cross-card-arrow { grid-column: 1 / -1; justify-self: flex-end; width: 40px; height: 40px; }
          .evtpaid .cross-card-h { font-size: 18px; }
          .evtpaid .cross-card-badge { width: 56px; height: 56px; }
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
                <button
                  type="button"
                  className="event01-btn"
                  onClick={() => openSignup('EVENT_02_PAID', 'paid-event02-cta')}
                >
                  <span>EVENT 02 신청하기</span>
                  <span className="event01-btn-arrow">→</span>
                </button>
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
                <button
                  type="button"
                  className="event01-btn"
                  onClick={() => openSignup('EVENT_03_PAID', 'paid-event03-cta')}
                >
                  <span>EVENT 03 신청하기</span>
                  <span className="event01-btn-arrow">→</span>
                </button>
                <a href="#event02" className="event01-btn secondary">
                  <span>EVENT 02도 비교해보기</span>
                </a>
              </div>
              <p className="event01-cta-note">누구나 신청 가능 · 자격 검토 없이 바로 진행</p>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
              공통: 이런 분께 드리는 기회입니다
        ══════════════════════════════════════════════ */}
        <section className="common-targets">
          <div className="common-targets-inner">
            <div className="section-eyebrow">FOR YOU</div>
            <h2 className="section-h2">
              이런 분께 드리는<br /><span className="em">기회입니다</span>
            </h2>
            <p className="event01-lead" style={{ marginBottom: 56 }}>
              두 패키지 모두 동일하게 적용되는 권장 대상입니다.<br />
              아래 다섯 가지 중 두 가지 이상 해당되시면 망설이지 말고 신청해주세요.
            </p>

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
        </section>

        {/* ══════════════════════════════════════════════
              FAQ
        ══════════════════════════════════════════════ */}
        <section className="faq-section">
          <div className="faq-inner">
            <div className="section-eyebrow">FAQ</div>
            <h2 className="section-h2">자주 묻는 질문</h2>

            <div className="faq-list">
              {[
                {
                  id: 'faq-1',
                  q: 'EVENT 02와 EVENT 03의 차이를 한 줄로 알려주세요',
                  a: (
                    <>
                      EVENT 02는 <strong>"어디서 보일지"</strong>를 먼저 정리하는 검색 전략 패키지, EVENT 03는 <strong>"무엇을 보여줄지"</strong>를 먼저 정리하는 콘텐츠 기획 패키지입니다. 두 패키지 모두 CORE 1 배포 교육이 포함되어 사이트 공개까지 한 번에 끝납니다.
                    </>
                  ),
                },
                {
                  id: 'faq-2',
                  q: '두 패키지를 모두 신청할 수 있나요?',
                  a: (
                    <>
                      가능합니다. 다만 두 패키지를 모두 진행하시면 CORE 1 배포 교육은 한 번만 진행되고, 001과 002 두 사전 교육이 모두 적용됩니다. 가격은 별도 문의 부탁드립니다.
                    </>
                  ),
                },
                {
                  id: 'faq-3',
                  q: 'EVENT 01(무료)과는 무엇이 다른가요?',
                  a: (
                    <>
                      EVENT 01은 선착순 3분 한정 무료 프로그램으로 자격 검토를 거쳐 진행됩니다. EVENT 02와 03은 자격 검토 없이 누구나 신청 가능한 합리적 가격의 정식 패키지입니다. 사전 교육(001 또는 002)이 추가로 포함되어 더 깊이 있게 진행됩니다.
                    </>
                  ),
                },
                {
                  id: 'faq-4',
                  q: '교육 후 사이트 운영은 어떻게 되나요?',
                  a: (
                    <>
                      교육 당일 배포된 사이트는 yourname.aiseo.tips 형태의 서브도메인으로 즉시 운영 가능합니다. 12개월 동안은 호스팅 · 도메인 · SSL 모두 무료로 제공되며, 이후에도 트렌드에 맞는 최소 비용으로 제공할 예정입니다.
                    </>
                  ),
                },
                {
                  id: 'faq-5',
                  q: '교육 일정은 어떻게 잡나요?',
                  a: (
                    <>
                      신청 후 담당 PM이 카카오톡으로 연락드립니다. 사전 미팅(약 30분)에서 사장님 상황을 파악한 뒤, 사장님 일정에 맞춰 1:1 화상 교육 일정을 확정합니다. 평일 저녁이나 주말 진행도 가능합니다.
                    </>
                  ),
                },
                {
                  id: 'faq-6',
                  q: '미리 준비해야 할 자료가 있나요?',
                  a: (
                    <>
                      형식 갖춘 제안서나 기획서는 필요 없습니다. 기존 홈페이지(있으시면), 사업 카탈로그, 서비스 소개서 중 가지고 계신 것이면 충분합니다. 카카오톡 사전 미팅 때 어떤 자료가 필요한지 함께 정리해드립니다.
                    </>
                  ),
                },
              ].map((item) => {
                const expanded = openFaq === item.id;
                return (
                  <div key={item.id} className="faq-item">
                    <button
                      type="button"
                      className="faq-q"
                      aria-expanded={expanded}
                      aria-controls={item.id}
                      onClick={() => toggleFaq(item.id)}
                    >
                      <span className="faq-q-text">{item.q}</span>
                      <span className="faq-q-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </span>
                    </button>
                    <div className={`faq-a${expanded ? ' open' : ''}`} id={item.id}>
                      <div className="faq-a-inner">{item.a}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
              A vs B 비교 (마지막 결정 도구)
        ══════════════════════════════════════════════ */}
        <section className="compare-section">
          <div className="compare-inner">
            <div className="section-eyebrow">CHOOSE YOUR PATH</div>
            <h2 className="section-h2">
              아직 헷갈리신다면<br /><span className="em">한 번에 비교</span>해보세요
            </h2>
            <p className="event01-lead">
              두 패키지의 출발점이 다릅니다.<br />
              자기 상황에 가까운 쪽을 골라주시면 됩니다.
            </p>

            <div className="compare-grid">
              <article className="compare-card">
                <div className="compare-card-icon" aria-hidden="true">🎯</div>
                <div className="compare-card-pkg">EVENT 02 · PACKAGE A</div>
                <h3 className="compare-card-h">검색에서 보이는 길을<br />먼저 그려두고 싶다면</h3>
                <p className="compare-card-sub">
                  홈페이지를 만들기 전에 키워드 · 경쟁군 · 검색 의도를 먼저 정리합니다. 이후 사이트를 올리면 구조 수정 없이 바로 검색 노출 구조로 연결됩니다.
                </p>
                <ul className="compare-card-list">
                  <li>업종에서 어떤 키워드가 효과적인지 모름</li>
                  <li>경쟁사 분석을 안 해봄</li>
                  <li>검색 노출이 가장 우선이라고 생각</li>
                  <li>홈페이지 내용은 어느 정도 잡혀있음</li>
                </ul>
                <a href="#event02" className="compare-cta">
                  <span>EVENT 02 자세히 보기</span>
                  <span aria-hidden="true">↑</span>
                </a>
              </article>

              <article className="compare-card">
                <div className="compare-card-icon" aria-hidden="true">✍️</div>
                <div className="compare-card-pkg">EVENT 03 · PACKAGE B</div>
                <h3 className="compare-card-h">무엇을 어떻게 쓸지<br />먼저 정리하고 싶다면</h3>
                <p className="compare-card-sub">
                  메뉴 구조부터 서비스 설명, CTA, 톤앤매너까지 콘텐츠를 먼저 설계합니다. AI 도구에 명확한 방향을 넣을 수 있어 결과물 완성도가 크게 높아집니다.
                </p>
                <ul className="compare-card-list">
                  <li>홈페이지에 뭘 써야 할지 막막함</li>
                  <li>메뉴 구조를 어떻게 나눌지 모름</li>
                  <li>서비스 설명이 길고 핵심이 없다는 피드백</li>
                  <li>키워드보다는 내용 정리가 우선</li>
                </ul>
                <a href="#event03" className="compare-cta">
                  <span>EVENT 03 자세히 보기</span>
                  <span aria-hidden="true">↑</span>
                </a>
              </article>
            </div>
          </div>
        </section>

        {/* ── LAUNCH CTA — 선착순 7팀 + 4월 30일 오픈 ── */}
        <section className="launch-cta">
          <div className="launch-cta-inner">
            <div className="launch-cta-eyebrow">
              <span className="star" aria-hidden="true">★</span>
              <span className="pulse" aria-hidden="true"></span>
              <span>EARLY BIRD · LIMITED 7 SLOTS</span>
            </div>

            <h2 className="launch-cta-h">
              각 이벤트 <span className="accent">선착순 7팀</span>씩만<br />
              신청 가능합니다
            </h2>
            <p className="launch-cta-sub">
              2026년 4월 30일 정식 오픈 — <strong>EVENT 02와 EVENT 03 각각 7팀 한정</strong>으로<br />
              진행됩니다. 자리가 마감되는 즉시 신청이 종료됩니다.
            </p>

            {/* 카운트다운 (오픈 전) */}
            <div className="launch-countdown" id="launchCountdown">
              <span className="launch-countdown-label">오픈까지</span>
              <div className="launch-countdown-unit">
                <div className="launch-countdown-num" data-cd="days">--</div>
                <div className="launch-countdown-name">Days</div>
              </div>
              <div className="launch-countdown-unit">
                <div className="launch-countdown-num" data-cd="hours">--</div>
                <div className="launch-countdown-name">Hours</div>
              </div>
              <div className="launch-countdown-unit">
                <div className="launch-countdown-num" data-cd="minutes">--</div>
                <div className="launch-countdown-name">Minutes</div>
              </div>
              <div className="launch-countdown-unit">
                <div className="launch-countdown-num" data-cd="seconds">--</div>
                <div className="launch-countdown-name">Seconds</div>
              </div>
            </div>

            {/* 오픈된 후에만 표시 (카운트다운 useEffect가 .show 토글) */}
            <div className="launch-live" id="launchLive">
              <span>지금 신청 받습니다 — 자리가 곧 마감됩니다</span>
            </div>

            {/* 두 패키지 슬롯 */}
            <div className="launch-slots">
              <button
                type="button"
                className="launch-slot"
                onClick={() => openSignup('EVENT_02_PAID', 'paid-launch-slot-event02')}
              >
                <div className="launch-slot-head">
                  <span className="launch-slot-pkg">EVENT 02 · PACKAGE A</span>
                  <span className="launch-slot-count">7팀 한정</span>
                </div>
                <h4 className="launch-slot-h">🎯 검색 전략 + 사이트 배포</h4>
                <div className="launch-slot-cta">
                  <span>EVENT 02 신청하기</span>
                  <span className="launch-slot-cta-arrow" aria-hidden="true">→</span>
                </div>
              </button>

              <button
                type="button"
                className="launch-slot"
                onClick={() => openSignup('EVENT_03_PAID', 'paid-launch-slot-event03')}
              >
                <div className="launch-slot-head">
                  <span className="launch-slot-pkg">EVENT 03 · PACKAGE B</span>
                  <span className="launch-slot-count">7팀 한정</span>
                </div>
                <h4 className="launch-slot-h">✍️ 콘텐츠 기획 + 사이트 배포</h4>
                <div className="launch-slot-cta">
                  <span>EVENT 03 신청하기</span>
                  <span className="launch-slot-cta-arrow" aria-hidden="true">→</span>
                </div>
              </button>
            </div>

            <p className="launch-cta-note">
              두 패키지 합쳐 총 14팀 한정 · 신청 후 카카오톡으로 일정 협의<br />
              자리가 모두 채워지면 다음 회차로 안내드립니다
            </p>
          </div>
        </section>

        {/* ── CROSS-LINK 배너 (FREE 페이지로) ── */}
        <section className="cross-link">
          <div className="cross-link-inner">
            <div className="cross-link-eyebrow">Limited Free Slot</div>
            <h2 className="cross-link-h">
              선착순 <span className="em">3분 무료 자리</span>도 열려 있습니다
            </h2>
            <p className="cross-link-sub">
              자격 검토 후 선별되는 런칭 파트너 자리 — 비즈니스를 꾸준히<br />
              만들어오신 분이라면 무료로 모든 것을 받아가실 수 있습니다.
            </p>

            <a href="/events2026/free" className="cross-card">
              <div className="cross-card-badge">
                <span className="cross-card-badge-num">01</span>
                <span className="cross-card-badge-tag">FREE</span>
              </div>
              <div className="cross-card-body">
                <div className="cross-card-pkg">EVENT 01 · 선착순 무료</div>
                <div className="cross-card-h">3가지를 전부 무료로 받아가시는 이벤트</div>
                <div className="cross-card-desc">AI 홈페이지 제작 + 도메인·호스팅 + SEO 핵심강의 · 정가 30만원 → 0원</div>
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

      <EventSignupModal
        open={signupOpen}
        onClose={() => setSignupOpen(false)}
        eventCode={signupCode}
        source={signupSource}
      />
    </>
  );
}
