import { useEffect, useState, type ReactNode } from 'react';
import '../landing.css';
import { useSubPageNav } from './useSubPageNav';
import { HeroVideoBox } from '../../components/HeroVideoBox';
import { SiteFooter } from '../../components/SiteFooter';
import { ScheduleRequestWidget } from '../../components/ScheduleRequestWidget';
import type { EventCode } from '../../api';

/**
 * 업종별 특별 이벤트 공용 템플릿 — `/events2026/snap`, `/events2026/pet`
 *
 * 첫완성패키지(`/events2026/first`, EVENT 04)의 본세션 3회(001 검색
 * 전략 + 002 콘텐츠 기획 + CORE1 즉시 배포)를 특정 업종 한정으로 정가
 * 50만원 → 10만원에 제공하는 랜딩의 공용 골격이다. 페이지마다 다른
 * 건 카피뿐이라, 구조·CSS 는 여기 한 곳에 두고 페이지별 콘텐츠는
 * `SpecialEventContent` 객체(`events2026SpecialContent.ts`)로 주입한다.
 *
 * 신청은 모달 대신 페이지 안에 심은 `ScheduleRequestWidget` 으로 받는다
 * — 회원가입 없이 이름 + 연락처 + 1·2·3회차 희망 일시(08~23시, 1시간
 * 단위) + 개인정보 동의만 입력하면 기존 `/event-signup` Lambda 로
 * 저장되고 Slack 알림이 간다. 이후 입력된 번호의 카카오톡으로 연락.
 *
 * 구조와 CSS 는 Events2026FirstPage 를 복제해 `.evtspecial` 로 스코프를
 * 바꾼 것 — HERO, 포함 과정 미리보기, 패키지 상세(가격 박스 +
 * 001/002/CORE1 core-card), 대상, 희망 시간 등록(launch-cta 스타일),
 * FAQ, EVENT 04 비교, 크로스링크(자매 이벤트 + 첫완성패키지).
 */

export interface SpecialCoreCard {
  id: string;
  iconText: string;
  label: string;
  title: string;
  tags: string[];
  priceStrike: string;
  desc: [ReactNode, ReactNode];
  recommended: string[];
  contentsHeading: string;
  contents: string[];
  chips: { icon: string; text: string }[];
  /** 카드 앞에 붙는 `core-notice` 배너 (CORE 1 소개 등). */
  notice?: { title: string; sub: string };
}

export interface SpecialEventContent {
  path: string;
  eventCode: EventCode;
  source: string;
  /** DOM id 프리픽스 (aria-controls 등 충돌 방지). */
  slug: string;
  docTitle: string;
  metaDescription: string;
  hero: {
    badge: string;
    lines: [ReactNode, ReactNode, ReactNode];
    sub: ReactNode;
  };
  benefits: {
    eyebrow: string;
    h2: ReactNode;
    sub: ReactNode;
    cards: [string, string, string];
  };
  pkg: {
    tagNum: string;
    tagLabel: string;
    h2: ReactNode;
    lead: ReactNode;
    rowNotes: [string, string, string];
    finalLabel: string;
    savedNote: string;
    ctaNote: string;
  };
  coreCards: SpecialCoreCard[];
  targets: {
    eyebrow: string;
    h2: ReactNode;
    lead: ReactNode;
    /** 5개 권장 — 마지막 항목은 전체 너비로 렌더된다. */
    items: string[];
  };
  apply: {
    eyebrow: string;
    widgetTitle: string;
    widgetDescription: string;
    notePlaceholder: string;
    privacyPurpose: string;
  };
  faq: { id: string; q: string; a: ReactNode }[];
  compare: {
    eyebrow: string;
    h2: ReactNode;
    lead: ReactNode;
    card: { icon: string; pkg: string; h: ReactNode; sub: string; list: string[] };
  };
  crossLink: {
    eyebrow: string;
    h2: ReactNode;
    sub: ReactNode;
    sibling: { href: string; badgeNum: string; badgeTag: string; pkg: string; h: string; desc: string };
  };
}

const NAV_ITEMS = [
  { href: '/events2026/free', label: '무료이벤트' },
  { href: '/events2026/paid', label: '할인이벤트' },
  { href: '/events2026/first', label: '첫완성패키지' },
  { href: '/events2026/snap', label: '사진스냅 이벤트' },
  { href: '/events2026/pet', label: '반려동물 서비스 이벤트' },
];

