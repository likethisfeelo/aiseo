import { useEffect, useState } from 'react';
import '../landing.css';
import { useSubPageNav } from './useSubPageNav';
import { HeroVideoBox } from '../../components/HeroVideoBox';
import { SiteFooter } from '../../components/SiteFooter';
import { ScheduleRequestWidget } from '../../components/ScheduleRequestWidget';
import type { EventCode } from '../../api';

/**
 * 반려동물 사진작가 특별 이벤트 — `/events2026/pet-photo`
 *
 * EVENT 05. 첫완성패키지(`/events2026/first`, EVENT 04)의 본세션
 * 3회(001 검색 전략 + 002 콘텐츠 기획 + CORE1 즉시 배포)를 그대로
 * 진행하되, 반려동물 사진작가·펫 스튜디오 한정으로 정가 50만원 →
 * 10만원에 제공한다. 사전상담은 카카오톡 문답으로 대체.
 *
 * 신청은 모달 대신 페이지 안에 심은 `ScheduleRequestWidget` 으로
 * 받는다 — 회원가입 없이 이름 + 연락처 + 1·2·3회차 희망 일시(08~23시,
 * 1시간 단위) + 개인정보 동의만 입력하면 기존 `/event-signup` Lambda 로
 * 저장되고 Slack 알림이 간다. 이후 입력된 번호의 카카오톡으로 연락.
 *
 * 구조와 CSS 는 Events2026FirstPage 를 복제해 `.evtpet` 로 스코프를
 * 바꾼 것 — HERO, 포함 과정 미리보기, 패키지 상세(가격 박스 +
 * 001/002/CORE1 core-card), 대상, 희망 시간 등록(launch-cta 스타일),
 * FAQ, EVENT 04 비교, 첫완성패키지 크로스링크.
 */