export function Events2026SpecialPage({ content }: { content: SpecialEventContent }) {
  useSubPageNav();

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
        '.evtspecial .benefit-card, .evtspecial .event01-target, .evtspecial .compare-card',
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

  const { hero, benefits, pkg, coreCards, targets, apply, faq, compare, crossLink } = content;

  // CSR-only app, so `window` is always defined at render time.
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const canonicalUrl = `${origin}${content.path}`;
  const ogImage = `${origin}/events/hero-pc.jpg`;
  const prismId = `evtspecial-${content.slug}`;

  return (
    <>
      {/* React 19 native head metadata. */}
      <title>{content.docTitle}</title>
      <meta name="description" content={content.metaDescription} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="AISEO" />
      <meta property="og:title" content={content.docTitle} />
      <meta property="og:description" content={content.metaDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={content.docTitle} />
      <meta name="twitter:description" content={content.metaDescription} />
      <meta name="twitter:image" content={ogImage} />

      {/*
        Scoped CSS — Events2026FirstPage 의 `.evtfirst` 블록을 `.evtspecial`
        로 바꿔 그대로 가져왔고, 맨 아래 "SPECIAL ADDITIONS" 에 이
        템플릿 전용 규칙(hero 가격 스트립·CTA 줄, 위젯 래퍼, 크로스카드
        2장)만 추가했다.
      */}
      <style>{`
        /* Local design-token additions used by the paid port. */
        .evtspecial {
          --accent-deep: #6B4FB8;
          --bg-dark: #0A0614;
          --bg-dark-2: #14102A;
        }

        /* ── HERO (다크 배경, 별, 프리즘) ── */
        .evtspecial .hero {
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
        .evtspecial .hero-stars {
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
          animation: evtspecialTwinkle 8s ease-in-out infinite;
        }
        @keyframes evtspecialTwinkle {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        .evtspecial .hero-glow {
          position: absolute; left: 50%; top: 50%;
          width: 800px; height: 800px;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle, rgba(196,168,245,0.18) 0%, rgba(196,168,245,0.05) 35%, transparent 70%);
          z-index: 0;
          pointer-events: none;
        }
        .evtspecial .hero-content {
          position: relative; z-index: 2; max-width: 860px;
          width: 100%;
        }
        .evtspecial .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.08); color: #fff;
          font-size: 12px; font-weight: 600; padding: 7px 16px;
          border-radius: 100px;
          border: 1px solid rgba(255,255,255,0.18);
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
          margin-bottom: 28px;
          letter-spacing: .4px;
          opacity: 0; transform: translateY(16px);
          animation: evtspecialFadeUp .6s ease forwards .1s;
        }
        .evtspecial .hero-badge-dot {
          width: 6px; height: 6px;
          background: var(--accent); border-radius: 50%;
          animation: evtspecialPulse 2s infinite;
        }
        @keyframes evtspecialPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .5; transform: scale(0.7); }
        }
        .evtspecial .hero-h1 {
          font-family: var(--font-ko);
          font-size: clamp(40px, 6vw, 72px);
          font-weight: 700;
          line-height: 1.18;
          letter-spacing: -2.5px;
          color: #fff;
          margin-bottom: 28px;
        }
        .evtspecial .hero-h1 .accent-text { color: var(--accent); }
        .evtspecial .hero-h1 .line {
          display: block;
          opacity: 0; transform: translateY(20px);
          animation: evtspecialFadeUp .7s ease forwards;
        }
        .evtspecial .hero-h1 .line:nth-child(1) { animation-delay: .2s; }
        .evtspecial .hero-h1 .line:nth-child(2) { animation-delay: .35s; }
        .evtspecial .hero-h1 .line:nth-child(3) { animation-delay: .5s; }
        .evtspecial .hero-sub {
          font-family: var(--font-ko);
          font-size: 16px; line-height: 1.85;
          color: rgba(255,255,255,0.7);
          max-width: 540px; margin: 0 auto;
          opacity: 0; animation: evtspecialFadeUp .6s ease forwards .7s;
        }

        .evtspecial .hero-prism {
          margin: 56px auto 0;
          width: 220px; height: 220px;
          position: relative;
          opacity: 0; animation: evtspecialFadeUp .8s ease forwards .9s;
        }
        .evtspecial .hero-prism::before {
          content: '';
          position: absolute; inset: -40px;
          background: radial-gradient(circle, rgba(196,168,245,0.35) 0%, transparent 60%);
          filter: blur(20px);
          z-index: 0;
        }
        .evtspecial .prism-svg {
          width: 100%; height: 100%;
          position: relative; z-index: 1;
          animation: evtspecialPrismFloat 8s ease-in-out infinite;
        }
        @keyframes evtspecialPrismFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(2deg); }
        }

        /* video stub card */
        .evtspecial .hero-video {
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
          opacity: 0; animation: evtspecialFadeUp .8s ease forwards 1.1s;
          z-index: 2;
        }
        .evtspecial .hero-video::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(circle at center, rgba(196,168,245,0.1) 0%, transparent 60%);
          pointer-events: none;
        }
        .evtspecial .hero-video-play {
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
        .evtspecial .hero-video-play:hover {
          transform: translate(-50%, -50%) scale(1.08);
          box-shadow: 0 14px 40px rgba(196,168,245,0.4);
        }
        .evtspecial .hero-video-play svg { width: 22px; height: 22px; margin-left: 3px; }
        .evtspecial .hero-video-label {
          position: absolute; bottom: 24px; left: 50%;
          transform: translateX(-50%);
          font-family: var(--font-en);
          font-size: 11px; font-weight: 600;
          color: rgba(255,255,255,0.55);
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        @keyframes evtspecialFadeUp { to { opacity: 1; transform: translateY(0); } }

        /* ── SECTION COMMON (override landing.css's section-* defaults) ── */
        .evtspecial section { padding: 120px 40px; }
        .evtspecial .section-inner { max-width: 1200px; margin: 0 auto; }
        .evtspecial .section-eyebrow {
          font-family: var(--font-en);
          font-size: 12px; font-weight: 600;
          color: var(--accent-dark);
          letter-spacing: 1.5px; text-transform: uppercase;
          margin-bottom: 16px;
          text-align: center;
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .evtspecial .section-eyebrow::before,
        .evtspecial .section-eyebrow::after {
          content: ''; width: 24px; height: 1px;
          background: var(--accent);
          opacity: 0.5;
        }
        .evtspecial .section-h2 {
          font-family: var(--font-ko);
          font-size: clamp(28px, 3.6vw, 42px);
          font-weight: 700; line-height: 1.3;
          letter-spacing: -1.2px;
          color: var(--text-primary);
          text-align: center;
          margin: 0 auto 18px;
          max-width: none;
        }
        .evtspecial .section-h2 .em { color: var(--accent-dark); }
        .evtspecial .section-sub {
          font-family: var(--font-ko);
          font-size: 16px; color: var(--text-secondary);
          line-height: 1.75; text-align: center;
          max-width: 620px; margin: 0 auto;
        }

        /* ── 두 패키지 미리보기 (Benefits) ── */
        .evtspecial .benefits {
          background: var(--bg);
          padding-top: 120px;
          padding-bottom: 60px;
        }
        .evtspecial .benefits-header { margin-bottom: 56px; }
        .evtspecial .benefits-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
          max-width: 1040px;
          margin: 0 auto;
        }
        .evtspecial .benefit-card {
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
        .evtspecial .benefit-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
          border-color: rgba(196,168,245,0.3);
        }
        .evtspecial .benefit-card.violet { background: linear-gradient(180deg, #F5EFFF 0%, #FAF6FF 100%); border-color: rgba(196,168,245,0.25); }
        .evtspecial .benefit-card.mint   { background: linear-gradient(180deg, #E8F7F0 0%, #F1FAF6 100%); border-color: rgba(127,200,166,0.25); }
        .evtspecial .benefit-card.cream  { background: linear-gradient(180deg, #FFF4E8 0%, #FFF9F1 100%); border-color: rgba(255,196,122,0.28); }
        .evtspecial .benefit-eyebrow {
          font-family: var(--font-en);
          font-size: 10px; font-weight: 700;
          letter-spacing: 1.5px;
          color: var(--text-muted);
          margin-bottom: 18px;
        }
        .evtspecial .benefit-eyebrow .dot {
          display: inline-block; width: 4px; height: 4px;
          border-radius: 50%; background: var(--text-muted);
          margin: 0 8px; vertical-align: middle;
        }
        .evtspecial .benefit-title {
          font-family: var(--font-ko);
          font-size: 20px; font-weight: 700;
          letter-spacing: -.6px;
          margin-bottom: 12px;
          line-height: 1.4;
          color: var(--text-primary);
        }
        .evtspecial .benefit-desc {
          font-size: 13.5px;
          color: var(--text-secondary);
          line-height: 1.7;
          flex: 1;
        }
        .evtspecial .benefit-foot {
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px dashed rgba(0,0,0,0.08);
          font-size: 12px;
          color: var(--text-muted);
          display: flex; align-items: center; gap: 6px;
        }
        .evtspecial .benefit-foot::before {
          content: '→';
          color: var(--accent-dark);
          font-weight: 700;
        }

        /* ── PKG SECTION (EVENT 02 / 03) ── */
        .evtspecial .pkg-section {
          background: var(--bg-soft);
          padding: 100px 40px;
          position: relative;
          overflow: hidden;
        }
        .evtspecial .pkg-section.alt { background: var(--bg); }
        .evtspecial .pkg-section::before {
          content: '';
          position: absolute;
          top: -160px; left: 50%;
          transform: translateX(-50%);
          width: 700px; height: 380px;
          background: radial-gradient(ellipse, rgba(196,168,245,0.10) 0%, transparent 70%);
          pointer-events: none;
        }
        .evtspecial .pkg-section-inner {
          position: relative; z-index: 1;
          max-width: 1240px;
          margin: 0 auto;
        }

        /* tag pill 헤더 */
        .evtspecial .event01-tag-row { text-align: center; }
        .evtspecial .event01-tag {
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
        .evtspecial .event01-tag .num {
          width: 22px; height: 22px;
          background: var(--accent);
          color: #fff;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px;
          font-weight: 800;
        }

        .evtspecial .pkg-section .section-h2 { margin-bottom: 16px; }
        .evtspecial .event01-lead {
          font-family: var(--font-ko);
          text-align: center;
          font-size: 16px;
          color: var(--text-secondary);
          line-height: 1.8;
          max-width: 580px;
          margin: 0 auto 56px;
        }

        /* 가격 박스 */
        .evtspecial .pkg-price {
          max-width: 520px;
          margin: 0 auto 56px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 32px 36px;
          box-shadow: var(--shadow-sm);
        }
        .evtspecial .pkg-price-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 0;
          font-size: 16px;
          color: var(--text-secondary);
          gap: 20px;
        }
        .evtspecial .pkg-price-row .label {
          color: var(--text-primary);
          font-weight: 600;
          font-size: 16px;
          letter-spacing: -.2px;
        }
        .evtspecial .pkg-price-row .label small {
          display: block;
          font-size: 13px;
          color: var(--text-muted);
          margin-top: 4px;
          font-weight: 400;
          letter-spacing: .1px;
        }
        .evtspecial .pkg-price-row .num {
          font-family: var(--font-en);
          font-weight: 700;
          color: var(--text-primary);
          font-size: 17px;
          flex-shrink: 0;
        }
        .evtspecial .pkg-price-divider {
          border-top: 1px dashed var(--border);
          margin: 14px 0 10px;
        }
        .evtspecial .pkg-price-sum {
          display: flex; align-items: center; justify-content: space-between;
          padding: 6px 0 18px;
          font-size: 15px;
          color: var(--text-muted);
        }
        .evtspecial .pkg-price-sum .num {
          font-family: var(--font-en);
          font-weight: 600;
          color: var(--text-secondary);
          font-size: 16px;
        }
        .evtspecial .pkg-price-final {
          background: linear-gradient(135deg, var(--accent-deep) 0%, var(--accent-dark) 100%);
          color: #fff;
          border-radius: var(--radius-md);
          padding: 22px 26px;
          display: flex; align-items: center; justify-content: space-between;
          margin-top: 8px;
          box-shadow: 0 6px 18px rgba(107, 79, 184, 0.25);
        }
        .evtspecial .pkg-price-final .label {
          font-size: 14.5px;
          font-weight: 600;
          color: rgba(255,255,255,0.9);
          letter-spacing: .3px;
        }
        .evtspecial .pkg-price-final .num {
          font-family: var(--font-en);
          font-size: 38px;
          font-weight: 800;
          letter-spacing: -1.8px;
          line-height: 1;
        }
        .evtspecial .pkg-price-final .num .unit {
          font-size: 18px;
          font-weight: 600;
          color: var(--accent);
          margin-left: 3px;
        }
        .evtspecial .pkg-price-saved {
          text-align: center;
          margin-top: 16px;
          font-size: 14px;
          color: var(--accent-deep);
          font-weight: 700;
          letter-spacing: .2px;
        }
        .evtspecial .pkg-price-saved::before {
          content: '★ ';
          color: #E8A60E;
        }

        /* free-bundle-core wrapper (재사용: 사전 카드 + CORE notice + CORE 1 카드 묶음) */
        .evtspecial .free-bundle-core {
          margin: 0 auto 56px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* CORE NOTICE 박스 */
        .evtspecial .core-notice {
          display: flex; align-items: flex-start; gap: 14px;
          background: linear-gradient(135deg, rgba(196,168,245,0.16) 0%, rgba(155,184,248,0.12) 100%);
          border: 1px solid rgba(196,168,245,0.32);
          border-radius: var(--radius-lg);
          padding: 18px 24px;
        }
        .evtspecial .core-notice-star {
          flex-shrink: 0;
          width: 28px; height: 28px;
          background: #FFE99A;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 6px rgba(255, 200, 80, 0.35);
          margin-top: 2px;
        }
        .evtspecial .core-notice-star::before {
          content: '★';
          color: #E8A60E;
          font-size: 14px;
          line-height: 1;
        }
        .evtspecial .core-notice-body { text-align: left; flex: 1; }
        .evtspecial .core-notice-title {
          font-size: 15px; font-weight: 700;
          color: var(--accent-deep);
          letter-spacing: -.2px;
          margin-bottom: 4px;
          line-height: 1.4;
        }
        .evtspecial .core-notice-sub {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.55;
          font-weight: 400;
        }

        /* CORE CARD (확장형) */
        .evtspecial .core-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          text-align: left;
          transition: border-color .2s, box-shadow .2s;
          overflow: hidden;
        }
        .evtspecial .core-card:hover {
          border-color: rgba(196,168,245,0.4);
          box-shadow: var(--shadow-md);
        }
        .evtspecial .core-card-header {
          display: grid;
          grid-template-columns: auto 1fr auto auto;
          gap: 22px;
          align-items: center;
          padding: 22px 26px;
        }
        .evtspecial .core-card-icon {
          width: 56px; height: 56px;
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent-deep) 100%);
          border-radius: var(--radius-md);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 14px rgba(139,111,212,0.3);
          flex-shrink: 0;
        }
        .evtspecial .core-card-icon-text {
          font-family: var(--font-en);
          font-size: 12px;
          font-weight: 800;
          color: #fff;
          letter-spacing: .5px;
        }
        .evtspecial .core-card-body { min-width: 0; }
        .evtspecial .core-card-label {
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
        .evtspecial .core-card-h {
          font-family: var(--font-ko);
          font-size: clamp(16px, 1.5vw, 18px);
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -.3px;
          margin-bottom: 10px;
          line-height: 1.4;
        }
        .evtspecial .core-card-tags {
          display: flex; flex-wrap: wrap; gap: 6px;
        }
        .evtspecial .core-card-tag {
          font-size: 12.5px;
          color: var(--text-muted);
          background: var(--bg-soft);
          border: 1px solid var(--border-soft);
          padding: 4px 10px;
          border-radius: 100px;
          font-weight: 500;
        }
        .evtspecial .core-card-price {
          text-align: right;
          flex-shrink: 0;
          display: flex; align-items: center; gap: 6px;
        }
        .evtspecial .core-card-price-strike {
          font-size: 13px;
          color: var(--text-muted);
          text-decoration: line-through;
          text-decoration-color: rgba(155,155,155,0.7);
          font-weight: 500;
        }
        .evtspecial .core-card-price-arrow {
          color: var(--accent-dark);
          font-weight: 700;
          margin: 0 2px;
        }
        .evtspecial .core-card-price-free {
          font-size: 17px;
          font-weight: 800;
          color: var(--accent-deep);
          letter-spacing: -.4px;
        }
        .evtspecial .core-card-toggle {
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
        .evtspecial .core-card-toggle:hover {
          background: var(--accent-light);
          border-color: rgba(196,168,245,0.4);
        }
        .evtspecial .core-card-toggle svg {
          width: 16px; height: 16px;
          transition: transform .35s cubic-bezier(0.65, 0.05, 0.35, 1);
        }
        .evtspecial .core-card-toggle[aria-expanded="true"] svg {
          transform: rotate(180deg);
        }
        .evtspecial .core-card-expand {
          overflow: hidden;
          max-height: 0;
          transition: max-height .5s cubic-bezier(0.65, 0.05, 0.35, 1);
        }
        .evtspecial .core-card-expand.open { max-height: 1500px; }
        .evtspecial .core-card-expand-inner {
          border-top: 1px solid var(--border-soft);
          padding: 32px 30px 32px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 36px;
        }
        .evtspecial .core-col-section + .core-col-section { margin-top: 26px; }
        .evtspecial .core-col-h {
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
        .evtspecial .core-col-section.muted .core-col-h {
          background: var(--text-primary);
        }
        .evtspecial .core-col-desc {
          font-size: 14.5px;
          color: var(--text-secondary);
          line-height: 1.75;
        }
        .evtspecial .core-col-desc + .core-col-desc { margin-top: 14px; }
        .evtspecial .core-col-list {
          list-style: none;
          display: flex; flex-direction: column;
          gap: 9px;
          padding: 0; margin: 0;
        }
        .evtspecial .core-col-list.bullet li {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.6;
          padding-left: 16px;
          position: relative;
        }
        .evtspecial .core-col-list.bullet li::before {
          content: '';
          position: absolute;
          left: 0; top: 9px;
          width: 5px; height: 5px;
          background: var(--accent);
          border-radius: 50%;
        }
        .evtspecial .core-col-list.check li {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.6;
          padding-left: 22px;
          position: relative;
        }
        .evtspecial .core-col-list.check li::before {
          content: '✓';
          position: absolute;
          left: 0; top: 0;
          color: var(--accent-dark);
          font-weight: 700;
          font-size: 13px;
        }
        .evtspecial .core-col-chips {
          display: flex; flex-wrap: wrap; gap: 8px;
          margin-top: 4px;
        }
        .evtspecial .core-col-chip {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--bg-soft);
          border: 1px solid var(--border-soft);
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 500;
          padding: 6px 12px;
          border-radius: 100px;
        }
        .evtspecial .core-col-chip-icon { font-size: 14px; line-height: 1; }

        /* PKG SECTION CTA */
        .evtspecial .event01-cta {
          margin-top: 64px;
          text-align: center;
        }
        .evtspecial .event01-cta-row {
          display: inline-flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .evtspecial .event01-btn {
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
        .evtspecial .event01-btn:hover {
          background: var(--accent-deep);
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(139,111,212,0.35);
        }
        .evtspecial .event01-btn.secondary {
          background: var(--bg-card);
          color: var(--text-primary);
          border-color: var(--border);
          box-shadow: none;
        }
        .evtspecial .event01-btn.secondary:hover {
          border-color: var(--accent);
          background: var(--bg-soft);
          box-shadow: var(--shadow-sm);
        }
        .evtspecial .event01-btn-arrow { transition: transform .2s; display: inline-block; }
        .evtspecial .event01-btn:hover .event01-btn-arrow { transform: translateX(3px); }
        .evtspecial .event01-cta-note {
          margin-top: 18px;
          font-size: 12.5px;
          color: var(--text-muted);
          letter-spacing: .2px;
        }

        /* ── 공통 타겟 ── */
        .evtspecial .common-targets {
          background: var(--bg);
          padding: 100px 40px 80px;
        }
        .evtspecial .common-targets-inner {
          max-width: 1100px;
          margin: 0 auto;
        }
        .evtspecial .event01-targets {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          max-width: 920px;
          margin: 0 auto;
        }
        .evtspecial .event01-target {
          display: flex; align-items: flex-start; gap: 12px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 18px 20px;
          transition: border-color .2s, transform .2s;
        }
        .evtspecial .event01-target:hover {
          border-color: rgba(196,168,245,0.35);
          transform: translateY(-2px);
        }
        .evtspecial .event01-target-icon {
          width: 28px; height: 28px;
          border-radius: 50%;
          background: var(--accent-light);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .evtspecial .event01-target-icon svg {
          width: 14px; height: 14px;
          stroke: var(--accent-dark);
          stroke-width: 2.5;
          fill: none;
        }
        .evtspecial .event01-target-text {
          font-family: var(--font-ko);
          font-size: 16.5px;
          color: var(--text-primary);
          line-height: 1.6;
          font-weight: 500;
          margin: 0;
        }

        /* ── FAQ ── */
        .evtspecial .faq-section {
          background: var(--bg-soft);
          padding: 100px 40px;
        }
        .evtspecial .faq-inner {
          max-width: 800px;
          margin: 0 auto;
        }
        .evtspecial .faq-list { margin-top: 48px; }
        .evtspecial .faq-item {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          margin-bottom: 10px;
          transition: border-color .2s, box-shadow .2s;
          overflow: hidden;
        }
        .evtspecial .faq-item:hover {
          border-color: rgba(196,168,245,0.35);
        }
        .evtspecial .faq-q {
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
        .evtspecial .faq-q-text {
          font-family: var(--font-ko);
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary);
          letter-spacing: -.3px;
          line-height: 1.5;
          flex: 1;
        }
        .evtspecial .faq-q-icon {
          flex-shrink: 0;
          width: 32px; height: 32px;
          border-radius: 50%;
          background: var(--accent-light);
          display: flex; align-items: center; justify-content: center;
          color: var(--accent-dark);
          transition: transform .35s cubic-bezier(0.65, 0.05, 0.35, 1);
        }
        .evtspecial .faq-q-icon svg { width: 15px; height: 15px; }
        .evtspecial .faq-q[aria-expanded="true"] .faq-q-icon { transform: rotate(180deg); }
        .evtspecial .faq-a {
          overflow: hidden;
          max-height: 0;
          transition: max-height .4s cubic-bezier(0.65, 0.05, 0.35, 1);
        }
        .evtspecial .faq-a.open { max-height: 500px; }
        .evtspecial .faq-a-inner {
          padding: 22px 30px 28px;
          font-size: 16px;
          color: var(--text-secondary);
          line-height: 1.8;
          border-top: 1px dashed var(--border);
        }
        .evtspecial .faq-a-inner strong {
          color: var(--text-primary);
          font-weight: 700;
        }

        /* ── A vs B 비교 ── */
        .evtspecial .compare-section {
          background: var(--bg);
          padding: 100px 40px 120px;
        }
        .evtspecial .compare-inner {
          max-width: 1100px;
          margin: 0 auto;
        }
        .evtspecial .compare-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 22px;
          margin-top: 56px;
          position: relative;
        }
        .evtspecial .compare-grid::before {
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
        .evtspecial .compare-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 36px 32px;
          transition: transform .25s, box-shadow .25s, border-color .25s;
          display: flex;
          flex-direction: column;
        }
        .evtspecial .compare-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
          border-color: rgba(196,168,245,0.4);
        }
        .evtspecial .compare-card-icon {
          font-size: 40px;
          margin-bottom: 18px;
          line-height: 1;
        }
        .evtspecial .compare-card-pkg {
          font-family: var(--font-en);
          font-size: 12px;
          font-weight: 800;
          color: var(--accent-deep);
          letter-spacing: 1.5px;
          margin-bottom: 10px;
        }
        .evtspecial .compare-card-h {
          font-family: var(--font-ko);
          font-size: clamp(24px, 2.6vw, 30px);
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -.8px;
          line-height: 1.3;
          margin-bottom: 14px;
        }
        .evtspecial .compare-card-sub {
          font-size: 16px;
          color: var(--text-secondary);
          line-height: 1.7;
          margin-bottom: 26px;
          padding-bottom: 26px;
          border-bottom: 1px dashed var(--border);
        }
        .evtspecial .compare-card-list {
          list-style: none;
          display: flex; flex-direction: column;
          gap: 13px;
          margin: 0 0 30px;
          padding: 0;
        }
        .evtspecial .compare-card-list li {
          font-size: 16px;
          color: var(--text-primary);
          line-height: 1.55;
          padding-left: 24px;
          position: relative;
          font-weight: 500;
        }
        .evtspecial .compare-card-list li::before {
          content: '✓';
          position: absolute;
          left: 0; top: 0;
          color: var(--accent-dark);
          font-weight: 800;
          font-size: 15px;
        }
        .evtspecial .compare-cta {
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
        .evtspecial .compare-cta:hover {
          background: var(--accent-deep);
          transform: translateY(-2px);
          box-shadow: 0 8px 22px rgba(139,111,212,0.32);
        }

        /* ── LAUNCH CTA (선착순 7팀 + 카운트다운) ── */
        .evtspecial .launch-cta {
          background: linear-gradient(135deg, #14102A 0%, #1F1840 50%, #2D1F5E 100%);
          padding: 80px 40px 100px;
          position: relative;
          overflow: hidden;
        }
        .evtspecial .launch-cta::before {
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
        .evtspecial .launch-cta::after {
          content: '';
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 800px; height: 600px;
          background: radial-gradient(ellipse, rgba(196,168,245,0.18) 0%, transparent 65%);
          pointer-events: none;
        }
        .evtspecial .launch-cta-inner {
          position: relative; z-index: 1;
          max-width: 980px;
          margin: 0 auto;
          text-align: center;
        }
        .evtspecial .launch-cta-eyebrow {
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
        .evtspecial .launch-cta-eyebrow .star {
          color: #FFD75A;
          font-size: 13px;
          line-height: 1;
        }
        .evtspecial .launch-cta-eyebrow .pulse {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #4ADE80;
          animation: evtspecialLaunchPulse 2s infinite;
        }
        @keyframes evtspecialLaunchPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.6); }
          50% { opacity: 0.6; box-shadow: 0 0 0 8px rgba(74, 222, 128, 0); }
        }
        .evtspecial .launch-cta-h {
          font-family: var(--font-ko);
          font-size: clamp(28px, 4vw, 44px);
          font-weight: 700;
          color: #fff;
          letter-spacing: -1.4px;
          line-height: 1.25;
          margin-bottom: 16px;
        }
        .evtspecial .launch-cta-h .accent { color: var(--accent); }
        .evtspecial .launch-cta-sub {
          font-size: 16px;
          color: rgba(255,255,255,0.72);
          line-height: 1.7;
          margin-bottom: 48px;
        }
        .evtspecial .launch-cta-sub strong {
          color: #fff;
          font-weight: 600;
        }

        /* 카운트다운 */
        .evtspecial .launch-countdown {
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
        .evtspecial .launch-countdown-label {
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
        .evtspecial .launch-countdown-unit {
          text-align: center;
          min-width: 60px;
        }
        .evtspecial .launch-countdown-num {
          font-family: var(--font-en);
          font-size: 32px;
          font-weight: 800;
          color: #fff;
          line-height: 1;
          letter-spacing: -1px;
        }
        .evtspecial .launch-countdown-name {
          font-family: var(--font-en);
          font-size: 10px;
          font-weight: 600;
          color: rgba(196,168,245,0.85);
          letter-spacing: 1.2px;
          margin-top: 6px;
          text-transform: uppercase;
        }

        /* 라이브 라벨 (오픈 후) */
        .evtspecial .launch-live {
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
        .evtspecial .launch-live.show { display: inline-flex; }
        .evtspecial .launch-live::before {
          content: '';
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #4ADE80;
          animation: evtspecialLaunchPulse 2s infinite;
        }

        /* 두 패키지 슬롯 */
        .evtspecial .launch-slots {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          max-width: 720px;
          margin: 0 auto 36px;
        }
        .evtspecial .launch-slot {
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
        .evtspecial .launch-slot:hover {
          background: rgba(196,168,245,0.12);
          border-color: rgba(196,168,245,0.5);
          transform: translateY(-3px);
        }
        .evtspecial .launch-slot-head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 14px;
        }
        .evtspecial .launch-slot-pkg {
          font-family: var(--font-en);
          font-size: 11px;
          font-weight: 800;
          color: var(--accent);
          letter-spacing: 1.5px;
        }
        .evtspecial .launch-slot-count {
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
        .evtspecial .launch-slot-h {
          font-family: var(--font-ko);
          font-size: 18px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -.5px;
          line-height: 1.4;
          margin-bottom: 14px;
        }
        .evtspecial .launch-slot-cta {
          display: flex; align-items: center; justify-content: space-between;
          padding-top: 14px;
          border-top: 1px dashed rgba(255,255,255,0.15);
          font-size: 14px;
          font-weight: 600;
          color: var(--accent);
          transition: color .2s;
        }
        .evtspecial .launch-slot:hover .launch-slot-cta { color: #fff; }
        .evtspecial .launch-slot-cta-arrow { transition: transform .25s; display: inline-block; }
        .evtspecial .launch-slot:hover .launch-slot-cta-arrow {
          transform: translateX(3px);
        }
        .evtspecial .launch-cta-note {
          font-size: 13px;
          color: rgba(255,255,255,0.55);
          line-height: 1.65;
          max-width: 520px;
          margin: 0 auto;
        }

        /* ── CROSS-LINK (FREE 페이지로) ── */
        .evtspecial .cross-link {
          background: #0A0614;
          padding: 80px 40px 100px;
          position: relative;
          overflow: hidden;
        }
        .evtspecial .cross-link::before {
          content: '';
          position: absolute;
          top: -200px; right: -100px;
          width: 600px; height: 400px;
          background: radial-gradient(ellipse, rgba(196,168,245,0.18) 0%, transparent 65%);
          pointer-events: none;
        }
        .evtspecial .cross-link::after {
          content: '';
          position: absolute;
          bottom: -150px; left: -80px;
          width: 500px; height: 350px;
          background: radial-gradient(ellipse, rgba(155,184,248,0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .evtspecial .cross-link-inner {
          position: relative; z-index: 1;
          max-width: 1100px;
          margin: 0 auto;
          text-align: center;
        }
        .evtspecial .cross-link-eyebrow {
          display: inline-flex; align-items: center; gap: 10px;
          font-family: var(--font-en);
          font-size: 12px;
          font-weight: 700;
          color: rgba(255,255,255,0.55);
          letter-spacing: 1.8px;
          text-transform: uppercase;
          margin-bottom: 18px;
        }
        .evtspecial .cross-link-eyebrow::before,
        .evtspecial .cross-link-eyebrow::after {
          content: ''; width: 24px; height: 1px;
          background: rgba(255,255,255,0.3);
        }
        .evtspecial .cross-link-h {
          font-family: var(--font-ko);
          font-size: clamp(24px, 3vw, 36px);
          font-weight: 700;
          color: #fff;
          letter-spacing: -1px;
          line-height: 1.35;
          margin-bottom: 18px;
        }
        .evtspecial .cross-link-h .em { color: var(--accent); }
        .evtspecial .cross-link-sub {
          font-size: 16px;
          color: rgba(255,255,255,0.7);
          line-height: 1.75;
          max-width: 560px;
          margin: 0 auto 40px;
        }
        .evtspecial .cross-card {
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
        .evtspecial .cross-card:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(196,168,245,0.45);
          transform: translateY(-3px);
        }
        .evtspecial .cross-card-badge {
          width: 64px; height: 64px;
          border-radius: 16px;
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent-deep) 100%);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          box-shadow: 0 6px 20px rgba(139,111,212,0.4);
          flex-shrink: 0;
        }
        .evtspecial .cross-card-badge-num {
          font-family: var(--font-en);
          font-size: 22px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -.5px;
          line-height: 1;
        }
        .evtspecial .cross-card-badge-tag {
          font-family: var(--font-en);
          font-size: 9px;
          font-weight: 700;
          color: rgba(255,255,255,0.85);
          letter-spacing: 1.2px;
          margin-top: 4px;
        }
        .evtspecial .cross-card-body { min-width: 0; }
        .evtspecial .cross-card-pkg {
          font-family: var(--font-en);
          font-size: 11px;
          font-weight: 800;
          color: var(--accent);
          letter-spacing: 1.5px;
          margin-bottom: 6px;
        }
        .evtspecial .cross-card-h {
          font-family: var(--font-ko);
          font-size: clamp(18px, 2vw, 22px);
          font-weight: 700;
          color: #fff;
          letter-spacing: -.5px;
          line-height: 1.35;
          margin-bottom: 6px;
        }
        .evtspecial .cross-card-desc {
          font-size: 14.5px;
          color: rgba(255,255,255,0.62);
          line-height: 1.55;
        }
        .evtspecial .cross-card-arrow {
          width: 48px; height: 48px;
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          flex-shrink: 0;
          transition: background .25s, transform .25s, border-color .25s;
        }
        .evtspecial .cross-card:hover .cross-card-arrow {
          background: var(--accent);
          border-color: var(--accent);
          transform: translateX(3px);
        }
        .evtspecial .cross-card-arrow svg { width: 18px; height: 18px; }

        @media (max-width: 900px) {
          .evtspecial section { padding: 80px 24px; }
          .evtspecial .hero { padding: 120px 24px 60px; min-height: auto; }
          .evtspecial .hero-prism { width: 160px; height: 160px; }
          .evtspecial .benefits-grid { grid-template-columns: 1fr; }
          .evtspecial .pkg-section { padding: 60px 24px; }
          .evtspecial .pkg-price { padding: 26px 24px; }
          .evtspecial .pkg-price-final { padding: 18px 20px; }
          .evtspecial .pkg-price-final .num { font-size: 30px; }
          .evtspecial .pkg-price-row .label { font-size: 14.5px; }
          .evtspecial .pkg-price-row .label small { font-size: 12px; }
          .evtspecial .pkg-price-row .num { font-size: 15px; }
          .evtspecial .core-card-header { grid-template-columns: auto 1fr auto; gap: 14px; padding: 18px 20px; }
          .evtspecial .core-card-toggle { grid-column: 3; }
          .evtspecial .core-card-price { grid-column: 1 / -1; justify-content: flex-end; padding-top: 10px; border-top: 1px dashed var(--border); }
          .evtspecial .core-card-expand-inner { grid-template-columns: 1fr; gap: 26px; padding: 24px 22px; }
          .evtspecial .core-notice { padding: 16px 20px; }
          .evtspecial .core-notice-title { font-size: 14px; }
          .evtspecial .core-notice-sub { font-size: 13px; }
          .evtspecial .common-targets { padding: 80px 24px 60px; }
          .evtspecial .event01-targets { grid-template-columns: 1fr; }
          .evtspecial .faq-section { padding: 60px 24px; }
          .evtspecial .faq-q { padding: 20px 24px; }
          .evtspecial .faq-q-text { font-size: 16px; }
          .evtspecial .faq-a-inner { padding: 16px 24px 24px; font-size: 14.5px; }
          .evtspecial .compare-section { padding: 60px 24px 80px; }
          .evtspecial .compare-grid { grid-template-columns: 1fr; gap: 30px; }
          .evtspecial .compare-grid::before { display: none; }
          .evtspecial .launch-cta { padding: 60px 24px 80px; }
          .evtspecial .launch-countdown { gap: 8px; padding: 16px 18px; flex-wrap: wrap; justify-content: center; }
          .evtspecial .launch-countdown-label { padding-right: 0; margin-right: 0; border-right: none; padding-bottom: 8px; flex-basis: 100%; text-align: center; }
          .evtspecial .launch-countdown-unit { min-width: 52px; }
          .evtspecial .launch-countdown-num { font-size: 26px; }
          .evtspecial .launch-slots { grid-template-columns: 1fr; gap: 12px; }
          .evtspecial .launch-slot { padding: 20px 18px; }
          .evtspecial .cross-link { padding: 60px 24px 80px; }
          .evtspecial .cross-card { grid-template-columns: auto 1fr; gap: 16px; padding: 22px 22px; }
          .evtspecial .cross-card-arrow { grid-column: 1 / -1; justify-self: flex-end; width: 40px; height: 40px; }
          .evtspecial .cross-card-h { font-size: 18px; }
          .evtspecial .cross-card-badge { width: 56px; height: 56px; }
        }
        @media (max-width: 480px) {
          .evtspecial .hero-h1 { letter-spacing: -1.5px; }
          .evtspecial .section-h2 { letter-spacing: -.8px; }
          .evtspecial .event01-cta-row { flex-direction: column; width: 100%; }
          .evtspecial .event01-btn { width: 100%; justify-content: center; }
        }
        /* ── SPECIAL ADDITIONS ── */
        .evtspecial .hero-cta-row {
          display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;
          position: relative; z-index: 2;
          margin: 4px 0 44px;
        }
        .evtspecial .hero-cta-row .btn-primary-lg,
        .evtspecial .hero-cta-row .btn-outline-lg {
          display: inline-flex; align-items: center; gap: 8px;
        }
        .evtspecial .hero-price-strip {
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
        .evtspecial .hero-price-strip .strike { text-decoration: line-through; opacity: .6; }
        .evtspecial .hero-price-strip .now {
          font-family: var(--font-en); font-weight: 800; font-size: 20px; color: var(--accent);
          letter-spacing: -0.5px;
        }
        .evtspecial .hero-price-strip .now small { font-family: var(--font-ko); font-size: 13px; font-weight: 700; margin-left: 2px; }
        .evtspecial .hero-price-strip .off {
          font-family: var(--font-en); font-size: 11px; font-weight: 800; letter-spacing: 1px;
          padding: 3px 8px; border-radius: 6px; background: var(--accent); color: #14102A;
        }
        .evtspecial .apply-widget-wrap { text-align: left; margin-top: 8px; }
        .evtspecial .apply-time-badges {
          display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;
          margin: -20px 0 32px;
        }
        .evtspecial .apply-time-badge {
          font-size: 13px; color: rgba(255,255,255,0.85);
          padding: 7px 14px; border-radius: 100px;
          background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.16);
        }
        .evtspecial .apply-time-badge strong { color: var(--accent); }
        .evtspecial .cross-card + .cross-card { margin-top: 16px; }
        @media (max-width: 480px) {
          .evtspecial .hero-cta-row { flex-direction: column; width: 100%; }
          .evtspecial .hero-cta-row a { width: 100%; justify-content: center; }
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
                {NAV_ITEMS.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    className={item.href === content.path ? 'active' : undefined}
                  >
                    {item.label}
                  </a>
                ))}
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
          {NAV_ITEMS.map((item) => (
            <a key={item.href} href={item.href} className="nmm-link nmm-sublink">└ {item.label}</a>
          ))}
          <a href="/blog" className="nmm-link">블로그</a>
        </nav>
        <div className="nmm-cta">
          <a href="/?auth=login" className="nmm-btn-ghost">로그인</a>
          <a href="/?auth=login" className="nmm-btn-primary">지금 시작하기</a>
        </div>
      </div>

      <div className="evtspecial">
        {/* ── HERO ── */}
        <section className="hero">
          <div className="hero-stars" aria-hidden="true"></div>
          <div className="hero-glow" aria-hidden="true"></div>
          <div className="hero-content">
            <div className="hero-badge">
              <span className="hero-badge-dot" aria-hidden="true"></span>
              <span>{hero.badge}</span>
            </div>
            <h1 className="hero-h1">
              <span className="line">{hero.lines[0]}</span>
              <span className="line">{hero.lines[1]}</span>
              <span className="line">{hero.lines[2]}</span>
            </h1>
            <p className="hero-sub">{hero.sub}</p>

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
              <a href="#package" className="btn-outline-lg">포함 내용 보기</a>
            </div>

            <div className="hero-prism" aria-hidden="true">
              <svg className="prism-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id={`${prismId}-grad1`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#C4A8F5" />
                    <stop offset="50%" stopColor="#9BB8F8" />
                    <stop offset="100%" stopColor="#F5C4E8" />
                  </linearGradient>
                  <linearGradient id={`${prismId}-grad2`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFD4A8" />
                    <stop offset="100%" stopColor="#C4A8F5" />
                  </linearGradient>
                  <linearGradient id={`${prismId}-grad3`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#9BB8F8" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#6B4FB8" stopOpacity="0.6" />
                  </linearGradient>
                </defs>
                <polygon points="100,30 160,90 130,160 70,160 40,90" fill={`url(#${prismId}-grad1)`} opacity="0.85" />
                <polygon points="100,30 160,90 100,100" fill={`url(#${prismId}-grad2)`} opacity="0.7" />
                <polygon points="100,100 160,90 130,160" fill={`url(#${prismId}-grad3)`} opacity="0.8" />
                <polygon points="100,100 130,160 70,160" fill={`url(#${prismId}-grad1)`} opacity="0.6" />
                <polygon points="100,100 70,160 40,90" fill={`url(#${prismId}-grad2)`} opacity="0.5" />
                <polygon points="100,30 100,100 40,90" fill={`url(#${prismId}-grad3)`} opacity="0.7" />
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
              <div className="section-eyebrow">{benefits.eyebrow}</div>
              <h2 className="section-h2">{benefits.h2}</h2>
              <p className="section-sub" style={{ marginTop: 14 }}>{benefits.sub}</p>
            </div>

            <div className="benefits-grid">
              <a href="#package" className="benefit-card violet">
                <div className="benefit-eyebrow">001 <span className="dot"></span> 1회차</div>
                <h3 className="benefit-title">🎯 검색 전략</h3>
                <p className="benefit-desc">{benefits.cards[0]}</p>
                <div className="benefit-foot">001 SEO 검색노출전략 점검 · 정가 20만원</div>
              </a>

              <a href="#package" className="benefit-card mint">
                <div className="benefit-eyebrow">002 <span className="dot"></span> 2회차</div>
                <h3 className="benefit-title">✍️ 콘텐츠 기획</h3>
                <p className="benefit-desc">{benefits.cards[1]}</p>
                <div className="benefit-foot">002 홈페이지·콘텐츠 기획·설계 · 정가 20만원</div>
              </a>

              <a href="#package" className="benefit-card cream">
                <div className="benefit-eyebrow">CORE1 <span className="dot"></span> 3회차</div>
                <h3 className="benefit-title">🚀 즉시 배포</h3>
                <p className="benefit-desc">{benefits.cards[2]}</p>
                <div className="benefit-foot">CORE1 즉시 배포 + 기술적 SEO · 정가 10만원</div>
              </a>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
              패키지 상세 (001 + 002 + CORE1)
        ══════════════════════════════════════════════ */}
        <section className="pkg-section" id="package">
          <div className="pkg-section-inner">
            <div className="event01-tag-row">
              <div className="event01-tag">
                <span className="num">{pkg.tagNum}</span>
                <span>{pkg.tagLabel}</span>
              </div>
            </div>

            <h2 className="section-h2">{pkg.h2}</h2>
            <p className="event01-lead">{pkg.lead}</p>

            {/* 가격 박스 */}
            <div className="pkg-price">
              <div className="pkg-price-row">
                <span className="label">001 SEO 검색노출전략 점검<small>{pkg.rowNotes[0]}</small></span>
                <span className="num">20만원</span>
              </div>
              <div className="pkg-price-row">
                <span className="label">002 홈페이지 및 콘텐츠 기획 · 설계<small>{pkg.rowNotes[1]}</small></span>
                <span className="num">20만원</span>
              </div>
              <div className="pkg-price-row">
                <span className="label">CORE1 즉시 배포 + 기술적 SEO 셋팅<small>{pkg.rowNotes[2]}</small></span>
                <span className="num">10만원</span>
              </div>
              <div className="pkg-price-divider"></div>
              <div className="pkg-price-sum">
                <span>합계</span>
                <span className="num">50만원</span>
              </div>
              <div className="pkg-price-final">
                <span className="label">{pkg.finalLabel}</span>
                <span className="num">10<span className="unit">만원</span></span>
              </div>
              <div className="pkg-price-saved">{pkg.savedNote}</div>
            </div>

            {/* 001 + 002 + CORE 1 */}
            <div className="free-bundle-core">
              {coreCards.map((card) => {
                const expandId = `${prismId}-expand-${card.id}`;
                return (
                  <div key={card.id}>
                    {card.notice && (
                      <div className="core-notice">
                        <div className="core-notice-star" aria-hidden="true"></div>
                        <div className="core-notice-body">
                          <div className="core-notice-title">{card.notice.title}</div>
                          <div className="core-notice-sub">{card.notice.sub}</div>
                        </div>
                      </div>
                    )}
                    <div className="core-card">
                      <div className="core-card-header">
                        <div className="core-card-icon">
                          <span className="core-card-icon-text">{card.iconText}</span>
                        </div>
                        <div className="core-card-body">
                          <span className="core-card-label">{card.label}</span>
                          <h4 className="core-card-h">{card.title}</h4>
                          <div className="core-card-tags">
                            {card.tags.map((t) => <span key={t} className="core-card-tag">{t}</span>)}
                          </div>
                        </div>
                        <div className="core-card-price">
                          <span className="core-card-price-strike">{card.priceStrike}</span>
                          <span className="core-card-price-arrow">→</span>
                          <span className="core-card-price-free">포함</span>
                        </div>
                        <button
                          type="button"
                          className="core-card-toggle"
                          aria-expanded={isOpen(card.id)}
                          aria-controls={expandId}
                          aria-label={isOpen(card.id) ? '접기' : '자세히 보기'}
                          onClick={() => toggleCard(card.id)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                      </div>
                      <div className={`core-card-expand${isOpen(card.id) ? ' open' : ''}`} id={expandId}>
                        <div className="core-card-expand-inner">
                          <div>
                            <div className="core-col-section">
                              <p className="core-col-desc">{card.desc[0]}</p>
                              <p className="core-col-desc">{card.desc[1]}</p>
                            </div>
                            <div className="core-col-section">
                              <span className="core-col-h">이런 분께 추천합니다</span>
                              <ul className="core-col-list bullet">
                                {card.recommended.map((r) => <li key={r}>{r}</li>)}
                              </ul>
                            </div>
                          </div>
                          <div>
                            <div className="core-col-section">
                              <span className="core-col-h">{card.contentsHeading}</span>
                              <ul className="core-col-list check">
                                {card.contents.map((c) => <li key={c}>{c}</li>)}
                              </ul>
                            </div>
                            <div className="core-col-section muted">
                              <span className="core-col-h">진행 방식</span>
                              <div className="core-col-chips">
                                {card.chips.map((chip) => (
                                  <span key={chip.text} className="core-col-chip">
                                    <span className="core-col-chip-icon">{chip.icon}</span>{chip.text}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
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
              <p className="event01-cta-note">{pkg.ctaNote}</p>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
              대상
        ══════════════════════════════════════════════ */}
        <section className="common-targets">
          <div className="common-targets-inner">
            <div className="section-eyebrow">{targets.eyebrow}</div>
            <h2 className="section-h2">{targets.h2}</h2>
            <p className="event01-lead" style={{ marginBottom: 56 }}>{targets.lead}</p>

            <div className="event01-targets">
              {targets.items.map((text, i) => {
                const wide = i === targets.items.length - 1 && targets.items.length % 2 === 1;
                return (
                  <div key={text} className="event01-target" style={wide ? { gridColumn: '1 / -1' } : undefined}>
                    <div className="event01-target-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></svg>
                    </div>
                    <p className="event01-target-text">{text}</p>
                  </div>
                );
              })}
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
              <span>{apply.eyebrow}</span>
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
                eventCode={content.eventCode}
                source={content.source}
                sessions={['1회차', '2회차', '3회차']}
                startHour={8}
                endHour={23}
                dark
                title={apply.widgetTitle}
                description={apply.widgetDescription}
                notePlaceholder={apply.notePlaceholder}
                privacyPurpose={apply.privacyPurpose}
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
              {faq.map((item) => {
                const expanded = openFaq === item.id;
                const faqId = `${prismId}-${item.id}`;
                return (
                  <div key={item.id} className="faq-item">
                    <button
                      type="button"
                      className="faq-q"
                      aria-expanded={expanded}
                      aria-controls={faqId}
                      onClick={() => toggleFaq(item.id)}
                    >
                      <span className="faq-q-text">{item.q}</span>
                      <span className="faq-q-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </span>
                    </button>
                    <div className={`faq-a${expanded ? ' open' : ''}`} id={faqId}>
                      <div className="faq-a-inner">{item.a}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
              EVENT 04 vs 이 이벤트 비교
        ══════════════════════════════════════════════ */}
        <section className="compare-section">
          <div className="compare-inner">
            <div className="section-eyebrow">{compare.eyebrow}</div>
            <h2 className="section-h2">{compare.h2}</h2>
            <p className="event01-lead">{compare.lead}</p>

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
                <div className="compare-card-icon" aria-hidden="true">{compare.card.icon}</div>
                <div className="compare-card-pkg">{compare.card.pkg}</div>
                <h3 className="compare-card-h">{compare.card.h}</h3>
                <p className="compare-card-sub">{compare.card.sub}</p>
                <ul className="compare-card-list">
                  {compare.card.list.map((li) => <li key={li}>{li}</li>)}
                </ul>
                <a href="#apply" className="compare-cta">
                  <span>희망 시간 등록하기</span>
                  <span aria-hidden="true">↑</span>
                </a>
              </article>
            </div>
          </div>
        </section>

        {/* ── CROSS-LINK 배너 (자매 이벤트 + 첫완성패키지) ── */}
        <section className="cross-link">
          <div className="cross-link-inner">
            <div className="cross-link-eyebrow">{crossLink.eyebrow}</div>
            <h2 className="cross-link-h">{crossLink.h2}</h2>
            <p className="cross-link-sub">{crossLink.sub}</p>

            <a href={crossLink.sibling.href} className="cross-card">
              <div className="cross-card-badge">
                <span className="cross-card-badge-num">{crossLink.sibling.badgeNum}</span>
                <span className="cross-card-badge-tag">{crossLink.sibling.badgeTag}</span>
              </div>
              <div className="cross-card-body">
                <div className="cross-card-pkg">{crossLink.sibling.pkg}</div>
                <div className="cross-card-h">{crossLink.sibling.h}</div>
                <div className="cross-card-desc">{crossLink.sibling.desc}</div>
              </div>
              <div className="cross-card-arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            </a>

            <a href="/events2026/first" className="cross-card">
              <div className="cross-card-badge">
                <span className="cross-card-badge-num">04</span>
                <span className="cross-card-badge-tag">FULL</span>
              </div>
              <div className="cross-card-body">
                <div className="cross-card-pkg">EVENT 04 · 첫완성패키지</div>
                <div className="cross-card-h">업종 제한 없이 · 검색 · 기획 · 배포 전 과정 + 사전상담 1시간</div>
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