export function Events2026PetPhotoPage() {
  useSubPageNav();

  // 이 페이지의 모든 신청은 EVENT_05_PET_PHOTO 로 저장된다.
  const SIGNUP_CODE: EventCode = 'EVENT_05_PET_PHOTO';

  // CORE-CARD expandables — closed by default.
  const [openCards, setOpenCards] = useState<Set<string>>(new Set());
  const toggleCard = (id: string) =>
    setOpenCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const isOpen = (id: string) => openCards.has(id);

  // FAQ accordion — single-open.
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const toggleFaq = (id: string) =>
    setOpenFaq((prev) => (prev === id ? null : id));

  // Reveal-on-scroll fade-in for the secondary card grids (same as the
  // First page). Initial dim is applied in JS so a JS-less client / the
  // prerendered snapshot still shows the cards.
  useEffect(() => {
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>(
        '.evtpet .benefit-card, .evtpet .event01-target, .evtpet .compare-card',
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
  const canonicalUrl = `${origin}/events2026/pet-photo`;
  const docTitle =
    '반려동물 사진작가 특별 이벤트 — 50만원 첫완성패키지를 10만원에 | AISEO';
  const metaDescription =
    '반려동물 사진작가·펫 스튜디오를 위한 AISEO 특별 이벤트. 검색 전략 + 콘텐츠 기획 + 즉시 배포 3회 교육, 정가 50만원 → 10만원. 회원가입 없이 희망 교육 시간을 등록하면 카카오톡으로 연락드립니다.';
  const ogImage = `${origin}/events/hero-pc.jpg`;

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
      <meta property="og:image" content={ogImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={docTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={ogImage} />

      {/*
        Scoped CSS — Events2026FirstPage 의 `.evtfirst` 블록을 `.evtpet`
        로 바꿔 그대로 가져왔고, 맨 아래 "PET-PHOTO ADDITIONS" 에 이
        페이지 전용 규칙(hero CTA 줄, 위젯 래퍼)만 추가했다.
      */}
      <style>{`
        /* Local design-token additions used by the paid port. */
        .evtpet {
          --accent-deep: #6B4FB8;
          --bg-dark: #0A0614;
          --bg-dark-2: #14102A;
        }

        /* ── HERO (다크 배경, 별, 프리즘) ── */
        .evtpet .hero {
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
        .evtpet .hero-stars {
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
          animation: evtpetTwinkle 8s ease-in-out infinite;
        }
        @keyframes evtpetTwinkle {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        .evtpet .hero-glow {
          position: absolute; left: 50%; top: 50%;
          width: 800px; height: 800px;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle, rgba(196,168,245,0.18) 0%, rgba(196,168,245,0.05) 35%, transparent 70%);
          z-index: 0;
          pointer-events: none;
        }
        .evtpet .hero-content {
          position: relative; z-index: 2; max-width: 860px;
          width: 100%;
        }
        .evtpet .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.08); color: #fff;
          font-size: 12px; font-weight: 600; padding: 7px 16px;
          border-radius: 100px;
          border: 1px solid rgba(255,255,255,0.18);
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
          margin-bottom: 28px;
          letter-spacing: .4px;
          opacity: 0; transform: translateY(16px);
          animation: evtpetFadeUp .6s ease forwards .1s;
        }
        .evtpet .hero-badge-dot {
          width: 6px; height: 6px;
          background: var(--accent); border-radius: 50%;
          animation: evtpetPulse 2s infinite;
        }
        @keyframes evtpetPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .5; transform: scale(0.7); }
        }
        .evtpet .hero-h1 {
          font-family: var(--font-ko);
          font-size: clamp(40px, 6vw, 72px);
          font-weight: 700;
          line-height: 1.18;
          letter-spacing: -2.5px;
          color: #fff;
          margin-bottom: 28px;
        }
        .evtpet .hero-h1 .accent-text { color: var(--accent); }
        .evtpet .hero-h1 .line {
          display: block;
          opacity: 0; transform: translateY(20px);
          animation: evtpetFadeUp .7s ease forwards;
        }
        .evtpet .hero-h1 .line:nth-child(1) { animation-delay: .2s; }
        .evtpet .hero-h1 .line:nth-child(2) { animation-delay: .35s; }
        .evtpet .hero-h1 .line:nth-child(3) { animation-delay: .5s; }
        .evtpet .hero-sub {
          font-family: var(--font-ko);
          font-size: 16px; line-height: 1.85;
          color: rgba(255,255,255,0.7);
          max-width: 540px; margin: 0 auto;
          opacity: 0; animation: evtpetFadeUp .6s ease forwards .7s;
        }

        .evtpet .hero-prism {
          margin: 56px auto 0;
          width: 220px; height: 220px;
          position: relative;
          opacity: 0; animation: evtpetFadeUp .8s ease forwards .9s;
        }
        .evtpet .hero-prism::before {
          content: '';
          position: absolute; inset: -40px;
          background: radial-gradient(circle, rgba(196,168,245,0.35) 0%, transparent 60%);
          filter: blur(20px);
          z-index: 0;
        }
        .evtpet .prism-svg {
          width: 100%; height: 100%;
          position: relative; z-index: 1;
          animation: evtpetPrismFloat 8s ease-in-out infinite;
        }
        @keyframes evtpetPrismFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(2deg); }
        }

        /* video stub card */
        .evtpet .hero-video {
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
          opacity: 0; animation: evtpetFadeUp .8s ease forwards 1.1s;
          z-index: 2;
        }
        .evtpet .hero-video::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(circle at center, rgba(196,168,245,0.1) 0%, transparent 60%);
          pointer-events: none;
        }
        .evtpet .hero-video-play {
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
        .evtpet .hero-video-play:hover {
          transform: translate(-50%, -50%) scale(1.08);
          box-shadow: 0 14px 40px rgba(196,168,245,0.4);
        }
        .evtpet .hero-video-play svg { width: 22px; height: 22px; margin-left: 3px; }
        .evtpet .hero-video-label {
          position: absolute; bottom: 24px; left: 50%;
          transform: translateX(-50%);
          font-family: var(--font-en);
          font-size: 11px; font-weight: 600;
          color: rgba(255,255,255,0.55);
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        @keyframes evtpetFadeUp { to { opacity: 1; transform: translateY(0); } }

        /* ── SECTION COMMON (override landing.css's section-* defaults) ── */
        .evtpet section { padding: 120px 40px; }
        .evtpet .section-inner { max-width: 1200px; margin: 0 auto; }
        .evtpet .section-eyebrow {
          font-family: var(--font-en);
          font-size: 12px; font-weight: 600;
          color: var(--accent-dark);
          letter-spacing: 1.5px; text-transform: uppercase;
          margin-bottom: 16px;
          text-align: center;
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .evtpet .section-eyebrow::before,
        .evtpet .section-eyebrow::after {
          content: ''; width: 24px; height: 1px;
          background: var(--accent);
          opacity: 0.5;
        }
        .evtpet .section-h2 {
          font-family: var(--font-ko);
          font-size: clamp(28px, 3.6vw, 42px);
          font-weight: 700; line-height: 1.3;
          letter-spacing: -1.2px;
          color: var(--text-primary);
          text-align: center;
          margin: 0 auto 18px;
          max-width: none;
        }
        .evtpet .section-h2 .em { color: var(--accent-dark); }
        .evtpet .section-sub {
          font-family: var(--font-ko);
          font-size: 16px; color: var(--text-secondary);
          line-height: 1.75; text-align: center;
          max-width: 620px; margin: 0 auto;
        }

        /* ── 두 패키지 미리보기 (Benefits) ── */
        .evtpet .benefits {
          background: var(--bg);
          padding-top: 120px;
          padding-bottom: 60px;
        }
        .evtpet .benefits-header { margin-bottom: 56px; }
        .evtpet .benefits-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
          max-width: 1040px;
          margin: 0 auto;
        }
        .evtpet .benefit-card {
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
        .evtpet .benefit-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
          border-color: rgba(196,168,245,0.3);
        }
        .evtpet .benefit-card.violet { background: linear-gradient(180deg, #F5EFFF 0%, #FAF6FF 100%); border-color: rgba(196,168,245,0.25); }
        .evtpet .benefit-card.mint   { background: linear-gradient(180deg, #E8F7F0 0%, #F1FAF6 100%); border-color: rgba(127,200,166,0.25); }
        .evtpet .benefit-card.cream  { background: linear-gradient(180deg, #FFF4E8 0%, #FFF9F1 100%); border-color: rgba(255,196,122,0.28); }
        .evtpet .benefit-eyebrow {
          font-family: var(--font-en);
          font-size: 10px; font-weight: 700;
          letter-spacing: 1.5px;
          color: var(--text-muted);
          margin-bottom: 18px;
        }
        .evtpet .benefit-eyebrow .dot {
          display: inline-block; width: 4px; height: 4px;
          border-radius: 50%; background: var(--text-muted);
          margin: 0 8px; vertical-align: middle;
        }
        .evtpet .benefit-title {
          font-family: var(--font-ko);
          font-size: 20px; font-weight: 700;
          letter-spacing: -.6px;
          margin-bottom: 12px;
          line-height: 1.4;
          color: var(--text-primary);
        }
        .evtpet .benefit-desc {
          font-size: 13.5px;
          color: var(--text-secondary);
          line-height: 1.7;
          flex: 1;
        }
        .evtpet .benefit-foot {
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px dashed rgba(0,0,0,0.08);
          font-size: 12px;
          color: var(--text-muted);
          display: flex; align-items: center; gap: 6px;
        }
        .evtpet .benefit-foot::before {
          content: '→';
          color: var(--accent-dark);
          font-weight: 700;
        }

        /* ── PKG SECTION (EVENT 02 / 03) ── */
        .evtpet .pkg-section {
          background: var(--bg-soft);
          padding: 100px 40px;
          position: relative;
          overflow: hidden;
        }
        .evtpet .pkg-section.alt { background: var(--bg); }
        .evtpet .pkg-section::before {
          content: '';
          position: absolute;
          top: -160px; left: 50%;
          transform: translateX(-50%);
          width: 700px; height: 380px;
          background: radial-gradient(ellipse, rgba(196,168,245,0.10) 0%, transparent 70%);
          pointer-events: none;
        }
        .evtpet .pkg-section-inner {
          position: relative; z-index: 1;
          max-width: 1240px;
          margin: 0 auto;
        }

        /* tag pill 헤더 */
        .evtpet .event01-tag-row { text-align: center; }
        .evtpet .event01-tag {
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
        .evtpet .event01-tag .num {
          width: 22px; height: 22px;
          background: var(--accent);
          color: #fff;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px;
          font-weight: 800;
        }

        .evtpet .pkg-section .section-h2 { margin-bottom: 16px; }
        .evtpet .event01-lead {
          font-family: var(--font-ko);
          text-align: center;
          font-size: 16px;
          color: var(--text-secondary);
          line-height: 1.8;
          max-width: 580px;
          margin: 0 auto 56px;
        }

        /* 가격 박스 */
        .evtpet .pkg-price {
          max-width: 520px;
          margin: 0 auto 56px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 32px 36px;
          box-shadow: var(--shadow-sm);
        }
        .evtpet .pkg-price-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 0;
          font-size: 16px;
          color: var(--text-secondary);
          gap: 20px;
        }
        .evtpet .pkg-price-row .label {
          color: var(--text-primary);
          font-weight: 600;
          font-size: 16px;
          letter-spacing: -.2px;
        }
        .evtpet .pkg-price-row .label small {
          display: block;
          font-size: 13px;
          color: var(--text-muted);
          margin-top: 4px;
          font-weight: 400;
          letter-spacing: .1px;
        }
        .evtpet .pkg-price-row .num {
          font-family: var(--font-en);
          font-weight: 700;
          color: var(--text-primary);
          font-size: 17px;
          flex-shrink: 0;
        }
        .evtpet .pkg-price-divider {
          border-top: 1px dashed var(--border);
          margin: 14px 0 10px;
        }
        .evtpet .pkg-price-sum {
          display: flex; align-items: center; justify-content: space-between;
          padding: 6px 0 18px;
          font-size: 15px;
          color: var(--text-muted);
        }
        .evtpet .pkg-price-sum .num {
          font-family: var(--font-en);
          font-weight: 600;
          color: var(--text-secondary);
          font-size: 16px;
        }
        .evtpet .pkg-price-final {
          background: linear-gradient(135deg, var(--accent-deep) 0%, var(--accent-dark) 100%);
          color: #fff;
          border-radius: var(--radius-md);
          padding: 22px 26px;
          display: flex; align-items: center; justify-content: space-between;
          margin-top: 8px;
          box-shadow: 0 6px 18px rgba(107, 79, 184, 0.25);
        }
        .evtpet .pkg-price-final .label {
          font-size: 14.5px;
          font-weight: 600;
          color: rgba(255,255,255,0.9);
          letter-spacing: .3px;
        }
        .evtpet .pkg-price-final .num {
          font-family: var(--font-en);
          font-size: 38px;
          font-weight: 800;
          letter-spacing: -1.8px;
          line-height: 1;
        }
        .evtpet .pkg-price-final .num .unit {
          font-size: 18px;
          font-weight: 600;
          color: var(--accent);
          margin-left: 3px;
        }
        .evtpet .pkg-price-saved {
          text-align: center;
          margin-top: 16px;
          font-size: 14px;
          color: var(--accent-deep);
          font-weight: 700;
          letter-spacing: .2px;
        }
        .evtpet .pkg-price-saved::before {
          content: '★ ';
          color: #E8A60E;
        }

        /* free-bundle-core wrapper (재사용: 사전 카드 + CORE notice + CORE 1 카드 묶음) */
        .evtpet .free-bundle-core {
          margin: 0 auto 56px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* CORE NOTICE 박스 */
        .evtpet .core-notice {
          display: flex; align-items: flex-start; gap: 14px;
          background: linear-gradient(135deg, rgba(196,168,245,0.16) 0%, rgba(155,184,248,0.12) 100%);
          border: 1px solid rgba(196,168,245,0.32);
          border-radius: var(--radius-lg);
          padding: 18px 24px;
        }
        .evtpet .core-notice-star {
          flex-shrink: 0;
          width: 28px; height: 28px;
          background: #FFE99A;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 6px rgba(255, 200, 80, 0.35);
          margin-top: 2px;
        }
        .evtpet .core-notice-star::before {
          content: '★';
          color: #E8A60E;
          font-size: 14px;
          line-height: 1;
        }
        .evtpet .core-notice-body { text-align: left; flex: 1; }
        .evtpet .core-notice-title {
          font-size: 15px; font-weight: 700;
          color: var(--accent-deep);
          letter-spacing: -.2px;
          margin-bottom: 4px;
          line-height: 1.4;
        }
        .evtpet .core-notice-sub {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.55;
          font-weight: 400;
        }

        /* CORE CARD (확장형) */
        .evtpet .core-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          text-align: left;
          transition: border-color .2s, box-shadow .2s;
          overflow: hidden;
        }
        .evtpet .core-card:hover {
          border-color: rgba(196,168,245,0.4);
          box-shadow: var(--shadow-md);
        }
        .evtpet .core-card-header {
          display: grid;
          grid-template-columns: auto 1fr auto auto;
          gap: 22px;
          align-items: center;
          padding: 22px 26px;
        }
        .evtpet .core-card-icon {
          width: 56px; height: 56px;
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent-deep) 100%);
          border-radius: var(--radius-md);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 14px rgba(139,111,212,0.3);
          flex-shrink: 0;
        }
        .evtpet .core-card-icon-text {
          font-family: var(--font-en);
          font-size: 12px;
          font-weight: 800;
          color: #fff;
          letter-spacing: .5px;
        }
        .evtpet .core-card-body { min-width: 0; }
        .evtpet .core-card-label {
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
        .evtpet .core-card-h {
          font-family: var(--font-ko);
          font-size: clamp(16px, 1.5vw, 18px);
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -.3px;
          margin-bottom: 10px;
          line-height: 1.4;
        }
        .evtpet .core-card-tags {
          display: flex; flex-wrap: wrap; gap: 6px;
        }
        .evtpet .core-card-tag {
          font-size: 12.5px;
          color: var(--text-muted);
          background: var(--bg-soft);
          border: 1px solid var(--border-soft);
          padding: 4px 10px;
          border-radius: 100px;
          font-weight: 500;
        }
        .evtpet .core-card-price {
          text-align: right;
          flex-shrink: 0;
          display: flex; align-items: center; gap: 6px;
        }
        .evtpet .core-card-price-strike {
          font-size: 13px;
          color: var(--text-muted);
          text-decoration: line-through;
          text-decoration-color: rgba(155,155,155,0.7);
          font-weight: 500;
        }
        .evtpet .core-card-price-arrow {
          color: var(--accent-dark);
          font-weight: 700;
          margin: 0 2px;
        }
        .evtpet .core-card-price-free {
          font-size: 17px;
          font-weight: 800;
          color: var(--accent-deep);
          letter-spacing: -.4px;
        }
        .evtpet .core-card-toggle {
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
        .evtpet .core-card-toggle:hover {
          background: var(--accent-light);
          border-color: rgba(196,168,245,0.4);
        }
        .evtpet .core-card-toggle svg {
          width: 16px; height: 16px;
          transition: transform .35s cubic-bezier(0.65, 0.05, 0.35, 1);
        }
        .evtpet .core-card-toggle[aria-expanded="true"] svg {
          transform: rotate(180deg);
        }
        .evtpet .core-card-expand {
          overflow: hidden;
          max-height: 0;
          transition: max-height .5s cubic-bezier(0.65, 0.05, 0.35, 1);
        }
        .evtpet .core-card-expand.open { max-height: 1500px; }
        .evtpet .core-card-expand-inner {
          border-top: 1px solid var(--border-soft);
          padding: 32px 30px 32px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 36px;
        }
        .evtpet .core-col-section + .core-col-section { margin-top: 26px; }
        .evtpet .core-col-h {
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
        .evtpet .core-col-section.muted .core-col-h {
          background: var(--text-primary);
        }
        .evtpet .core-col-desc {
          font-size: 14.5px;
          color: var(--text-secondary);
          line-height: 1.75;
        }
        .evtpet .core-col-desc + .core-col-desc { margin-top: 14px; }
        .evtpet .core-col-list {
          list-style: none;
          display: flex; flex-direction: column;
          gap: 9px;
          padding: 0; margin: 0;
        }
        .evtpet .core-col-list.bullet li {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.6;
          padding-left: 16px;
          position: relative;
        }
        .evtpet .core-col-list.bullet li::before {
          content: '';
          position: absolute;
          left: 0; top: 9px;
          width: 5px; height: 5px;
          background: var(--accent);
          border-radius: 50%;
        }
        .evtpet .core-col-list.check li {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.6;
          padding-left: 22px;
          position: relative;
        }
        .evtpet .core-col-list.check li::before {
          content: '✓';
          position: absolute;
          left: 0; top: 0;
          color: var(--accent-dark);
          font-weight: 700;
          font-size: 13px;
        }
        .evtpet .core-col-chips {
          display: flex; flex-wrap: wrap; gap: 8px;
          margin-top: 4px;
        }
        .evtpet .core-col-chip {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--bg-soft);
          border: 1px solid var(--border-soft);
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 500;
          padding: 6px 12px;
          border-radius: 100px;
        }
        .evtpet .core-col-chip-icon { font-size: 14px; line-height: 1; }

        /* PKG SECTION CTA */
        .evtpet .event01-cta {
          margin-top: 64px;
          text-align: center;
        }
        .evtpet .event01-cta-row {
          display: inline-flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .evtpet .event01-btn {
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
        .evtpet .event01-btn:hover {
          background: var(--accent-deep);
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(139,111,212,0.35);
        }
        .evtpet .event01-btn.secondary {
          background: var(--bg-card);
          color: var(--text-primary);
          border-color: var(--border);
          box-shadow: none;
        }
        .evtpet .event01-btn.secondary:hover {
          border-color: var(--accent);
          background: var(--bg-soft);
          box-shadow: var(--shadow-sm);
        }
        .evtpet .event01-btn-arrow { transition: transform .2s; display: inline-block; }
        .evtpet .event01-btn:hover .event01-btn-arrow { transform: translateX(3px); }
        .evtpet .event01-cta-note {
          margin-top: 18px;
          font-size: 12.5px;
          color: var(--text-muted);
          letter-spacing: .2px;
        }

        /* ── 공통 타겟 ── */
        .evtpet .common-targets {
          background: var(--bg);
          padding: 100px 40px 80px;
        }
        .evtpet .common-targets-inner {
          max-width: 1100px;
          margin: 0 auto;
        }
        .evtpet .event01-targets {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          max-width: 920px;
          margin: 0 auto;
        }
        .evtpet .event01-target {
          display: flex; align-items: flex-start; gap: 12px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 18px 20px;
          transition: border-color .2s, transform .2s;
        }
        .evtpet .event01-target:hover {
          border-color: rgba(196,168,245,0.35);
          transform: translateY(-2px);
        }
        .evtpet .event01-target-icon {
          width: 28px; height: 28px;
          border-radius: 50%;
          background: var(--accent-light);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .evtpet .event01-target-icon svg {
          width: 14px; height: 14px;
          stroke: var(--accent-dark);
          stroke-width: 2.5;
          fill: none;
        }
        .evtpet .event01-target-text {
          font-family: var(--font-ko);
          font-size: 16.5px;
          color: var(--text-primary);
          line-height: 1.6;
          font-weight: 500;
          margin: 0;
        }

        /* ── FAQ ── */
        .evtpet .faq-section {
          background: var(--bg-soft);
          padding: 100px 40px;
        }
        .evtpet .faq-inner {
          max-width: 800px;
          margin: 0 auto;
        }
        .evtpet .faq-list { margin-top: 48px; }
        .evtpet .faq-item {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          margin-bottom: 10px;
          transition: border-color .2s, box-shadow .2s;
          overflow: hidden;
        }
        .evtpet .faq-item:hover {
          border-color: rgba(196,168,245,0.35);
        }
        .evtpet .faq-q {
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
        .evtpet .faq-q-text {
          font-family: var(--font-ko);
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary);
          letter-spacing: -.3px;
          line-height: 1.5;
          flex: 1;
        }
        .evtpet .faq-q-icon {
          flex-shrink: 0;
          width: 32px; height: 32px;
          border-radius: 50%;
          background: var(--accent-light);
          display: flex; align-items: center; justify-content: center;
          color: var(--accent-dark);
          transition: transform .35s cubic-bezier(0.65, 0.05, 0.35, 1);
        }
        .evtpet .faq-q-icon svg { width: 15px; height: 15px; }
        .evtpet .faq-q[aria-expanded="true"] .faq-q-icon { transform: rotate(180deg); }
        .evtpet .faq-a {
          overflow: hidden;
          max-height: 0;
          transition: max-height .4s cubic-bezier(0.65, 0.05, 0.35, 1);
        }
        .evtpet .faq-a.open { max-height: 500px; }
        .evtpet .faq-a-inner {
          padding: 22px 30px 28px;
          font-size: 16px;
          color: var(--text-secondary);
          line-height: 1.8;
          border-top: 1px dashed var(--border);
        }
        .evtpet .faq-a-inner strong {
          color: var(--text-primary);
          font-weight: 700;
        }

        /* ── A vs B 비교 ── */
        .evtpet .compare-section {
          background: var(--bg);
          padding: 100px 40px 120px;
        }
        .evtpet .compare-inner {
          max-width: 1100px;
          margin: 0 auto;
        }
        .evtpet .compare-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 22px;
          margin-top: 56px;
          position: relative;
        }
        .evtpet .compare-grid::before {
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
        .evtpet .compare-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 36px 32px;
          transition: transform .25s, box-shadow .25s, border-color .25s;
          display: flex;
          flex-direction: column;
        }
        .evtpet .compare-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
          border-color: rgba(196,168,245,0.4);
        }
        .evtpet .compare-card-icon {
          font-size: 40px;
          margin-bottom: 18px;
          line-height: 1;
        }
        .evtpet .compare-card-pkg {
          font-family: var(--font-en);
          font-size: 12px;
          font-weight: 800;
          color: var(--accent-deep);
          letter-spacing: 1.5px;
          margin-bottom: 10px;
        }
        .evtpet .compare-card-h {
          font-family: var(--font-ko);
          font-size: clamp(24px, 2.6vw, 30px);
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -.8px;
          line-height: 1.3;
          margin-bottom: 14px;
        }
        .evtpet .compare-card-sub {
          font-size: 16px;
          color: var(--text-secondary);
          line-height: 1.7;
          margin-bottom: 26px;
          padding-bottom: 26px;
          border-bottom: 1px dashed var(--border);
        }
        .evtpet .compare-card-list {
          list-style: none;
          display: flex; flex-direction: column;
          gap: 13px;
          margin: 0 0 30px;
          padding: 0;
        }
        .evtpet .compare-card-list li {
          font-size: 16px;
          color: var(--text-primary);
          line-height: 1.55;
          padding-left: 24px;
          position: relative;
          font-weight: 500;
        }
        .evtpet .compare-card-list li::before {
          content: '✓';
          position: absolute;
          left: 0; top: 0;
          color: var(--accent-dark);
          font-weight: 800;
          font-size: 15px;
        }
        .evtpet .compare-cta {
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
        .evtpet .compare-cta:hover {
          background: var(--accent-deep);
          transform: translateY(-2px);
          box-shadow: 0 8px 22px rgba(139,111,212,0.32);
        }

        /* ── LAUNCH CTA (선착순 7팀 + 카운트다운) ── */
        .evtpet .launch-cta {
          background: linear-gradient(135deg, #14102A 0%, #1F1840 50%, #2D1F5E 100%);
          padding: 80px 40px 100px;
          position: relative;
          overflow: hidden;
        }
        .evtpet .launch-cta::before {
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
        .evtpet .launch-cta::after {
          content: '';
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 800px; height: 600px;
          background: radial-gradient(ellipse, rgba(196,168,245,0.18) 0%, transparent 65%);
          pointer-events: none;
        }
        .evtpet .launch-cta-inner {
          position: relative; z-index: 1;
          max-width: 980px;
          margin: 0 auto;
          text-align: center;
        }
        .evtpet .launch-cta-eyebrow {
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
        .evtpet .launch-cta-eyebrow .star {
          color: #FFD75A;
          font-size: 13px;
          line-height: 1;
        }
        .evtpet .launch-cta-eyebrow .pulse {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #4ADE80;
          animation: evtpetLaunchPulse 2s infinite;
        }
        @keyframes evtpetLaunchPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.6); }
          50% { opacity: 0.6; box-shadow: 0 0 0 8px rgba(74, 222, 128, 0); }
        }
        .evtpet .launch-cta-h {
          font-family: var(--font-ko);
          font-size: clamp(28px, 4vw, 44px);
          font-weight: 700;
          color: #fff;
          letter-spacing: -1.4px;
          line-height: 1.25;
          margin-bottom: 16px;
        }
        .evtpet .launch-cta-h .accent { color: var(--accent); }
        .evtpet .launch-cta-sub {
          font-size: 16px;
          color: rgba(255,255,255,0.72);
          line-height: 1.7;
          margin-bottom: 48px;
        }
        .evtpet .launch-cta-sub strong {
          color: #fff;
          font-weight: 600;
        }

        /* 카운트다운 */
        .evtpet .launch-countdown {
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
        .evtpet .launch-countdown-label {
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
        .evtpet .launch-countdown-unit {
          text-align: center;
          min-width: 60px;
        }
        .evtpet .launch-countdown-num {
          font-family: var(--font-en);
          font-size: 32px;
          font-weight: 800;
          color: #fff;
          line-height: 1;
          letter-spacing: -1px;
        }
        .evtpet .launch-countdown-name {
          font-family: var(--font-en);
          font-size: 10px;
          font-weight: 600;
          color: rgba(196,168,245,0.85);
          letter-spacing: 1.2px;
          margin-top: 6px;
          text-transform: uppercase;
        }

        /* 라이브 라벨 (오픈 후) */
        .evtpet .launch-live {
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
        .evtpet .launch-live.show { display: inline-flex; }
        .evtpet .launch-live::before {
          content: '';
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #4ADE80;
          animation: evtpetLaunchPulse 2s infinite;
        }

        /* 두 패키지 슬롯 */
        .evtpet .launch-slots {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          max-width: 720px;
          margin: 0 auto 36px;
        }
        .evtpet .launch-slot {
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
        .evtpet .launch-slot:hover {
          background: rgba(196,168,245,0.12);
          border-color: rgba(196,168,245,0.5);
          transform: translateY(-3px);
        }
        .evtpet .launch-slot-head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 14px;
        }
        .evtpet .launch-slot-pkg {
          font-family: var(--font-en);
          font-size: 11px;
          font-weight: 800;
          color: var(--accent);
          letter-spacing: 1.5px;
        }
        .evtpet .launch-slot-count {
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
        .evtpet .launch-slot-h {
          font-family: var(--font-ko);
          font-size: 18px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -.5px;
          line-height: 1.4;
          margin-bottom: 14px;
        }
        .evtpet .launch-slot-cta {
          display: flex; align-items: center; justify-content: space-between;
          padding-top: 14px;
          border-top: 1px dashed rgba(255,255,255,0.15);
          font-size: 14px;
          font-weight: 600;
          color: var(--accent);
          transition: color .2s;
        }
        .evtpet .launch-slot:hover .launch-slot-cta { color: #fff; }
        .evtpet .launch-slot-cta-arrow { transition: transform .25s; display: inline-block; }
        .evtpet .launch-slot:hover .launch-slot-cta-arrow {
          transform: translateX(3px);
        }
        .evtpet .launch-cta-note {
          font-size: 13px;
          color: rgba(255,255,255,0.55);
          line-height: 1.65;
          max-width: 520px;
          margin: 0 auto;
        }

        /* ── CROSS-LINK (FREE 페이지로) ── */
        .evtpet .cross-link {
          background: #0A0614;
          padding: 80px 40px 100px;
          position: relative;
          overflow: hidden;
        }
        .evtpet .cross-link::before {
          content: '';
          position: absolute;
          top: -200px; right: -100px;
          width: 600px; height: 400px;
          background: radial-gradient(ellipse, rgba(196,168,245,0.18) 0%, transparent 65%);
          pointer-events: none;
        }
        .evtpet .cross-link::after {
          content: '';
          position: absolute;
          bottom: -150px; left: -80px;
          width: 500px; height: 350px;
          background: radial-gradient(ellipse, rgba(155,184,248,0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .evtpet .cross-link-inner {
          position: relative; z-index: 1;
          max-width: 1100px;
          margin: 0 auto;
          text-align: center;
        }
        .evtpet .cross-link-eyebrow {
          display: inline-flex; align-items: center; gap: 10px;
          font-family: var(--font-en);
          font-size: 12px;
          font-weight: 700;
          color: rgba(255,255,255,0.55);
          letter-spacing: 1.8px;
          text-transform: uppercase;
          margin-bottom: 18px;
        }
        .evtpet .cross-link-eyebrow::before,
        .evtpet .cross-link-eyebrow::after {
          content: ''; width: 24px; height: 1px;
          background: rgba(255,255,255,0.3);
        }
        .evtpet .cross-link-h {
          font-family: var(--font-ko);
          font-size: clamp(24px, 3vw, 36px);
          font-weight: 700;
          color: #fff;
          letter-spacing: -1px;
          line-height: 1.35;
          margin-bottom: 18px;
        }
        .evtpet .cross-link-h .em { color: var(--accent); }
        .evtpet .cross-link-sub {
          font-size: 16px;
          color: rgba(255,255,255,0.7);
          line-height: 1.75;
          max-width: 560px;
          margin: 0 auto 40px;
        }
        .evtpet .cross-card {
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
        .evtpet .cross-card:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(196,168,245,0.45);
          transform: translateY(-3px);
        }
        .evtpet .cross-card-badge {
          width: 64px; height: 64px;
          border-radius: 16px;
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent-deep) 100%);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          box-shadow: 0 6px 20px rgba(139,111,212,0.4);
          flex-shrink: 0;
        }
        .evtpet .cross-card-badge-num {
          font-family: var(--font-en);
          font-size: 22px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -.5px;
          line-height: 1;
        }
        .evtpet .cross-card-badge-tag {
          font-family: var(--font-en);
          font-size: 9px;
          font-weight: 700;
          color: rgba(255,255,255,0.85);
          letter-spacing: 1.2px;
          margin-top: 4px;
        }
        .evtpet .cross-card-body { min-width: 0; }
        .evtpet .cross-card-pkg {
          font-family: var(--font-en);
          font-size: 11px;
          font-weight: 800;
          color: var(--accent);
          letter-spacing: 1.5px;
          margin-bottom: 6px;
        }
        .evtpet .cross-card-h {
          font-family: var(--font-ko);
          font-size: clamp(18px, 2vw, 22px);
          font-weight: 700;
          color: #fff;
          letter-spacing: -.5px;
          line-height: 1.35;
          margin-bottom: 6px;
        }
        .evtpet .cross-card-desc {
          font-size: 14.5px;
          color: rgba(255,255,255,0.62);
          line-height: 1.55;
        }
        .evtpet .cross-card-arrow {
          width: 48px; height: 48px;
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          flex-shrink: 0;
          transition: background .25s, transform .25s, border-color .25s;
        }
        .evtpet .cross-card:hover .cross-card-arrow {
          background: var(--accent);
          border-color: var(--accent);
          transform: translateX(3px);
        }
        .evtpet .cross-card-arrow svg { width: 18px; height: 18px; }

        @media (max-width: 900px) {
          .evtpet section { padding: 80px 24px; }
          .evtpet .hero { padding: 120px 24px 60px; min-height: auto; }
          .evtpet .hero-prism { width: 160px; height: 160px; }
          .evtpet .benefits-grid { grid-template-columns: 1fr; }
          .evtpet .pkg-section { padding: 60px 24px; }
          .evtpet .pkg-price { padding: 26px 24px; }
          .evtpet .pkg-price-final { padding: 18px 20px; }
          .evtpet .pkg-price-final .num { font-size: 30px; }
          .evtpet .pkg-price-row .label { font-size: 14.5px; }
          .evtpet .pkg-price-row .label small { font-size: 12px; }
          .evtpet .pkg-price-row .num { font-size: 15px; }
          .evtpet .core-card-header { grid-template-columns: auto 1fr auto; gap: 14px; padding: 18px 20px; }
          .evtpet .core-card-toggle { grid-column: 3; }
          .evtpet .core-card-price { grid-column: 1 / -1; justify-content: flex-end; padding-top: 10px; border-top: 1px dashed var(--border); }
          .evtpet .core-card-expand-inner { grid-template-columns: 1fr; gap: 26px; padding: 24px 22px; }
          .evtpet .core-notice { padding: 16px 20px; }
          .evtpet .core-notice-title { font-size: 14px; }
          .evtpet .core-notice-sub { font-size: 13px; }
          .evtpet .common-targets { padding: 80px 24px 60px; }
          .evtpet .event01-targets { grid-template-columns: 1fr; }
          .evtpet .faq-section { padding: 60px 24px; }
          .evtpet .faq-q { padding: 20px 24px; }
          .evtpet .faq-q-text { font-size: 16px; }
          .evtpet .faq-a-inner { padding: 16px 24px 24px; font-size: 14.5px; }
          .evtpet .compare-section { padding: 60px 24px 80px; }
          .evtpet .compare-grid { grid-template-columns: 1fr; gap: 30px; }
          .evtpet .compare-grid::before { display: none; }
          .evtpet .launch-cta { padding: 60px 24px 80px; }
          .evtpet .launch-countdown { gap: 8px; padding: 16px 18px; flex-wrap: wrap; justify-content: center; }
          .evtpet .launch-countdown-label { padding-right: 0; margin-right: 0; border-right: none; padding-bottom: 8px; flex-basis: 100%; text-align: center; }
          .evtpet .launch-countdown-unit { min-width: 52px; }
          .evtpet .launch-countdown-num { font-size: 26px; }
          .evtpet .launch-slots { grid-template-columns: 1fr; gap: 12px; }
          .evtpet .launch-slot { padding: 20px 18px; }
          .evtpet .cross-link { padding: 60px 24px 80px; }
          .evtpet .cross-card { grid-template-columns: auto 1fr; gap: 16px; padding: 22px 22px; }
          .evtpet .cross-card-arrow { grid-column: 1 / -1; justify-self: flex-end; width: 40px; height: 40px; }
          .evtpet .cross-card-h { font-size: 18px; }
          .evtpet .cross-card-badge { width: 56px; height: 56px; }
        }
        @media (max-width: 480px) {
          .evtpet .hero-h1 { letter-spacing: -1.5px; }
          .evtpet .section-h2 { letter-spacing: -.8px; }
          .evtpet .event01-cta-row { flex-direction: column; width: 100%; }
          .evtpet .event01-btn { width: 100%; justify-content: center; }
        }
        /* ── PET-PHOTO ADDITIONS ── */
        .evtpet .hero-cta-row {
          display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;
          position: relative; z-index: 2;
          margin: 4px 0 44px;
        }
        .evtpet .hero-cta-row .btn-primary-lg,
        .evtpet .hero-cta-row .btn-outline-lg {
          display: inline-flex; align-items: center; gap: 8px;
        }
        .evtpet .hero-price-strip {
          display: inline-flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: center;
          margin: 0 auto 26px;
          padding: 10px 18px;
          border-radius: 100px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.16);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          font-size: 14px;
          color: rgba(255,255,255,0.82);
        }
        .evtpet .hero-price-strip .strike { text-decoration: line-through; opacity: .6; }
        .evtpet .hero-price-strip .now {
          font-family: var(--font-en); font-weight: 800; font-size: 20px; color: var(--accent);
          letter-spacing: -0.5px;
        }
        .evtpet .hero-price-strip .now small { font-family: var(--font-ko); font-size: 13px; font-weight: 700; margin-left: 2px; }
        .evtpet .hero-price-strip .off {
          font-family: var(--font-en); font-size: 11px; font-weight: 800; letter-spacing: 1px;
          padding: 3px 8px; border-radius: 6px; background: var(--accent); color: #14102A;
        }
        .evtpet .apply-widget-wrap { text-align: left; margin-top: 8px; }
        .evtpet .apply-time-badges {
          display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;
          margin: -20px 0 32px;
        }
        .evtpet .apply-time-badge {
          font-size: 13px; color: rgba(255,255,255,0.85);
          padding: 7px 14px; border-radius: 100px;
          background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.16);
        }
        .evtpet .apply-time-badge strong { color: var(--accent); }
        @media (max-width: 480px) {
          .evtpet .hero-cta-row { flex-direction: column; width: 100%; }
          .evtpet .hero-cta-row a { width: 100%; justify-content: center; }
        }
      `}</style>

      {/* NAV — landing-style, with the events dropdown. */}
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
                <a href="/events2026/first" role="menuitem">첫완성패키지</a>
                <a href="/events2026/pet-photo" className="active" role="menuitem">반려동물 사진작가 이벤트</a>
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
          <a href="/events2026/pet-photo" className="nmm-link nmm-sublink">└ 반려동물 사진작가 이벤트</a>
          <a href="/blog" className="nmm-link">블로그</a>
        </nav>
        <div className="nmm-cta">
          <a href="/?auth=login" className="nmm-btn-ghost">로그인</a>
          <a href="/?auth=login" className="nmm-btn-primary">지금 시작하기</a>
        </div>
      </div>

      <div className="evtpet">
        {/* ── HERO ── */}
        <section className="hero">
          <div className="hero-stars" aria-hidden="true"></div>
          <div className="hero-glow" aria-hidden="true"></div>
          <div className="hero-content">
            <div className="hero-badge">
              <span className="hero-badge-dot" aria-hidden="true"></span>
              <span>EVENTS 2026 · 반려동물 사진작가 특별</span>
            </div>
            <h1 className="hero-h1">
              <span className="line">반려동물 사진작가님,</span>
              <span className="line">검색되는 홈페이지를</span>
              <span className="line"><span className="accent-text">10만원</span>에 완성하세요</span>
            </h1>
            <p className="hero-sub">
              정가 50만원 첫완성패키지(검색 전략 + 콘텐츠 기획 + 즉시 배포)를<br />
              반려동물 사진작가·펫 스튜디오 한정 10만원에 진행합니다.<br />
              회원가입 없이 희망 교육 시간만 등록하시면 카카오톡으로 연락드립니다.
            </p>

            <div className="hero-price-strip">
              <span className="strike">정가 50만원</span>
              <span aria-hidden="true">→</span>
              <span className="now">10<small>만원</small></span>
              <span className="off">80% OFF</span>
            </div>

            <div className="hero-cta-row">
              <a href="#apply" className="btn-primary-lg">
                <span>희망 교육 시간 등록하기</span>
                <span aria-hidden="true">→</span>
              </a>
              <a href="#event05" className="btn-outline-lg">포함 내용 보기</a>
            </div>

            <div className="hero-prism" aria-hidden="true">
              <svg className="prism-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="evtpetPrismGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#C4A8F5" />
                    <stop offset="50%" stopColor="#9BB8F8" />
                    <stop offset="100%" stopColor="#F5C4E8" />
                  </linearGradient>
                  <linearGradient id="evtpetPrismGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFD4A8" />
                    <stop offset="100%" stopColor="#C4A8F5" />
                  </linearGradient>
                  <linearGradient id="evtpetPrismGrad3" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#9BB8F8" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#6B4FB8" stopOpacity="0.6" />
                  </linearGradient>
                </defs>
                <polygon points="100,30 160,90 130,160 70,160 40,90" fill="url(#evtpetPrismGrad1)" opacity="0.85" />
                <polygon points="100,30 160,90 100,100" fill="url(#evtpetPrismGrad2)" opacity="0.7" />
                <polygon points="100,100 160,90 130,160" fill="url(#evtpetPrismGrad3)" opacity="0.8" />
                <polygon points="100,100 130,160 70,160" fill="url(#evtpetPrismGrad1)" opacity="0.6" />
                <polygon points="100,100 70,160 40,90" fill="url(#evtpetPrismGrad2)" opacity="0.5" />
                <polygon points="100,30 100,100 40,90" fill="url(#evtpetPrismGrad3)" opacity="0.7" />
                <line x1="100" y1="30" x2="100" y2="100" stroke="#fff" strokeWidth="0.5" opacity="0.4" />
                <line x1="100" y1="100" x2="160" y2="90" stroke="#fff" strokeWidth="0.5" opacity="0.3" />
                <line x1="100" y1="100" x2="40" y2="90" stroke="#fff" strokeWidth="0.5" opacity="0.3" />
              </svg>
            </div>

            <HeroVideoBox />
          </div>
        </section>

        {/* ── 포함 과정 미리보기 (001 / 002 / CORE1) ── */}
        <section className="benefits">
          <div className="section-inner">
            <div className="benefits-header">
              <div className="section-eyebrow">사진작가 전용 특별가</div>
              <h2 className="section-h2">
                50만원 첫완성패키지를<br /><span className="em">10만원</span>에
              </h2>
              <p className="section-sub" style={{ marginTop: 14 }}>
                검색 전략 · 콘텐츠 기획 · 배포 세 과정을 그대로 담았습니다.<br />
                작가님의 촬영 서비스가 "지역 + 반려동물 촬영" 검색에서 먼저 보이도록 만듭니다.
              </p>
            </div>

            <div className="benefits-grid">
              <a href="#event05" className="benefit-card violet">
                <div className="benefit-eyebrow">001 <span className="dot"></span> 1회차</div>
                <h3 className="benefit-title">🎯 검색 전략</h3>
                <p className="benefit-desc">"강아지 스튜디오 촬영 + 지역명"처럼 예약으로 이어지는 검색어를 찾고, 경쟁 스튜디오 대비 노출 구조를 설계합니다.</p>
                <div className="benefit-foot">001 SEO 검색노출전략 점검 · 정가 20만원</div>
              </a>

              <a href="#event05" className="benefit-card mint">
                <div className="benefit-eyebrow">002 <span className="dot"></span> 2회차</div>
                <h3 className="benefit-title">✍️ 콘텐츠 기획</h3>
                <p className="benefit-desc">촬영 상품 구성 · 가격 안내 · 예약 흐름 · 포트폴리오 배치까지, 홈페이지에 담을 내용을 기획합니다.</p>
                <div className="benefit-foot">002 홈페이지·콘텐츠 기획·설계 · 정가 20만원</div>
              </a>

              <a href="#event05" className="benefit-card cream">
                <div className="benefit-eyebrow">CORE1 <span className="dot"></span> 3회차</div>
                <h3 className="benefit-title">🚀 즉시 배포</h3>
                <p className="benefit-desc">실제 웹 주소에 올리고 Search Console · GA4 · 네이버 서치어드바이저 연동까지 당일 완료합니다.</p>
                <div className="benefit-foot">CORE1 즉시 배포 + 기술적 SEO · 정가 10만원</div>
              </a>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
              EVENT 05 — 반려동물 사진작가 특별 (001 + 002 + CORE1)
        ══════════════════════════════════════════════ */}
        <section className="pkg-section" id="event05">
          <div className="pkg-section-inner">
            <div className="event01-tag-row">
              <div className="event01-tag">
                <span className="num">5</span>
                <span>EVENT 05 · 반려동물 사진작가 특별</span>
              </div>
            </div>

            <h2 className="section-h2">
              검색·기획·배포 3회 교육,<br />
              <span className="em">50만원 → 10만원</span>
            </h2>
            <p className="event01-lead">
              첫완성패키지의 본세션 3회(001 · 002 · CORE1)를 그대로 진행합니다.<br />
              사전상담은 카카오톡 문답으로 대신하고, 그만큼 가격을 낮췄습니다.
            </p>

            {/* 가격 박스 */}
            <div className="pkg-price">
              <div className="pkg-price-row">
                <span className="label">001 SEO 검색노출전략 점검<small>업종 분석 · 키워드 전략 · 경쟁 스튜디오 분석</small></span>
                <span className="num">20만원</span>
              </div>
              <div className="pkg-price-row">
                <span className="label">002 홈페이지 및 콘텐츠 기획 · 설계<small>촬영 상품 구성 · 예약 흐름 · 포트폴리오 배치</small></span>
                <span className="num">20만원</span>
              </div>
              <div className="pkg-price-row">
                <span className="label">CORE1 즉시 배포 + 기술적 SEO 셋팅<small>실제 웹 주소에 올리고 검색엔진 연동까지</small></span>
                <span className="num">10만원</span>
              </div>
              <div className="pkg-price-divider"></div>
              <div className="pkg-price-sum">
                <span>합계</span>
                <span className="num">50만원</span>
              </div>
              <div className="pkg-price-final">
                <span className="label">반려동물 사진작가 특별가</span>
                <span className="num">10<span className="unit">만원</span></span>
              </div>
              <div className="pkg-price-saved">40만원 절감 · 80% off · 반려동물 사진작가 · 펫 스튜디오 한정</div>
            </div>

            {/* 001 + 002 + CORE 1 */}
            <div className="free-bundle-core">
              {/* 001 카드 */}
              <div className="core-card">
                <div className="core-card-header">
                  <div className="core-card-icon">
                    <span className="core-card-icon-text">001</span>
                  </div>
                  <div className="core-card-body">
                    <span className="core-card-label">1회차 · Pre-launch</span>
                    <h4 className="core-card-h">SEO 검색노출전략 점검</h4>
                    <div className="core-card-tags">
                      <span className="core-card-tag">#반려동물촬영키워드</span>
                      <span className="core-card-tag">#지역검색</span>
                      <span className="core-card-tag">#경쟁스튜디오분석</span>
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
                    aria-controls="evtpet-expand-001"
                    aria-label={isOpen('001') ? '접기' : '자세히 보기'}
                    onClick={() => toggleCard('001')}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>
                <div className={`core-card-expand${isOpen('001') ? ' open' : ''}`} id="evtpet-expand-001">
                  <div className="core-card-expand-inner">
                    <div>
                      <div className="core-col-section">
                        <p className="core-col-desc">
                          홈페이지를 만들기 전에 "어떤 검색어로, 어떤 보호자에게 보여야 하는가"를 먼저 정리하는 세션입니다. 스튜디오 촬영 · 출장 촬영 · 장례/추모 촬영 등 작가님이 실제로 받고 싶은 촬영 유형을 기준으로 지역 키워드와 검색 의도를 분류합니다.
                        </p>
                        <p className="core-col-desc">
                          인스타그램·네이버 예약만으로는 닿지 않던 "검색해서 찾아오는 보호자"를 홈페이지로 연결하는 구조를 잡습니다.
                        </p>
                      </div>
                      <div className="core-col-section">
                        <span className="core-col-h">이런 분께 추천합니다</span>
                        <ul className="core-col-list bullet">
                          <li>인스타그램 DM·네이버 예약으로만 문의를 받고 계신 작가님</li>
                          <li>"우리 동네 강아지 사진관" 검색에 내 스튜디오가 안 나오는 분</li>
                          <li>경쟁 스튜디오와 다른 촬영 컨셉을 검색 관점에서 정리하고 싶은 분</li>
                        </ul>
                      </div>
                    </div>
                    <div>
                      <div className="core-col-section">
                        <span className="core-col-h">다루는 내용</span>
                        <ul className="core-col-list check">
                          <li>촬영 유형별 타겟 보호자 정의 (스튜디오 · 출장 · 추모 등)</li>
                          <li>경쟁 스튜디오 분석 및 검색 상위 구조 파악</li>
                          <li>메인/서브 키워드 선정 (지역 + 반려동물 촬영 키워드)</li>
                          <li>검색 의도 유형 분류 (정보 탐색 / 예약 의도)</li>
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

              {/* 002 카드 */}
              <div className="core-card">
                <div className="core-card-header">
                  <div className="core-card-icon">
                    <span className="core-card-icon-text">002</span>
                  </div>
                  <div className="core-card-body">
                    <span className="core-card-label">2회차 · Pre-launch</span>
                    <h4 className="core-card-h">홈페이지 및 콘텐츠 기획 · 내용 설계</h4>
                    <div className="core-card-tags">
                      <span className="core-card-tag">#촬영상품구성</span>
                      <span className="core-card-tag">#예약흐름</span>
                      <span className="core-card-tag">#포트폴리오배치</span>
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
                    aria-controls="evtpet-expand-002"
                    aria-label={isOpen('002') ? '접기' : '자세히 보기'}
                    onClick={() => toggleCard('002')}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>
                <div className={`core-card-expand${isOpen('002') ? ' open' : ''}`} id="evtpet-expand-002">
                  <div className="core-card-expand-inner">
                    <div>
                      <div className="core-col-section">
                        <p className="core-col-desc">
                          촬영 상품과 가격, 예약 방법, 포트폴리오를 홈페이지에 어떤 순서와 문장으로 담을지 설계하는 교육입니다. 보호자가 처음 들어와서 "여기서 찍고 싶다 → 예약 문의"까지 자연스럽게 이어지는 흐름을 함께 만듭니다.
                        </p>
                        <p className="core-col-desc">
                          이 교육을 마치면 AI 도구에 명확한 방향을 넣을 수 있는 상태가 되어, 만들어지는 홈페이지의 완성도가 크게 높아집니다.
                        </p>
                      </div>
                      <div className="core-col-section">
                        <span className="core-col-h">이런 분께 추천합니다</span>
                        <ul className="core-col-list bullet">
                          <li>포트폴리오는 많은데 홈페이지에 어떻게 담아야 할지 막막한 분</li>
                          <li>촬영 상품·가격·예약 안내가 흩어져 있어 문의 응대에 시간이 많이 드는 분</li>
                          <li>기획 없이 만들었다가 처음부터 다시 고친 경험이 있는 분</li>
                        </ul>
                      </div>
                    </div>
                    <div>
                      <div className="core-col-section">
                        <span className="core-col-h">다루는 내용</span>
                        <ul className="core-col-list check">
                          <li>홈페이지 메뉴 구조 설계 (촬영 상품 · 포트폴리오 · 예약 · 안내)</li>
                          <li>촬영 상품 설명 정리 및 핵심 문장 추출</li>
                          <li>스튜디오 소개 문장 · 예약 CTA 문구 작성</li>
                          <li>포트폴리오 배치 · 톤앤매너 설정</li>
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

              {/* CORE 1 카드 */}
              <div className="core-card">
                <div className="core-card-header">
                  <div className="core-card-icon">
                    <span className="core-card-icon-text">CORE1</span>
                  </div>
                  <div className="core-card-body">
                    <span className="core-card-label">3회차 · Deployment</span>
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
                    aria-expanded={isOpen('core')}
                    aria-controls="evtpet-expand-core"
                    aria-label={isOpen('core') ? '접기' : '자세히 보기'}
                    onClick={() => toggleCard('core')}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>
                <div className={`core-card-expand${isOpen('core') ? ' open' : ''}`} id="evtpet-expand-core">
                  <div className="core-card-expand-inner">
                    <div>
                      <div className="core-col-section">
                        <p className="core-col-desc">
                          AI로 만든 홈페이지를 실제 웹 주소에 올리는 것에서 끝나지 않습니다. 배포 직후 검색엔진이 내 스튜디오 사이트를 제대로 인식하고 데이터를 쌓을 수 있도록, Google Search Console · GA4 · 네이버 서치어드바이저 연동까지 원클릭 셋팅으로 한 번에 완성합니다.
                        </p>
                        <p className="core-col-desc">
                          ZIP 업로드부터 서브도메인 배포, 기술적 SEO 설정, 측정 코드 삽입까지 — 교육 당일 실제로 공개 가능한 URL 과 데이터 수집 환경이 동시에 만들어집니다.
                        </p>
                      </div>
                      <div className="core-col-section">
                        <span className="core-col-h">이런 분께 추천합니다</span>
                        <ul className="core-col-list bullet">
                          <li>AI 도구로 홈페이지를 만들었지만 올리는 방법을 모르는 분</li>
                          <li>배포는 됐는데 Search Console · GA4 가 연결이 안 된 분</li>
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
                <a href="#apply" className="event01-btn">
                  <span>희망 교육 시간 등록하기</span>
                  <span className="event01-btn-arrow">→</span>
                </a>
                <a href="/events2026/first" className="event01-btn secondary">
                  <span>일반 첫완성패키지 보기</span>
                </a>
              </div>
              <p className="event01-cta-note">정가 50만원 → 10만원 · 본세션 3회 · 회차별 희망 시간 등록 후 카카오톡으로 확정</p>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
              대상: 이런 사진작가님께
        ══════════════════════════════════════════════ */}
        <section className="common-targets">
          <div className="common-targets-inner">
            <div className="section-eyebrow">FOR PET PHOTOGRAPHERS</div>
            <h2 className="section-h2">
              이런 사진작가님께<br /><span className="em">딱 맞는 이벤트</span>입니다
            </h2>
            <p className="event01-lead" style={{ marginBottom: 56 }}>
              반려동물 촬영을 하고 계시다면, 아래 다섯 가지 중<br />
              두 가지 이상 해당될 때 망설이지 말고 등록해주세요.
            </p>

            <div className="event01-targets">
              <div className="event01-target">
                <div className="event01-target-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></svg>
                </div>
                <p className="event01-target-text">인스타그램 · 네이버 예약만으로 운영 중이라, 검색에서는 내 스튜디오가 보이지 않는 분</p>
              </div>
              <div className="event01-target">
                <div className="event01-target-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></svg>
                </div>
                <p className="event01-target-text">스튜디오 · 출장 · 추모 촬영 등 "지역 + 반려동물 촬영" 검색으로 예약을 받고 싶은 분</p>
              </div>
              <div className="event01-target">
                <div className="event01-target-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></svg>
                </div>
                <p className="event01-target-text">포트폴리오는 많은데, 홈페이지에 어떻게 담아야 할지 막막한 분</p>
              </div>
              <div className="event01-target">
                <div className="event01-target-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></svg>
                </div>
                <p className="event01-target-text">촬영 상품 · 가격 · 예약 안내를 한 페이지에 정리해 문의 응대 시간을 줄이고 싶은 분</p>
              </div>
              <div className="event01-target" style={{ gridColumn: '1 / -1' }}>
                <div className="event01-target-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></svg>
                </div>
                <p className="event01-target-text">광고비 대신, 보호자가 직접 검색해서 찾아오는 예약 구조를 만들고 싶으신 분</p>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
              희망 교육 시간 등록 (ScheduleRequestWidget)
        ══════════════════════════════════════════════ */}
        <section className="launch-cta" id="apply">
          <div className="launch-cta-inner">
            <div className="launch-cta-eyebrow">
              <span className="star" aria-hidden="true">★</span>
              <span className="pulse" aria-hidden="true"></span>
              <span>APPLY · NO SIGN-UP · 10만원</span>
            </div>

            <h2 className="launch-cta-h">
              희망 교육 시간을<br />
              <span className="accent">지금 등록</span>해 주세요
            </h2>
            <p className="launch-cta-sub">
              1 · 2 · 3회차 각각 원하는 날짜와 시간을 고르시면 됩니다.<br />
              확인 후 <strong>입력하신 번호의 카카오톡</strong>으로 일정 확정과 입금 안내를 드립니다.
            </p>

            <div className="apply-time-badges" aria-label="신청 가능 시간">
              <span className="apply-time-badge"><strong>오전 8시 ~ 오후 11시</strong> 신청 가능</span>
              <span className="apply-time-badge"><strong>1시간</strong> 단위</span>
              <span className="apply-time-badge">평일 저녁 · 주말 <strong>OK</strong></span>
            </div>

            <div className="apply-widget-wrap">
              <ScheduleRequestWidget
                eventCode={SIGNUP_CODE}
                source="pet-photo-apply"
                sessions={['1회차', '2회차', '3회차']}
                startHour={8}
                endHour={23}
                dark
                title="반려동물 사진작가 특별 이벤트 · 희망 교육 시간"
                description="회원가입 없이 바로 등록됩니다. 1회차(검색 전략) · 2회차(콘텐츠 기획) · 3회차(즉시 배포) 순서로 진행되니, 회차 사이에 며칠 여유를 두고 골라주세요."
                notePlaceholder="예: 주말 촬영이 많아 평일 저녁이 편해요 / 출장 촬영 위주로 운영 중이에요"
                privacyPurpose="반려동물 사진작가 특별 이벤트 교육 일정 협의 및 안내 연락"
              />
            </div>

            <p className="launch-cta-note" style={{ marginTop: 32 }}>
              등록 후 1영업일 내 카카오톡으로 연락드립니다 · 희망 시간이 겹치면 가까운 시간으로 조율해 드립니다
            </p>
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
                  q: '반려동물 사진작가만 신청할 수 있나요?',
                  a: (
                    <>
                      네, 이 특별가는 <strong>반려동물 촬영을 하는 개인 작가 · 펫 스튜디오 · 출장 촬영 팀</strong>을 위한 이벤트입니다. 아직 스튜디오를 준비 중이더라도 반려동물 촬영 포트폴리오가 있으면 신청 가능합니다. 다른 업종이시라면 <a href="/events2026/first">첫완성패키지</a>를 확인해주세요.
                    </>
                  ),
                },
                {
                  id: 'faq-2',
                  q: '첫완성패키지(35만원)와 무엇이 다른가요?',
                  a: (
                    <>
                      교육 내용은 같습니다. <strong>001 검색 전략 + 002 콘텐츠 기획 + CORE 1 즉시 배포</strong> 본세션 3회를 그대로 진행합니다. 첫완성패키지에 포함된 사전상담 1시간은 카카오톡 사전 문답으로 대체하고, 반려동물 사진작가 한정으로 정가 50만원 → 10만원에 진행합니다.
                    </>
                  ),
                },
                {
                  id: 'faq-3',
                  q: '교육 시간은 어떻게 정해지나요?',
                  a: (
                    <>
                      위의 등록 위젯에서 1 · 2 · 3회차 희망 날짜와 시간을 고르시면 됩니다. <strong>오전 8시 ~ 오후 11시 사이 1시간 단위</strong>로 신청 가능하며, 확인 후 카카오톡으로 최종 일정을 확정해 드립니다. 촬영 일정이 바뀌면 카카오톡으로 조율할 수 있습니다.
                    </>
                  ),
                },
                {
                  id: 'faq-4',
                  q: '회원가입이나 결제를 먼저 해야 하나요?',
                  a: (
                    <>
                      아니요. 회원가입 없이 이름 · 연락처 · 희망 시간만 등록하시면 됩니다. 카카오톡으로 일정을 확정한 뒤 입금 안내(10만원)를 드리며, 입금 확인 후 1회차가 진행됩니다.
                    </>
                  ),
                },
                {
                  id: 'faq-5',
                  q: '홈페이지가 이미 있어도 되나요?',
                  a: (
                    <>
                      네. 기존 홈페이지나 인스타그램 · 네이버 예약 페이지를 기준으로 검색 구조를 다시 설계하고, AI 로 새 홈페이지를 만들어 배포합니다. 교육 당일 배포된 사이트는 yourname.aiseo.tips 형태의 서브도메인으로 즉시 운영 가능하며, 12개월 동안 호스팅 · 도메인 · SSL 이 무료입니다.
                    </>
                  ),
                },
                {
                  id: 'faq-6',
                  q: '미리 준비해야 할 자료가 있나요?',
                  a: (
                    <>
                      대표 포트폴리오 10~20장, 촬영 상품과 가격(메모 수준이면 충분), 스튜디오 위치 또는 출장 가능 지역 정도면 됩니다. 어떤 자료가 필요한지는 카카오톡으로 함께 정리해 드립니다.
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
              EVENT 04 vs EVENT 05 비교
        ══════════════════════════════════════════════ */}
        <section className="compare-section">
          <div className="compare-inner">
            <div className="section-eyebrow">WHY THIS EVENT</div>
            <h2 className="section-h2">
              같은 3회 교육,<br /><span className="em">사진작가 한정가</span>
            </h2>
            <p className="event01-lead">
              EVENT 04 첫완성패키지와 같은 001 · 002 · CORE1 본세션을<br />
              반려동물 사진작가님께는 10만원에 드립니다.
            </p>

            <div className="compare-grid">
              <article className="compare-card">
                <div className="compare-card-icon" aria-hidden="true">🧩</div>
                <div className="compare-card-pkg">EVENT 04 · 첫완성패키지</div>
                <h3 className="compare-card-h">누구나 신청하는<br />정식 풀패키지</h3>
                <p className="compare-card-sub">
                  업종 제한 없이 신청 가능한 풀패키지. 사전상담 1시간으로 디자인 방향을 먼저 확정한 뒤 검색 · 기획 · 배포 전 과정을 완성합니다.
                </p>
                <ul className="compare-card-list">
                  <li>001 + 002 + CORE 1 + 사전상담 1시간</li>
                  <li>정가 50만원 → 35만원 (30% off)</li>
                  <li>사전상담 1 + 본세션 3 = 총 4회</li>
                  <li>업종 제한 없음</li>
                </ul>
                <a href="/events2026/first" className="compare-cta">
                  <span>EVENT 04 보러가기</span>
                  <span aria-hidden="true">→</span>
                </a>
              </article>

              <article className="compare-card">
                <div className="compare-card-icon" aria-hidden="true">🐾</div>
                <div className="compare-card-pkg">EVENT 05 · 반려동물 사진작가 특별</div>
                <h3 className="compare-card-h">반려동물 사진작가님께<br />10만원에</h3>
                <p className="compare-card-sub">
                  같은 본세션 3회를 반려동물 사진작가 · 펫 스튜디오 한정 특별가로. 사전상담은 카카오톡 문답으로 대신하고, 희망 시간 등록만으로 바로 시작합니다.
                </p>
                <ul className="compare-card-list">
                  <li>001 + 002 + CORE 1 본세션 3회</li>
                  <li>정가 50만원 → 10만원 (80% off)</li>
                  <li>사전상담은 카카오톡 문답으로 대체</li>
                  <li>희망 시간 등록 → 카카오톡으로 확정</li>
                </ul>
                <a href="#apply" className="compare-cta">
                  <span>희망 시간 등록하기</span>
                  <span aria-hidden="true">↑</span>
                </a>
              </article>
            </div>
          </div>
        </section>

        {/* ── CROSS-LINK 배너 (첫완성패키지로) ── */}
        <section className="cross-link">
          <div className="cross-link-inner">
            <div className="cross-link-eyebrow">Not a pet photographer?</div>
            <h2 className="cross-link-h">
              사진작가가 아니신가요? <span className="em">첫완성패키지</span>도 열려 있습니다
            </h2>
            <p className="cross-link-sub">
              업종 제한 없이 신청 가능한 정식 풀패키지 — 사전상담 1시간을 더해<br />
              정가 50만원 → 35만원으로 검색 · 기획 · 배포 전 과정을 완성합니다.
            </p>

            <a href="/events2026/first" className="cross-card">
              <div className="cross-card-badge">
                <span className="cross-card-badge-num">04</span>
                <span className="cross-card-badge-tag">FULL</span>
              </div>
              <div className="cross-card-body">
                <div className="cross-card-pkg">EVENT 04 · 첫완성패키지</div>
                <div className="cross-card-h">검색 · 기획 · 배포 전 과정 + 사전상담 1시간</div>
                <div className="cross-card-desc">001 + 002 + CORE1 + 사전상담 · 정가 50만원 → 35만원</div>
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
    </>
  );
}
