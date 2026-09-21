import { Fragment, useEffect, useState, type FormEvent } from 'react';
import ReactDOM from 'react-dom';
import './landing.css';
import { ConsultationWidget } from '../components/ConsultationWidget';
import { LandingBlogSection } from './landing/LandingBlogSection';
import { subscribeNewsletter, type NewsletterPersona } from '../api';
import { SiteFooter } from '../components/SiteFooter';
import { ytCommand } from '../lib/ytControl';

const PERSONA_LABEL: Record<NewsletterPersona, string> = {
  'small-business': '소상공인',
  'freelancer': '프리랜서',
  'startup': '스타트업',
  'marketer': '마케터',
  'creator': '크리에이터',
};

interface Props {
  authError: string;
}

export function LandingPage({ authError }: Props) {
  const [consultOpen, setConsultOpen] = useState(false);
  const [newsletterPersona, setNewsletterPersona] = useState<NewsletterPersona | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [newsletterError, setNewsletterError] = useState<string | null>(null);

  const openNewsletterModal = (key: NewsletterPersona) => {
    setNewsletterPersona(key);
    setNewsletterEmail('');
    setNewsletterStatus('idle');
    setNewsletterError(null);
    document.body.style.overflow = 'hidden';
  };
  const closeNewsletterModal = () => {
    setNewsletterPersona(null);
    document.body.style.overflow = '';
  };
  const submitNewsletter = async (e: FormEvent) => {
    e.preventDefault();
    if (newsletterStatus === 'submitting' || !newsletterPersona) return;
    setNewsletterStatus('submitting');
    setNewsletterError(null);
    try {
      await subscribeNewsletter({
        email: newsletterEmail.trim(),
        persona: newsletterPersona,
        source: 'landing-persona',
      });
      setNewsletterStatus('success');
    } catch (err) {
      setNewsletterStatus('error');
      setNewsletterError(err instanceof Error ? err.message : '구독에 실패했습니다.');
    }
  };

  useEffect(() => {
    // ── Mobile hamburger menu ──
    const btn = document.getElementById('navHamburger');
    const menu = document.getElementById('navMobileMenu');
    const hamburgerHandler = () => {
      if (!btn || !menu) return;
      const isOpen = menu.classList.toggle('open');
      btn.classList.toggle('open', isOpen);
      btn.setAttribute('aria-label', isOpen ? '메뉴 닫기' : '메뉴 열기');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    };
    if (btn) btn.addEventListener('click', hamburgerHandler);
    const mobileLinks = menu?.querySelectorAll('.nmm-link') || [];
    const closeMobileMenu = () => {
      menu?.classList.remove('open');
      btn?.classList.remove('open');
      document.body.style.overflow = '';
    };
    mobileLinks.forEach((a: Element) => a.addEventListener('click', closeMobileMenu));

    // ── Mobile persona carousel ──
    const mpTrack = document.getElementById('mpTrack');
    const mpDots = document.querySelectorAll('#mpDots .mp-dot');
    const mpPrev = document.getElementById('mpPrev');
    const mpNext = document.getElementById('mpNext');
    let mpCurrent = 0;
    const MP_TOTAL = 3;
    let mpAutoTimer: ReturnType<typeof setInterval>;
    function mpGoTo(idx: number) {
      mpCurrent = ((idx % MP_TOTAL) + MP_TOTAL) % MP_TOTAL;
      if (mpTrack) mpTrack.style.transform = 'translateX(-' + (mpCurrent * 100) + '%)';
      mpDots.forEach((d, i) => d.classList.toggle('active', i === mpCurrent));
    }
    function mpStartAuto() {
      clearInterval(mpAutoTimer);
      mpAutoTimer = setInterval(() => mpGoTo(mpCurrent + 1), 3800);
    }
    if (mpPrev) mpPrev.addEventListener('click', () => { mpGoTo(mpCurrent - 1); mpStartAuto(); });
    if (mpNext) mpNext.addEventListener('click', () => { mpGoTo(mpCurrent + 1); mpStartAuto(); });
    mpDots.forEach(d => d.addEventListener('click', () => { mpGoTo(+(d as HTMLElement).dataset.idx!); mpStartAuto(); }));
    let mpStartX = 0;
    mpTrack?.addEventListener('touchstart', (e: Event) => { mpStartX = (e as TouchEvent).touches[0].clientX; }, { passive: true });
    mpTrack?.addEventListener('touchend', (e: Event) => {
      const dx = (e as TouchEvent).changedTouches[0].clientX - mpStartX;
      if (Math.abs(dx) > 40) { mpGoTo(dx < 0 ? mpCurrent + 1 : mpCurrent - 1); mpStartAuto(); }
    }, { passive: true });
    if (mpTrack) mpStartAuto();

    // ── NAV scroll ──
    const nav = document.getElementById('mainNav');
    const testiEl = document.querySelector('.testi-section');
    function getNavThreshold() {
      const videoEl = document.getElementById('videoRevealSection');
      if (videoEl) return videoEl.offsetTop + videoEl.offsetHeight - window.innerHeight;
      if (!testiEl) return window.innerHeight * 0.9;
      return testiEl.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.6;
    }
    let navThreshold = getNavThreshold();
    const resizeNavHandler = () => { navThreshold = getNavThreshold(); };
    window.addEventListener('resize', resizeNavHandler, { passive: true } as EventListenerOptions);
    const scrollNavHandler = () => {
      if (window.scrollY >= navThreshold) nav?.classList.add('scrolled');
      else nav?.classList.remove('scrolled');
    };
    window.addEventListener('scroll', scrollNavHandler, { passive: true } as EventListenerOptions);

    // ── Scroll reveal ──
    const reveals = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).style.transitionDelay = (i * 0.08) + 's';
          e.target.classList.add('visible');
          revealObserver.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach(el => revealObserver.observe(el));

    // ── Persona tabs ──
    const psTabs = document.querySelectorAll('.ps-tab');
    const psPanels = document.querySelectorAll('.ps-panel');
    function psActivate(idx: number) {
      psTabs.forEach((t, i) => t.classList.toggle('active', i === idx));
      psPanels.forEach((p, i) => p.classList.toggle('active', i === idx));
    }
    psTabs.forEach((tab, i) => tab.addEventListener('click', () => psActivate(i)));
    let psTimer = setInterval(() => {
      const active = Array.from(psTabs).findIndex(t => t.classList.contains('active'));
      psActivate((active + 1) % psTabs.length);
    }, 4000);
    const psWrap = document.querySelector('.ps-wrap');
    psWrap?.addEventListener('mouseenter', () => clearInterval(psTimer));
    psWrap?.addEventListener('mouseleave', () => {
      clearInterval(psTimer);
      psTimer = setInterval(() => {
        const active = Array.from(psTabs).findIndex(t => t.classList.contains('active'));
        psActivate((active + 1) % psTabs.length);
      }, 4000);
    });

    // ── Scroll features stacked accordion ──
    // 모바일(≤600px)에서는 스크롤 고정(scroll-jacking)을 쓰지 않고
    // CSS로 모든 카드를 펼친 정적 리스트로 보여준다 → 아래 setup 전체를 건너뜀.
    const sfMobile = window.matchMedia('(max-width: 600px)').matches;
    const sfSection = document.getElementById('scrollFeatures');
    const sfStack = document.getElementById('sfStack');
    const sfCards = sfStack ? Array.from(sfStack.querySelectorAll('.sf-card')) : [];
    const SF_TOTAL = sfCards.length;
    const SF_HDR = 52;
    const SF_GAP = 6;
    const SF_STEP = SF_HDR + SF_GAP;
    let sfCurrent = -1;
    function sfBodyH(idx: number) {
      const stackH = sfStack?.offsetHeight || 0;
      const used = idx * SF_STEP + SF_HDR;
      return Math.max(160, stackH - used);
    }
    function sfSetActive(idx: number) {
      if (idx === sfCurrent) return;
      sfCurrent = idx;
      sfCards.forEach((card, i) => {
        const body = card.querySelector('.sf-card-bd') as HTMLElement;
        card.classList.remove('sf-past', 'sf-active', 'sf-future');
        if (i < idx) {
          card.classList.add('sf-past');
          (card as HTMLElement).style.height = SF_HDR + 'px';
          if (body) body.style.height = '0px';
        } else if (i === idx) {
          card.classList.add('sf-active');
          const h = sfBodyH(idx);
          (card as HTMLElement).style.height = (SF_HDR + h) + 'px';
          if (body) body.style.height = h + 'px';
        } else {
          card.classList.add('sf-future');
          (card as HTMLElement).style.height = '0px';
          if (body) body.style.height = '0px';
        }
      });
    }
    function sfProgress() {
      if (!sfSection) return 0;
      const rect = sfSection.getBoundingClientRect();
      const scrollable = sfSection.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return 0;
      return Math.max(0, Math.min(1, -rect.top / scrollable));
    }
    let sfRaf: number;
    const sfScrollHandler = () => {
      cancelAnimationFrame(sfRaf);
      sfRaf = requestAnimationFrame(() => {
        const p = sfProgress();
        const idx = Math.min(Math.floor(p * SF_TOTAL), SF_TOTAL - 1);
        sfSetActive(idx);
      });
    };
    if (!sfMobile) {
      window.addEventListener('scroll', sfScrollHandler, { passive: true } as EventListenerOptions);
      window.addEventListener('resize', () => {
        if (sfCurrent >= 0) {
          sfCurrent = -1;
          sfSetActive(Math.min(Math.floor(sfProgress() * SF_TOTAL), SF_TOTAL - 1));
        }
      }, { passive: true } as EventListenerOptions);
      sfCards.forEach((card, i) => {
        card.querySelector('.sf-card-hd')?.addEventListener('click', () => {
          if (!sfSection) return;
          const scrollable = sfSection.offsetHeight - window.innerHeight;
          const target = sfSection.offsetTop + (i / SF_TOTAL) * scrollable + 4;
          window.scrollTo({ top: target, behavior: 'smooth' });
        });
      });
      requestAnimationFrame(() => requestAnimationFrame(() => sfSetActive(0)));
    }

    // ── Testimonial carousel ──
    const tTrack = document.getElementById('testimonialTrack');
    const tDotsWrap = document.getElementById('carouselDots');
    const tSlides = tTrack ? Array.from(tTrack.querySelectorAll('.testimonial-slide')) : [];
    const tTotal = tSlides.length;
    let tCurrent = 0;
    if (tTrack && tDotsWrap) {
      tSlides.forEach((_, i) => {
        const d = document.createElement('button');
        d.className = 'carousel-dot' + (i === 0 ? ' active' : '');
        d.setAttribute('aria-label', 'Slide ' + (i + 1));
        d.addEventListener('click', () => { tGoTo(i); tResetAuto(); });
        tDotsWrap.appendChild(d);
      });
    }
    function tGoTo(idx: number) {
      tCurrent = ((idx % tTotal) + tTotal) % tTotal;
      if (tSlides[0]) {
        const slideW = (tSlides[0] as HTMLElement).offsetWidth + 24;
        if (tTrack) tTrack.style.transform = 'translateX(-' + (tCurrent * slideW) + 'px)';
      }
      tDotsWrap?.querySelectorAll('.carousel-dot').forEach((d, i) =>
        d.classList.toggle('active', i === tCurrent)
      );
    }
    let tAuto = setInterval(() => tGoTo(tCurrent + 1), 4500);
    function tResetAuto() { clearInterval(tAuto); tAuto = setInterval(() => tGoTo(tCurrent + 1), 4500); }
    tTrack?.parentElement?.addEventListener('mouseenter', () => clearInterval(tAuto));
    tTrack?.parentElement?.addEventListener('mouseleave', tResetAuto);
    window.addEventListener('resize', () => tGoTo(tCurrent), { passive: true } as EventListenerOptions);

    // ── Count up ──
    function countUp(el: HTMLElement, target: number, duration: number) {
      const start = performance.now();
      (function frame(now: number) {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = String(Math.round(eased * target));
        if (t < 1) requestAnimationFrame(frame);
        else el.textContent = String(target);
      })(start);
    }
    const counters = [
      { id: 'c1', target: 10, dur: 1400 },
      { id: 'c2', target: 100, dur: 1800 },
      { id: 'c3', target: 10, dur: 1400 },
      { id: 'c4', target: 10, dur: 1400 },
      { id: 'r1', target: 320, dur: 2000 },
      { id: 'r2', target: 3, dur: 1000 },
      { id: 'r3', target: 10, dur: 1400 },
      { id: 'r4', target: 100, dur: 1800 },
    ];
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const cfg = counters.find(c => c.id === e.target.id);
        if (cfg) countUp(e.target as HTMLElement, cfg.target, cfg.dur);
        countObserver.unobserve(e.target);
      });
    }, { threshold: 0.5 });
    counters.forEach(c => {
      const el = document.getElementById(c.id);
      if (el) countObserver.observe(el);
    });

    // ── Bento flip ──
    document.querySelectorAll('.bento-flip').forEach(card => {
      card.addEventListener('click', function(this: HTMLElement, e: Event) {
        if ((e.target as HTMLElement).closest('.bento-back-link')) return;
        if (window.matchMedia('(hover: none)').matches) {
          this.classList.toggle('flipped');
        }
      });
    });

    // ── Mouse gradient blob ──
    const CONFIGS = [
      { size: 600, blur: 38, alphaScale: 1.00, lerp: 0.055 },
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
    function makeGradient(p: string[], scale: number) {
      const s = (rgba: string) => rgba.replace(/([\d.]+)\)$/, (_, a) =>
        Math.min(parseFloat(a) * scale, 1).toFixed(2) + ')');
      return `radial-gradient(circle at center, ${s(p[0])} 0%, ${s(p[1])} 22%, ${s(p[2])} 45%, ${s(p[3])} 62%, transparent 78%)`;
    }
    let paletteIdx = 0, lastSwitch = 0;
    const blobs = CONFIGS.map((cfg) => {
      const el = document.createElement('div');
      Object.assign(el.style, {
        position: 'fixed', pointerEvents: 'none', zIndex: '0',
        width: cfg.size + 'px', height: cfg.size + 'px', borderRadius: '50%',
        transform: 'translate(-50%, -50%)', filter: `blur(${cfg.blur}px)`,
        mixBlendMode: 'normal', transition: 'opacity 0.7s ease', opacity: '0',
        left: '0', top: '0', willChange: 'left, top',
      });
      document.body.appendChild(el);
      return { el, x: innerWidth / 2, y: innerHeight / 2, cfg };
    });
    function applyPalette() {
      const p = PALETTES[paletteIdx];
      blobs.forEach(b => { b.el.style.background = makeGradient(p, b.cfg.alphaScale); });
    }
    applyPalette();
    let mouseX = innerWidth / 2, mouseY = innerHeight / 2;
    let blobVisible = false;
    const mouseMoveHandler = (e: MouseEvent) => {
      mouseX = e.clientX; mouseY = e.clientY;
      if (!blobVisible) { blobVisible = true; blobs.forEach(b => b.el.style.opacity = '1'); }
    };
    const mouseLeaveHandler = () => { blobVisible = false; blobs.forEach(b => b.el.style.opacity = '0'); };
    document.addEventListener('mousemove', mouseMoveHandler, { passive: true } as EventListenerOptions);
    document.addEventListener('mouseleave', mouseLeaveHandler);
    let blobRaf: number;
    (function tick(now: number) {
      blobRaf = requestAnimationFrame(tick);
      if (now - lastSwitch > 3000) {
        paletteIdx = (paletteIdx + 1) % PALETTES.length;
        lastSwitch = now;
        applyPalette();
      }
      let targetX = mouseX, targetY = mouseY;
      blobs.forEach(b => {
        b.x += (targetX - b.x) * b.cfg.lerp;
        b.y += (targetY - b.y) * b.cfg.lerp;
        b.el.style.left = b.x.toFixed(1) + 'px';
        b.el.style.top = b.y.toFixed(1) + 'px';
        targetX = b.x; targetY = b.y;
      });
    })(0);

    // ── Video reveal ──
    const vidSection = document.getElementById('videoRevealSection');
    const vidWrap = document.getElementById('videoFrameWrap');
    const vidLabel = document.getElementById('videoRevealLabel');
    const vidHint = document.getElementById('videoScrollHint');
    const vidGlow = document.getElementById('videoBgGlow');
    const ytPlayer = document.getElementById('ytPlayer') as HTMLIFrameElement | null;
    const vidProgressBar = document.getElementById('videoProgressBar');
    const vidThumbnail = document.getElementById('videoThumbnail');
    const vidMuteBtn = document.getElementById('videoMuteBtn');
    let videoStarted = false;
    let vidMuted = false;
    let vidRaf: number;
    function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }
    function lerpV(a: number, b: number, t: number) { return a + (b - a) * t; }
    function vidGetProgress() {
      if (!vidSection) return 0;
      const rect = vidSection.getBoundingClientRect();
      const total = vidSection.offsetHeight - window.innerHeight;
      return clamp(-rect.top / total, 0, 1);
    }
    function vidApplyProgress(p: number) {
      if (!vidWrap || !vidLabel || !vidHint || !vidGlow || !vidProgressBar) return;
      const growEnd = 0.78;
      const phase1 = clamp(p / growEnd, 0, 1);
      const ease = (t: number) => t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
      const e1 = ease(phase1);
      vidLabel.style.opacity = '0';
      vidLabel.style.marginBottom = '0px';
      vidHint.style.opacity = String(Math.max(0, 1 - p * 6));
      const scaleVal = lerpV(0.68, 1, e1);
      vidWrap.style.transform = 'scale(' + scaleVal + ')';
      vidWrap.style.borderRadius = Math.round(lerpV(20, 0, e1)) + 'px';
      const sh = lerpV(0.14, 0.02, e1);
      vidWrap.style.boxShadow = '0 ' + Math.round(lerpV(20,2,e1)) + 'px ' + Math.round(lerpV(80,12,e1)) + 'px rgba(0,0,0,' + sh.toFixed(2) + ')';
      const glowVal = clamp((p - 0.65) / 0.35, 0, 1);
      vidGlow.style.opacity = ease(glowVal).toFixed(3);
      // Thumbnail stays visible until user clicks play — no auto-fade
      vidProgressBar.style.width = (p * 100) + '%';
    }
    function vidTick() {
      vidApplyProgress(vidGetProgress());
      vidRaf = requestAnimationFrame(vidTick);
    }
    let vidObs: IntersectionObserver | undefined;
    if (vidSection) {
      vidObs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) vidRaf = requestAnimationFrame(vidTick);
          else cancelAnimationFrame(vidRaf);
        });
      }, { rootMargin: '200px' });
      vidObs.observe(vidSection);
    }
    // Click thumbnail to start video (only way to play)
    if (vidThumbnail) {
      vidThumbnail.addEventListener('click', () => {
        vidThumbnail.style.opacity = '0';
        vidThumbnail.style.pointerEvents = 'none';
        if (!videoStarted && ytPlayer) {
          videoStarted = true;
          ytPlayer.src = 'https://www.youtube.com/embed/HMV6PMtG720?autoplay=1&rel=0&modestbranding=1&color=white&enablejsapi=1';
          ytPlayer.style.pointerEvents = 'auto';
          vidWrap?.classList.add('playing');
        }
      });
    }

    // Auto-pause when video scrolls out of view, resume thumbnail when paused
    let vidVisObs: IntersectionObserver | undefined;
    if (vidWrap && ytPlayer) {
      vidVisObs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (!e.isIntersecting && videoStarted) {
            // Pause by removing autoplay src, show thumbnail again
            ytPlayer.src = 'https://www.youtube.com/embed/HMV6PMtG720?enablejsapi=1&rel=0&modestbranding=1&color=white';
            ytPlayer.style.pointerEvents = 'none';
            vidWrap.classList.remove('playing');
            videoStarted = false;
            if (vidThumbnail) {
              vidThumbnail.style.opacity = '1';
              vidThumbnail.style.pointerEvents = 'auto';
            }
          }
        });
      }, { threshold: 0.1 });
      vidVisObs.observe(vidWrap);
    }

    // Mute toggle — postMessage to the YouTube player (enablejsapi=1).
    const onVidMute = () => {
      vidMuted = !vidMuted;
      ytCommand(ytPlayer, vidMuted ? 'mute' : 'unMute');
      if (vidMuteBtn) vidMuteBtn.textContent = vidMuted ? '🔇' : '🔊';
    };
    if (vidMuteBtn) vidMuteBtn.addEventListener('click', onVidMute);

    // ESC stops the video (and its audio) and restores the prism poster.
    const onVidEsc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !videoStarted || !ytPlayer) return;
      ytPlayer.src = 'https://www.youtube.com/embed/HMV6PMtG720?enablejsapi=1&rel=0&modestbranding=1&color=white';
      ytPlayer.style.pointerEvents = 'none';
      vidWrap?.classList.remove('playing');
      videoStarted = false;
      vidMuted = false;
      if (vidMuteBtn) vidMuteBtn.textContent = '🔊';
      if (vidThumbnail) {
        vidThumbnail.style.opacity = '1';
        vidThumbnail.style.pointerEvents = 'auto';
      }
    };
    window.addEventListener('keydown', onVidEsc);

    // ── Cleanup ──
    return () => {
      if (vidMuteBtn) vidMuteBtn.removeEventListener('click', onVidMute);
      window.removeEventListener('keydown', onVidEsc);
      clearInterval(mpAutoTimer);
      clearInterval(psTimer);
      clearInterval(tAuto);
      cancelAnimationFrame(sfRaf);
      cancelAnimationFrame(blobRaf);
      cancelAnimationFrame(vidRaf);
      revealObserver.disconnect();
      countObserver.disconnect();
      vidObs?.disconnect();
      vidVisObs?.disconnect();
      window.removeEventListener('scroll', scrollNavHandler);
      window.removeEventListener('resize', resizeNavHandler);
      window.removeEventListener('scroll', sfScrollHandler);
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseleave', mouseLeaveHandler);
      blobs.forEach(b => b.el.remove());
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <>
      {/* NAV */}
      <nav id="mainNav" className="landing-nav">
        <div className="nav-inner">
          <a href="/" className="nav-logo">AISEO</a>
          <div className="nav-links">
            <a href="/course2026">수강안내</a>
            <a href="/support2026">지원서비스</a>
            <div className="nav-item-has-sub">
              <a href="/events2026">이벤트</a>
              <div className="nav-submenu" role="menu">
                <a href="/events2026/free" role="menuitem">무료이벤트</a>
                <a href="/events2026/paid" role="menuitem">할인이벤트</a>
                <a href="/events2026/first" role="menuitem">첫완성패키지</a>
                <a href="/events2026/pet-photo" role="menuitem">반려동물 사진작가 이벤트</a>
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

      {/* Mobile dropdown menu */}
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

      {/* HERO */}
      <section className="hero landing-hero" id="hero">
        <div className="hero-bg"></div>
        <div className="hero-noise"></div>
        <div className="hero-grid"></div>
        <div className="hero-content">
          <div className="hero-badge">
            <div className="hero-badge-dot"></div>
            AI시대에 맞는 소상공인들을 위한 AISEO.TIPS
          </div>
          <h1 className="hero-h1">
            <span className="word w1">AI로 만들고,</span><br/>
            <span className="word w2 accent-text">검색에 올리고,</span><br/>
            <span className="word w3">온라인 마케팅을 시작하세요</span>
          </h1>
          <p className="hero-sub">
            AI로 원하는 사이트를 만들고, 10년 전문가의 핵심 SEO 노하우로 검색엔진에서 쉽게 찾아지도록 만들어드립니다.
          </p>
          {authError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, marginBottom: 16, color: '#dc2626' }}>
              {authError}
            </div>
          )}
          <div className="hero-mobile-cta">
            <a href="/?auth=signup" className="hero-mobile-btn-primary">수강신청하기 →</a>
          </div>
        </div>

        {/* HERO — 모바일 전용 레이아웃 (≤600px에서만 표시) */}
        <div className="hero-mobile-hero">
          {authError && (
            <div className="hmh-reveal hmh-d1" style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, marginBottom: 16, color: '#dc2626' }}>
              {authError}
            </div>
          )}
          <div className="hmh-eyebrow hmh-reveal hmh-d1">
            <span className="hmh-accent">AI</span>시대에 맞는<br/>
            <span className="hmh-accent">소상공인</span>들을 위한 <span className="hmh-brand">AISEO.TIPS</span>
          </div>
          <p className="hmh-sub hmh-reveal hmh-d2">
            AI로 원하는 사이트를 만들고, 10년 전문가의 핵심 SEO 노하우로 검색엔진에서 쉽게 찾아지도록 만들어드립니다.
          </p>
          <h1 className="hmh-h1 hmh-reveal hmh-d3">
            <span className="hmh-accent">AI</span><span className="hmh-stroke">로 만들고</span><br/>
            <span className="hmh-accent">검색</span><span className="hmh-stroke">에 올리는</span><br/>
            <span className="hmh-accent">SEO 홈페이지</span>
          </h1>
          <button type="button" className="hmh-cta hmh-reveal hmh-d4" onClick={() => setConsultOpen(true)}>
            1시간만에 완성하기 <span className="arrow">→</span>
          </button>
        </div>
      </section>

      {/* VIDEO REVEAL */}
      <div className="video-reveal-section" id="videoRevealSection">
        <div className="video-reveal-sticky" id="videoRevealSticky">
          <div className="video-bg-glow" id="videoBgGlow"></div>
          <div className="video-reveal-label" id="videoRevealLabel" style={{display:'none',margin:0}}></div>
          <div className="video-frame-wrap" id="videoFrameWrap">
            <div id="videoThumbnail">
              <div className="vt-placeholder">
                <div className="vt-play-ring">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M8 5L19 12L8 19V5Z"/></svg>
                </div>
                <span className="vt-label">AISEO 데모 영상 · 5분</span>
              </div>
            </div>
            <div className="video-play-overlay" id="videoPlayOverlay"></div>
            <iframe
              id="ytPlayer"
              src="https://www.youtube.com/embed/HMV6PMtG720?enablejsapi=1&rel=0&modestbranding=1&color=white"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
            <button type="button" id="videoMuteBtn" className="video-mute-btn" aria-label="음소거 토글">🔊</button>
            <div className="video-progress-bar" id="videoProgressBar"></div>
          </div>
          <div className="video-scroll-hint" id="videoScrollHint">
            <span>스크롤해서 열기</span>
            <svg className="scroll-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:'var(--text-muted)'}}>
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      </div>

      {/* TESTIMONIAL */}
      <div className="testi-section reveal">
        <div className="testi-inner">
          <p className="testi-quote">
            링크만 생기는 AI 사이트, 막상 운영하려니 매달 나가는 호스팅비, 하지만 여전히 아무도 못 찾아오는 내 사이트. 이 세 가지를 한 번에 해결하기 위해 소상공인, 1인대표, 스타트업을 위해 만든 서비스입니다.
          </p>
          <div className="testi-divider"></div>
          <div className="testi-footer">
            <div className="testi-author">
              <div className="testi-avatar">🙋</div>
              <div>
                <div className="testi-author-name">Jin &amp; Philo</div>
                <div className="testi-author-role">AISEO.TIPS 컨설턴트</div>
              </div>
            </div>
            <div className="testi-brand">AISEO.TIPS</div>
          </div>
        </div>
      </div>

      {/* AI COPILOT INTRO */}
      <section className="copilot-intro" id="copilot-intro">
        <div className="copilot-intro-inner">
          {/* 모바일 전용 헤드 (데스크탑 숨김) — 순서: 라벨 → 헤드라인 → 그림 → 세부설명 */}
          <div className="copilot-mobile-head">
            <div className="section-eyebrow">AISEO.TIPS</div>
            <h2 className="section-h2">딱 1시간, 완벽한 사이트로<br/>검색 마케팅이 시작됩니다.</h2>
          </div>
          <div className="copilot-intro-text reveal">
            <div className="section-eyebrow">AI SEO TIPS</div>
            <h2 className="section-h2">1시간이면 완벽한 사이트로<br/>온라인 마케팅을 시작할 수 있습니다</h2>
            <p className="section-sub">AI로 사이트를 만드는 프롬프트부터 SEO 기본 셋팅을 위한 프로그램까지 — 계정 생성 연동까지 쉽고 꼭 필요한 핵심만 쏙쏙. 1시간 강의면 실행까지 충분합니다. AI 시대 자동화 마케팅, 그 시작을 준비하세요.</p>
          </div>
          <div className="copilot-visual reveal">
            {/* Desktop Dashboard mockup */}
            <div className="copilot-mockup-wrap copilot-desktop-only">
              <div className="copilot-fc fc-tl">
                <div className="float-card-icon">🚀</div>
                <div className="float-card-label">SEO Score</div>
                <div className="float-card-sub">+34점 상승 · 이번 주</div>
              </div>
              <div className="copilot-fc fc-bl">
                <div className="float-card-icon">📈</div>
                <div className="float-card-label">트래픽 증가</div>
                <div className="float-card-sub">3.2x 지난달 대비</div>
              </div>
              <div className="copilot-fc fc-tr">
                <div className="float-card-icon">🤖</div>
                <div className="float-card-label">AI 최적화</div>
                <div className="float-card-sub">자동 완료</div>
              </div>
              <div className="hero-mockup">
                <div className="mockup-bar">
                  <div className="mockup-dot r"></div><div className="mockup-dot y"></div><div className="mockup-dot g"></div>
                  <div className="mockup-url">app.aiseo.tips/dashboard</div>
                </div>
                <div className="mockup-screen">
                  <div className="mockup-sidebar">
                    <div className="mockup-nav-item active"><div className="mockup-nav-icon"></div><div className="mockup-nav-label"></div></div>
                    <div className="mockup-nav-item"><div className="mockup-nav-icon"></div><div className="mockup-nav-label"></div></div>
                    <div className="mockup-nav-item"><div className="mockup-nav-icon"></div><div className="mockup-nav-label"></div></div>
                    <div className="mockup-nav-item"><div className="mockup-nav-icon"></div><div className="mockup-nav-label"></div></div>
                    <div className="mockup-nav-item"><div className="mockup-nav-icon"></div><div className="mockup-nav-label"></div></div>
                  </div>
                  <div className="mockup-main">
                    <div className="mockup-row">
                      <div className="mockup-stat highlight"><div className="mockup-stat-num">94</div><div className="mockup-stat-label">SEO 점수</div></div>
                      <div className="mockup-stat"><div className="mockup-stat-num">4.8k</div><div className="mockup-stat-label">월 방문자</div></div>
                      <div className="mockup-chart">
                        <div className="bar a"></div><div className="bar b"></div><div className="bar c"></div><div className="bar d"></div><div className="bar e"></div><div className="bar f"></div><div className="bar g"></div><div className="bar h"></div>
                      </div>
                    </div>
                    <div className="mockup-table">
                      <div className="mockup-tr"><div className="mockup-avatar"></div><div className="mockup-name"></div><div style={{flex:1,height:9,background:'var(--border-soft)',borderRadius:4,marginLeft:6}}></div><div className="mockup-tag">1위</div></div>
                      <div className="mockup-tr"><div className="mockup-avatar"></div><div className="mockup-name"></div><div style={{flex:1,height:9,background:'var(--border-soft)',borderRadius:4,marginLeft:6}}></div><div className="mockup-tag orange">3위</div></div>
                      <div className="mockup-tr"><div className="mockup-avatar"></div><div className="mockup-name"></div><div style={{flex:1,height:9,background:'var(--border-soft)',borderRadius:4,marginLeft:6}}></div><div className="mockup-tag">2위</div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile compact dashboard */}
            <div className="copilot-mobile-mockup">
              <div className="cmm-bar">
                <div className="mockup-dot r"></div><div className="mockup-dot y"></div><div className="mockup-dot g"></div>
                <div className="cmm-url">app.aiseo.tips/dashboard</div>
              </div>
              <div className="cmm-stats">
                <div className="cmm-stat cmm-stat-hl">
                  <div className="cmm-stat-num">94</div>
                  <div className="cmm-stat-label">SEO 점수</div>
                </div>
                <div className="cmm-stat">
                  <div className="cmm-stat-num">4.8k</div>
                  <div className="cmm-stat-label">월 방문자</div>
                </div>
                <div className="cmm-stat">
                  <div className="cmm-chart">
                    <div className="cmm-bar-col" style={{height:'35%'}}></div>
                    <div className="cmm-bar-col" style={{height:'55%'}}></div>
                    <div className="cmm-bar-col" style={{height:'40%'}}></div>
                    <div className="cmm-bar-col" style={{height:'70%'}}></div>
                    <div className="cmm-bar-col" style={{height:'50%'}}></div>
                    <div className="cmm-bar-col cmm-bar-accent" style={{height:'88%'}}></div>
                    <div className="cmm-bar-col cmm-bar-mid" style={{height:'72%'}}></div>
                  </div>
                  <div className="cmm-stat-label">트래픽</div>
                </div>
              </div>
              <div className="cmm-table">
                <div className="cmm-tr">
                  <div className="cmm-avatar"></div>
                  <div className="cmm-lines"><div className="cmm-line" style={{width:'60%'}}></div><div className="cmm-line" style={{width:'40%',marginTop:4,opacity:0.5}}></div></div>
                  <div className="mockup-tag">1위</div>
                </div>
                <div className="cmm-tr">
                  <div className="cmm-avatar"></div>
                  <div className="cmm-lines"><div className="cmm-line" style={{width:'70%'}}></div><div className="cmm-line" style={{width:'35%',marginTop:4,opacity:0.5}}></div></div>
                  <div className="mockup-tag orange">3위</div>
                </div>
                <div className="cmm-tr">
                  <div className="cmm-avatar"></div>
                  <div className="cmm-lines"><div className="cmm-line" style={{width:'55%'}}></div><div className="cmm-line" style={{width:'45%',marginTop:4,opacity:0.5}}></div></div>
                  <div className="mockup-tag">2위</div>
                </div>
              </div>
              <div className="cmm-badges">
                <div className="cmm-badge">🚀 SEO +34점</div>
                <div className="cmm-badge">📈 트래픽 3.2x</div>
                <div className="cmm-badge">🤖 AI 자동화</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUSTED */}
      <div className="trusted">
        <div className="trusted-label">5,200+ 팀이 신뢰하는 AI SEO 플랫폼</div>
        <div className="marquee-wrap">
          <div className="marquee-track" id="marquee">
            {['로컬비지니스','반려동물서비스','청소 및 특수청소','사진스튜디오','스냅사진작가','공방','원데이클래스','꽃집'].map((name, i) => (
              <div className="marquee-item" key={`m1-${i}`}><div className="logo-pill">{name}</div></div>
            ))}
            {['로컬비지니스','반려동물서비스','청소 및 특수청소','사진스튜디오','스냅사진작가','공방','원데이클래스','꽃집'].map((name, i) => (
              <div className="marquee-item" key={`m2-${i}`}><div className="logo-pill">{name}</div></div>
            ))}
          </div>
        </div>
        <div className="stats-row">
          <div className="stat-item reveal">
            <div className="stat-num"><span id="c1">0</span><span>년+</span></div>
            <div className="stat-label">SEO 업력</div>
          </div>
          <div className="stat-item reveal">
            <div className="stat-num"><span id="c2">0</span><span>%</span></div>
            <div className="stat-label">SEO 상위 노출</div>
          </div>
          <div className="stat-item reveal">
            <div className="stat-num"><span id="c3">0</span><span>x</span></div>
            <div className="stat-label">평균 트래픽 증가</div>
          </div>
          <div className="stat-item reveal">
            <div className="stat-num"><span id="c4">0</span><span>만원</span></div>
            <div className="stat-label">월간 절약 비용</div>
          </div>
        </div>
      </div>

      {/* SCROLL FEATURES */}
      <div className="sf-section" id="scrollFeatures">
        <div className="sf-sticky">
          <div className="sf-header">
            <div className="section-eyebrow">ALL-IN-ONE PLATFORM</div>
            <h2 className="sf-title">온라인마케팅의 시작 AISEO.TIPS</h2>
            <p className="sf-sub">시작부터 분석까지 AISEO에서 모두 함께 시작하세요.</p>
          </div>
          <div className="sf-stack" id="sfStack">
            {/* Card 0: AI 홈페이지 제작 */}
            <div className="sf-card" data-idx="0">
              <div className="sf-card-hd">
                <span className="sf-dot" style={{background:'#C4A8F5',boxShadow:'0 0 0 3px rgba(196,168,245,0.15)'}}></span>
                <span className="sf-label">AI 홈페이지 제작</span>
                <span className="sf-hd-sub">내 비즈니스에 맞는 사이트를 AI로</span>
              </div>
              <div className="sf-card-bd">
                <div className="sf-card-text">
                  <h3>프롬프트 하나로<br/>내 사이트가 완성됩니다</h3>
                  <p>AI 홈페이지 제작 프롬프트 &amp; 템플릿을 제공합니다. 내 비즈니스에 맞는 사이트를 만드는 비법을 쉽고 빠르게 익히고 바로 적용하세요.</p>
                  <ul className="sf-feature-list">
                    <li className="sf-feature-item"><div className="sf-check" style={{background:'#F0EBFF',color:'#8B6FD4'}}>✓</div><span>업종별 AI 프롬프트 템플릿 제공</span></li>
                    <li className="sf-feature-item"><div className="sf-check" style={{background:'#F0EBFF',color:'#8B6FD4'}}>✓</div><span>ChatGPT · Claude로 페이지 즉시 생성 지원</span></li>
                    <li className="sf-feature-item"><div className="sf-check" style={{background:'#F0EBFF',color:'#8B6FD4'}}>✓</div><span>모바일/PC 반응형 자동 적용</span></li>
                    <li className="sf-feature-item"><div className="sf-check" style={{background:'#F0EBFF',color:'#8B6FD4'}}>✓</div><span>누구나! 1시간 안에 완성</span></li>
                  </ul>
                </div>
                <div className="sf-card-img" style={{'--card-bg1':'#0B0414','--card-bg2':'#1A0F2E'} as React.CSSProperties}>
                  <img src="/landing/sf-card-0.jpg" alt="AI 홈페이지 제작 — 프롬프트로 사이트 생성" className="sf-card-photo" loading="lazy" />
                </div>
              </div>
            </div>

            {/* Card 1: 도메인 & 호스팅 */}
            <div className="sf-card" data-idx="1">
              <div className="sf-card-hd">
                <span className="sf-dot" style={{background:'#10B981',boxShadow:'0 0 0 3px rgba(16,185,129,0.15)'}}></span>
                <span className="sf-label">도메인 &amp; 호스팅</span>
                <span className="sf-hd-sub">서브도메인 무료 · 업로드 한 번으로 서비스 시작</span>
              </div>
              <div className="sf-card-bd">
                <div className="sf-card-text">
                  <h3>만든 사이트를<br/>바로 세상에 올리세요</h3>
                  <p>12개월 무료 서브도메인과 호스팅을 제공합니다. 파일 업로드 한 번으로 내 사이트가 실제 인터넷에 서비스됩니다. 매달 나가는 호스팅 비용 걱정 없이 시작하세요!</p>
                  <ul className="sf-feature-list">
                    <li className="sf-feature-item"><div className="sf-check" style={{background:'#D1FAE5',color:'#059669'}}>✓</div><span>12개월 무료 서브도메인 제공 (yourname.aiseo.tips)</span></li>
                    <li className="sf-feature-item"><div className="sf-check" style={{background:'#D1FAE5',color:'#059669'}}>✓</div><span>웹호스팅 무료 제공</span></li>
                    <li className="sf-feature-item"><div className="sf-check" style={{background:'#D1FAE5',color:'#059669'}}>✓</div><span>파일 업로드 한 번으로 즉시 서비스</span></li>
                    <li className="sf-feature-item"><div className="sf-check" style={{background:'#D1FAE5',color:'#059669'}}>✓</div><span>SSL 보안 인증서 무료 &amp; 자동 적용</span></li>
                  </ul>
                </div>
                <div className="sf-card-img" style={{'--card-bg1':'#021510','--card-bg2':'#062B22'} as React.CSSProperties}>
                  <img src="/landing/sf-card-1.jpg" alt="도메인 & 호스팅 — 서브도메인 + 1G 무료 호스팅" className="sf-card-photo" loading="lazy" />
                </div>
              </div>
            </div>

            {/* Card 2: SEO 핵심강의 */}
            <div className="sf-card" data-idx="2">
              <div className="sf-card-hd">
                <span className="sf-dot" style={{background:'#F59E0B',boxShadow:'0 0 0 3px rgba(245,158,11,0.15)'}}></span>
                <span className="sf-label">SEO 핵심강의</span>
                <span className="sf-hd-sub">기술적 SEO · 한번에 그리고 쉽게</span>
              </div>
              <div className="sf-card-bd">
                <div className="sf-card-text">
                  <h3>10년 노하우를<br/>핵심만 쏙쏙 배웁니다</h3>
                  <p>검색노출을 위한 SEO 핵심강의를 제공합니다. 기술적 SEO의 복잡함을 없애고, 소상공인·1인 대표도 바로 적용할 수 있는 핵심만 담았습니다.</p>
                  <ul className="sf-feature-list">
                    <li className="sf-feature-item"><div className="sf-check" style={{background:'#FEF3C7',color:'#D97706'}}>✓</div><span>sitemap · robots · 메타태그 완전 정복</span></li>
                    <li className="sf-feature-item"><div className="sf-check" style={{background:'#FEF3C7',color:'#D97706'}}>✓</div><span>네이버 · 구글 동시 상위 노출 전략</span></li>
                    <li className="sf-feature-item"><div className="sf-check" style={{background:'#FEF3C7',color:'#D97706'}}>✓</div><span>키워드 리서치 실전 가이드</span></li>
                    <li className="sf-feature-item"><div className="sf-check" style={{background:'#FEF3C7',color:'#D97706'}}>✓</div><span>강의 수강 후 즉시 적용 가능한 체크리스트</span></li>
                  </ul>
                </div>
                <div className="sf-card-img" style={{'--card-bg1':'#1A0F03','--card-bg2':'#2A1A05'} as React.CSSProperties}>
                  <img src="/landing/sf-card-2.jpg" alt="SEO 핵심강의 — 검색 노출 핵심 자료" className="sf-card-photo" loading="lazy" />
                </div>
              </div>
            </div>

            {/* Card 3: 성과 분석 & 마케팅 자동화 */}
            <div className="sf-card" data-idx="3">
              <div className="sf-card-hd">
                <span className="sf-dot" style={{background:'#9BB8F8',boxShadow:'0 0 0 3px rgba(155,184,248,0.15)'}}></span>
                <span className="sf-label">성과 분석 &amp; 마케팅 자동화</span>
                <span className="sf-hd-sub">순위 추적 · 성과 비교 · 자동화</span>
              </div>
              <div className="sf-card-bd">
                <div className="sf-card-text">
                  <h3>순위 추적부터<br/>자동화 교육까지</h3>
                  <p>검색 순위를 실시간으로 추적하고 경쟁사와 성과를 비교합니다. AI를 활용한 콘텐츠 제작·배포 자동화 교육으로 반복 업무를 줄이고 마케팅 효율을 높이세요.</p>
                  <ul className="sf-feature-list">
                    <li className="sf-feature-item"><div className="sf-check" style={{background:'#EBF2FF',color:'#5B8DEF'}}>✓</div><span>키워드 순위 실시간 추적 대시보드</span></li>
                    <li className="sf-feature-item"><div className="sf-check" style={{background:'#EBF2FF',color:'#5B8DEF'}}>✓</div><span>경쟁사 대비 성과 비교 리포트</span></li>
                    <li className="sf-feature-item"><div className="sf-check" style={{background:'#EBF2FF',color:'#5B8DEF'}}>✓</div><span>AI 콘텐츠 제작 &amp; SNS 배포 자동화 교육</span></li>
                    <li className="sf-feature-item"><div className="sf-check" style={{background:'#EBF2FF',color:'#5B8DEF'}}>✓</div><span>월간 성과 리포트 자동 생성 · 실전 운영 가이드</span></li>
                  </ul>
                </div>
                <div className="sf-card-img" style={{'--card-bg1':'#1A0A03','--card-bg2':'#2A1505'} as React.CSSProperties}>
                  <img src="/landing/sf-card-3.jpg" alt="성과 분석 & 마케팅 자동화 — 채널 연동 자동화" className="sf-card-photo" loading="lazy" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PERSONA */}
      <section className="persona" id="persona">
        <div className="section-inner">
          <div className="persona-header reveal">
            <div className="section-eyebrow">WHO IS IT FOR</div>
            <h2 className="section-h2">나에게 맞는 솔루션</h2>
            <p className="section-sub">소상공인부터 크리에이터까지 — 모든 역할에 맞게 설계된 AI SEO 플랫폼입니다.</p>
          </div>

          <div className="ps-wrap reveal">
            <div className="ps-tabs" id="psTabs">
              {[
                { label: '소상공인', blob: 'radial-gradient(ellipse,#FF6B6B 0%,#8B5CF6 100%)', svg: <svg width="60" height="72" viewBox="0 0 60 72" fill="none" className="ps-icon"><rect x="10" y="28" width="40" height="32" rx="2" stroke="#1F2937" strokeWidth="1.5"/><path d="M6 28h48l-5-10H11L6 28Z" stroke="#1F2937" strokeWidth="1.5" strokeLinejoin="round"/><rect x="24" y="42" width="12" height="18" rx="2" stroke="#1F2937" strokeWidth="1.5"/><rect x="12" y="34" width="10" height="7" rx="1" stroke="#1F2937" strokeWidth="1.5"/><rect x="38" y="34" width="10" height="7" rx="1" stroke="#1F2937" strokeWidth="1.5"/><circle cx="30" cy="14" r="5" stroke="#1F2937" strokeWidth="1.5"/><path d="M26 19c0 0 1 3 4 3s4-3 4-3" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round"/></svg> },
                { label: '프리랜서', blob: 'radial-gradient(ellipse,#60A5FA 0%,#34D399 100%)', svg: <svg width="60" height="72" viewBox="0 0 60 72" fill="none" className="ps-icon"><rect x="8" y="24" width="44" height="28" rx="3" stroke="#1F2937" strokeWidth="1.5"/><rect x="14" y="30" width="32" height="16" rx="1" stroke="#1F2937" strokeWidth="1.4" strokeDasharray="3 2"/><path d="M4 52h52l-4 6H8L4 52Z" stroke="#1F2937" strokeWidth="1.5" strokeLinejoin="round"/><circle cx="43" cy="16" r="5" stroke="#1F2937" strokeWidth="1.5"/><path d="M39 21c1 2 2 3 4 3s3-1 4-3" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round"/><path d="M37 24v-4" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round"/><path d="M49 24v-4" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round"/></svg> },
                { label: '스타트업', blob: 'radial-gradient(ellipse,#FBBF24 0%,#F97316 100%)', svg: <svg width="60" height="72" viewBox="0 0 60 72" fill="none" className="ps-icon"><path d="M30 8c0 0 12 8 12 22v12H18V30C18 16 30 8 30 8Z" stroke="#1F2937" strokeWidth="1.5" strokeLinejoin="round"/><path d="M18 34c-4 2-8 6-8 10l8-2" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M42 34c4 2 8 6 8 10l-8-2" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="22" y="42" width="16" height="10" rx="2" stroke="#1F2937" strokeWidth="1.5"/><circle cx="30" cy="26" r="4" stroke="#1F2937" strokeWidth="1.5"/><path d="M18 56h24" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round"/><path d="M46 10l4-4M48 14l4-2M44 7l2-4" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round"/></svg> },
                { label: '마케터', blob: 'radial-gradient(ellipse,#2DD4BF 0%,#9BB8F8 100%)', svg: <svg width="60" height="72" viewBox="0 0 60 72" fill="none" className="ps-icon"><path d="M14 30h4l22-12v28L18 34h-4a4 4 0 0 1 0-8v0" stroke="#1F2937" strokeWidth="1.5" strokeLinejoin="round"/><path d="M18 34l4 12h6l-4-12" stroke="#1F2937" strokeWidth="1.5" strokeLinejoin="round"/><path d="M40 22c4 2 6 6 6 8s-2 6-6 8" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round"/><path d="M44 17c6 4 9 9 9 13s-3 9-9 13" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round"/><circle cx="30" cy="12" r="5" stroke="#1F2937" strokeWidth="1.5"/><path d="M26 17c1 2 2 3 4 3s3-1 4-3" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round"/></svg> },
                { label: '크리에이터', blob: 'radial-gradient(ellipse,#C084FC 0%,#F472B6 100%)', svg: <svg width="60" height="72" viewBox="0 0 60 72" fill="none" className="ps-icon"><rect x="10" y="26" width="40" height="28" rx="3" stroke="#1F2937" strokeWidth="1.5"/><circle cx="30" cy="40" r="8" stroke="#1F2937" strokeWidth="1.5"/><circle cx="30" cy="40" r="3" stroke="#1F2937" strokeWidth="1.5"/><rect x="18" y="20" width="10" height="8" rx="2" stroke="#1F2937" strokeWidth="1.5"/><circle cx="44" cy="32" r="2" stroke="#1F2937" strokeWidth="1.5"/><circle cx="19" cy="12" r="4" stroke="#1F2937" strokeWidth="1.5"/><path d="M16 16c0 0 1 3 3 3s3-3 3-3" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round"/><path d="M40 10l3 4M46 8l-3 4M43 14l4 1" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round"/></svg> },
              ].map((tab, i) => (
                <div className={`ps-tab${i === 0 ? ' active' : ''}`} data-idx={String(i)} key={tab.label}>
                  <div className="ps-tab-inner">
                    <div className="ps-blob" style={{background: tab.blob}}></div>
                    {tab.svg}
                  </div>
                  <span className="ps-tab-label">{tab.label}</span>
                </div>
              ))}
            </div>

            <div className="ps-panels" id="psPanels">
              {[
                { key: 'small-business' as NewsletterPersona, title: '동네 가게도\n검색 1위가 됩니다', desc: 'IT 전문 지식 없이도 홈페이지 만들고, 네이버·구글 검색 상위 노출까지 한 번에. 마케팅 비용은 줄이고 고객은 늘어납니다.', cta: '소상공인 솔루션 알아보기 →', b1: '고객 문의 3배 증가', b1d: 'AI SEO 자동화로 검색 상위 노출을 달성하고 네이버·구글에서 새 고객이 직접 찾아오게 만드세요.', b2: '온라인 광고 이제 직접 시작하세요', b2d: 'SNS 광고, 검색 광고를 전문가 없이도 직접 운영하세요. AI가 타겟 설정부터 카피 작성까지 도와드립니다.' },
                { key: 'freelancer' as NewsletterPersona, title: '포트폴리오가\n스스로 영업합니다', desc: '전문가 포트폴리오 사이트를 AI로 제작하고, SEO 최적화로 검색을 통한 클라이언트 자동 유입 채널을 만드세요.', cta: '프리랜서 솔루션 알아보기 →', b1: '클라이언트 문의 5배 증가', b1d: '검색으로 찾아오는 잠재 고객을 자동으로 끌어들이고 더 좋은 프로젝트를 선택할 수 있는 여유를 만드세요.', b2: '나를 꼭 필요로 하는 클라이언트가 찾아오도록', b2d: '검색으로 나를 발견한 클라이언트는 이미 나를 원하는 사람입니다. SEO로 질 좋은 문의만 자동으로 받으세요.' },
                { key: 'startup' as NewsletterPersona, title: '마케터 없이도\n유기 트래픽을 키웁니다', desc: '초기 팀에게 SEO 전담 인력은 사치입니다. AISEO가 콘텐츠 마케팅 전략부터 실행까지 자동화합니다.', cta: '스타트업 솔루션 알아보기 →', b1: '유기 트래픽 4배 증가', b1d: '광고비 없이 검색엔진에서 찾아오는 트래픽을 4배로 늘리고 지속 가능한 성장 채널을 구축하세요.', b2: '담당자 없이도 꼭 필요한 마케팅을 놓치지 않도록', b2d: '마케팅 자동화로 채용 없이도 핵심 채널을 빠짐없이 운영하세요. 런웨이를 지키면서 성장 채널을 확보합니다.' },
                { key: 'marketer' as NewsletterPersona, title: 'SEO 보고서 작성\n자동화로 해방되세요', desc: '키워드 리서치, 경쟁사 분석, 성과 리포트까지 — 반복 업무를 AI에게 넘기고 전략에 집중하세요.', cta: '마케터 솔루션 알아보기 →', b1: '주당 12시간 업무 자동화', b1d: '키워드 분석, 콘텐츠 최적화, 리포팅까지 AI가 대신합니다. 전략 수립에만 집중하세요.', b2: '상위 노출 성공률 78%', b2d: 'AI 기반 콘텐츠 최적화와 기술적 SEO 자동화로 목표 키워드 1페이지 달성률을 극대화하세요.' },
                { key: 'creator' as NewsletterPersona, title: '콘텐츠가 검색으로\n스스로 퍼져나갑니다', desc: '유튜브, 블로그, 뉴스레터 — 모든 콘텐츠를 SEO 최적화해 검색 유입을 극대화하고 새로운 팬을 만나세요.', cta: '크리에이터 솔루션 알아보기 →', b1: '검색 노출 2.8배 증가', b1d: '기존 콘텐츠를 AI가 SEO 최적화해 검색엔진에서 더 많이 발견되고 새 구독자가 자연스럽게 유입됩니다.', b2: '한 번 만든 콘텐츠도 계속해서 찾아오도록', b2d: '제목, 설명, 태그를 SEO 최적화해 오래된 콘텐츠도 검색에서 계속 발견됩니다. 업로드 후에도 트래픽이 쌓입니다.' },
              ].map((panel, i) => (
                <div className={`ps-panel${i === 0 ? ' active' : ''}`} data-idx={String(i)} key={`panel-${i}`}>
                  <div className="ps-left">
                    <h2 className="ps-title">
                      {panel.title.split('\n').map((line, lineIdx, arr) => (
                        <Fragment key={lineIdx}>
                          {line}
                          {lineIdx < arr.length - 1 && <br />}
                        </Fragment>
                      ))}
                    </h2>
                    <p className="ps-desc">{panel.desc}</p>
                    <button
                      type="button"
                      className="ps-cta"
                      onClick={() => openNewsletterModal(panel.key)}
                    >
                      {panel.cta}
                    </button>
                  </div>
                  <div className="ps-right">
                    <div className="ps-benefit">
                      <h4>{panel.b1}</h4>
                      <p>{panel.b1d}</p>
                    </div>
                    <div className="ps-divider"></div>
                    <div className="ps-benefit">
                      <h4>{panel.b2}</h4>
                      <p>{panel.b2d}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile persona carousel */}
          <div className="mobile-persona" id="mobilePersona">
            <div className="mp-track-wrap">
              <div className="mp-track" id="mpTrack">
                {[
                  { key: 'small-business' as NewsletterPersona, icon: '🏪', tag: '소상공인', title: '동네 가게도\n검색 1위가 됩니다', desc: 'IT 전문 지식 없이도 홈페이지 만들고, 네이버·구글 검색 상위 노출까지 한 번에. 마케팅 비용은 줄이고 고객은 늘어납니다.', b1i: '📈', b1: '고객 문의 3배 증가', b2i: '📣', b2: '온라인 광고 이제 직접 시작하세요', cta: '소상공인 솔루션 알아보기 →' },
                  { key: 'freelancer' as NewsletterPersona, icon: '💻', tag: '프리랜서', title: '포트폴리오가\n스스로 영업합니다', desc: '전문가 포트폴리오 사이트를 AI로 제작하고, SEO 최적화로 검색을 통한 클라이언트 자동 유입 채널을 만드세요.', b1i: '🤝', b1: '클라이언트 문의 5배 증가', b2i: '🎯', b2: '나를 꼭 필요로 하는 클라이언트가 찾아오도록', cta: '프리랜서 솔루션 알아보기 →' },
                  { key: 'startup' as NewsletterPersona, icon: '🚀', tag: '스타트업', title: '마케터 없이도\n유기 트래픽을 키웁니다', desc: '초기 팀에게 SEO 전담 인력은 사치입니다. AISEO가 콘텐츠 마케팅 전략부터 실행까지 자동화합니다.', b1i: '📊', b1: '유기 트래픽 4배 증가', b2i: '⚙️', b2: '담당자 없이 꼭 필요한 마케팅을 놓치지 않도록', cta: '스타트업 솔루션 알아보기 →' },
                ].map((card, i) => (
                  <div className="mp-card" key={`mp-${i}`}>
                    <span className="mp-card-icon">{card.icon}</span>
                    <span className="mp-card-tag">{card.tag}</span>
                    <h3>
                      {card.title.split('\n').map((line, lineIdx, arr) => (
                        <Fragment key={lineIdx}>
                          {line}
                          {lineIdx < arr.length - 1 && <br />}
                        </Fragment>
                      ))}
                    </h3>
                    <p>{card.desc}</p>
                    <div className="mp-benefit-item"><span className="mp-benefit-icon">{card.b1i}</span><span>{card.b1}</span></div>
                    <div className="mp-benefit-item"><span className="mp-benefit-icon">{card.b2i}</span><span>{card.b2}</span></div>
                    <button
                      type="button"
                      className="mp-card-cta"
                      onClick={() => openNewsletterModal(card.key)}
                    >
                      {card.cta}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="mp-nav">
              <button className="mp-arrow" id="mpPrev">&#8592;</button>
              <div className="mp-dots" id="mpDots">
                <button className="mp-dot active" data-idx="0"></button>
                <button className="mp-dot" data-idx="1"></button>
                <button className="mp-dot" data-idx="2"></button>
              </div>
              <button className="mp-arrow" id="mpNext">&#8594;</button>
            </div>
          </div>
        </div>
      </section>

      {/* RESULTS */}
      <section className="results" id="results">
        <div className="section-inner">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:48,flexWrap:'wrap',gap:20}} className="reveal">
            <div>
              <div className="section-eyebrow">REAL RESULTS</div>
              <h2 className="section-h2" style={{marginBottom:0}}>실제 고객들의<br/>진짜 성과</h2>
            </div>
            <a href="#results" style={{fontSize:14,fontWeight:600,color:'var(--accent)',textDecoration:'none'}}>모든 사례 보기 →</a>
          </div>
          <div className="results-metrics reveal">
            <div className="results-metric">
              <div className="results-metric-num"><span id="r1" className="accent">0</span><span className="accent">%+</span></div>
              <div className="results-metric-label">평균 유기 트래픽 증가율<br/>AISEO 도입 3개월 후</div>
            </div>
            <div className="results-metric">
              <div className="results-metric-num"><span id="r2">0</span><span>위</span></div>
              <div className="results-metric-label">대표 키워드 평균<br/>검색 순위</div>
            </div>
            <div className="results-metric">
              <div className="results-metric-num"><span id="r3">0</span><span className="accent">시간</span></div>
              <div className="results-metric-label">주당 SEO 작업 절약<br/>자동화 효과</div>
            </div>
            <div className="results-metric">
              <div className="results-metric-num"><span id="r4">0</span><span>+</span></div>
              <div className="results-metric-label">검색 문의 증가</div>
            </div>
          </div>
          <div className="results-carousel reveal">
            <div className="testimonial-track" id="testimonialTrack">
              {[
                { quote: '"AISEO 도입 한 달 만에 \'반려동물 미용\' 키워드로 네이버 3위에 올랐어요. 전에는 SEO가 뭔지도 몰랐는데 이제 매달 새 고객이 검색으로 들어옵니다."', avatar: '🐾', name: '강동현', role: '평택 반려동물 미용샵 운영', badge: '소상공인' },
                { quote: '"SEO 에이전시에 매달 150만원 쓰던 걸 AISEO로 대체했어요. 오히려 성과는 더 좋아졌고 비용은 10분의 1로 줄었습니다. 팀 전체가 만족합니다."', avatar: '💻', name: '윤서진', role: 'B2B 제조기업 마케팅 리드', badge: '스타트업' },
                { quote: '"프리랜서로 일하면서 영업이 가장 힘들었는데, AISEO로 포트폴리오 사이트 최적화하고 나서 매달 안정적으로 클라이언트가 검색으로 들어와요."', avatar: '🎨', name: '이수아', role: '브랜딩 디자이너', badge: '프리랜서' },
                { quote: '"콘텐츠 발행하면 AI가 자동으로 SEO 최적화해주니까 글 쓰는 데만 집중할 수 있어요. 구독자가 6개월 만에 5배 늘었습니다."', avatar: '✍️', name: '박지민', role: '테크 블로거', badge: '크리에이터' },
                { quote: '"월 리포트 작성에 이틀씩 쓰던 게 이제 30분으로 줄었어요. AI가 데이터 분석하고 인사이트까지 뽑아주니 진짜 전략에만 집중할 수 있습니다."', avatar: '📈', name: '한지현', role: '이커머스 SEO 매니저', badge: '마케터' },
              ].map((t, i) => (
                <div className="testimonial-slide" key={`t-${i}`}>
                  <p className="testimonial-quote">{t.quote}</p>
                  <div className="testimonial-author">
                    <div className="testimonial-avatar">{t.avatar}</div>
                    <div><div className="testimonial-name">{t.name}</div><div className="testimonial-role">{t.role}</div></div>
                    <div className="testimonial-badge">{t.badge}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="carousel-controls" id="carouselDots"></div>
          </div>
        </div>
      </section>

      {/* BENTO STORIES */}
      <section className="bento-section" id="stories">
        <div className="section-inner" style={{maxWidth:1100}}>
          <div className="bento-header reveal">
            <div className="section-eyebrow">CUSTOMER STORIES</div>
            <h2 className="section-h2">성과로 증명합니다</h2>
            <p className="section-sub">실제 고객들이 AISEO로 만들어낸 숫자들</p>
          </div>
          <div className="bento-grid reveal">
            <div className="bento-flip bento-span2" data-href="#">
              <div className="bento-flip-inner">
                <div className="bento-front" style={{background:'#FEF08A'}}>
                  <div className="bento-stat-num">320%<span style={{fontSize:36}}>+</span></div>
                  <div className="bento-stat-label">평균 트래픽 증가</div>
                  <div className="bento-logo-slot"><div className="bento-logo-placeholder">로고 영역</div></div>
                </div>
                <div className="bento-back">
                  <p className="bento-back-desc">AISEO 도입 3개월 만에 달성한 실제 평균 유기 트래픽 증가율입니다. 광고 없이 검색으로만 이루어낸 성과입니다.</p>
                  <a href="#results" className="bento-back-link">사례 보기 →</a>
                </div>
              </div>
            </div>
            <div className="bento-flip bento-span2" data-href="#">
              <div className="bento-flip-inner">
                <div className="bento-front" style={{background:'#A7F3D0'}}>
                  <div className="bento-stat-num">78%</div>
                  <div className="bento-stat-label">검색 상위 노출 성공률</div>
                  <div className="bento-logo-slot"><div className="bento-logo-placeholder">로고 영역</div></div>
                </div>
                <div className="bento-back">
                  <p className="bento-back-desc">목표 키워드를 구글·네이버 1페이지에 올린 고객 비율. AI 최적화가 만들어낸 일관된 성과입니다.</p>
                  <a href="#results" className="bento-back-link">사례 보기 →</a>
                </div>
              </div>
            </div>
            <div className="bento-quote bento-span3">
              <p className="bento-quote-text">AISEO 도입 한 달 만에 '반려동물 미용' 키워드로 네이버 3위에 올랐어요. 전에는 SEO가 뭔지도 몰랐는데 이제 매달 새 고객이 검색으로 들어옵니다.</p>
              <div className="bento-author">
                <div className="bento-avatar">🐾</div>
                <div>
                  <div className="bento-author-name">강동현</div>
                  <div className="bento-author-role">평택 반려동물 미용샵 운영</div>
                </div>
                <div className="bento-quote-logo"><div className="bento-logo-placeholder">로고 영역</div></div>
              </div>
            </div>
            <div className="bento-quote bento-span3">
              <p className="bento-quote-text">SEO 에이전시에 매달 150만원 쓰던 걸 AISEO로 대체했어요. 오히려 성과는 더 좋아졌고 비용은 10분의 1로 줄었습니다. 팀 전체가 만족합니다.</p>
              <div className="bento-author">
                <div className="bento-avatar">💻</div>
                <div>
                  <div className="bento-author-name">윤서진</div>
                  <div className="bento-author-role">B2B 제조기업 마케팅 리드</div>
                </div>
                <div className="bento-quote-logo"><div className="bento-logo-placeholder">로고 영역</div></div>
              </div>
            </div>
            <div className="bento-flip bento-span2" data-href="#">
              <div className="bento-flip-inner">
                <div className="bento-front" style={{background:'#FEF08A'}}>
                  <div className="bento-stat-num">10<span style={{fontSize:32,fontWeight:700}}>h</span></div>
                  <div className="bento-stat-label">주당 SEO 업무 절약</div>
                  <div className="bento-logo-slot"><div className="bento-logo-placeholder">로고 영역</div></div>
                </div>
                <div className="bento-back">
                  <p className="bento-back-desc">AI 자동화로 절약된 주당 평균 SEO 작업 시간. 그 시간을 핵심 비즈니스에 다시 투자하세요.</p>
                  <a href="#results" className="bento-back-link">사례 보기 →</a>
                </div>
              </div>
            </div>
            <div className="bento-flip bento-span2" data-href="#">
              <div className="bento-flip-inner">
                <div className="bento-front" style={{background:'#FBCFE8'}}>
                  <div className="bento-stat-num">3x</div>
                  <div className="bento-stat-label">고객 문의 증가</div>
                  <div className="bento-logo-slot"><div className="bento-logo-placeholder">로고 영역</div></div>
                </div>
                <div className="bento-back">
                  <p className="bento-back-desc">SEO 최적화 후 평균 고객 문의 증가율. 검색으로 찾아오는 고객은 전환율도 높습니다.</p>
                  <a href="#results" className="bento-back-link">사례 보기 →</a>
                </div>
              </div>
            </div>
            {/* ROW 3: stat(lavender) | stat(pink) | quote */}
            <div className="bento-flip bento-span2" data-href="#">
              <div className="bento-flip-inner">
                <div className="bento-front" style={{background:'#DDD6FE'}}>
                  <div className="bento-stat-num">1+1</div>
                  <div className="bento-stat-label">추가디렉토리마케팅 제공</div>
                  <div className="bento-logo-slot"><div className="bento-logo-placeholder">로고 영역</div></div>
                </div>
                <div className="bento-back">
                  <p className="bento-back-desc">10개 이상 가입한 카테고리의 업종은 추가 디렉토리 사이트로 SEO관리를 지원해드립니다.</p>
                  <a href="#results" className="bento-back-link">사례 보기 →</a>
                </div>
              </div>
            </div>
            <div className="bento-flip bento-span2" data-href="#">
              <div className="bento-flip-inner">
                <div className="bento-front" style={{background:'#FBCFE8'}}>
                  <div className="bento-stat-num">94<span style={{fontSize:32,fontWeight:700}}>점</span></div>
                  <div className="bento-stat-label">평균 SEO 점수</div>
                  <div className="bento-logo-slot"><div className="bento-logo-placeholder">로고 영역</div></div>
                </div>
                <div className="bento-back">
                  <p className="bento-back-desc">AISEO AI 최적화 적용 후 고객 사이트의 평균 SEO 점수. 업계 평균(58점) 대비 월등한 수치입니다.</p>
                  <a href="#results" className="bento-back-link">사례 보기 →</a>
                </div>
              </div>
            </div>
            <div className="bento-quote bento-span3">
              <p className="bento-quote-text">프리랜서로 일하면서 영업이 가장 힘들었는데, AISEO로 포트폴리오 사이트 최적화하고 나서 매달 안정적으로 클라이언트가 검색으로 들어와요.</p>
              <div className="bento-author">
                <div className="bento-avatar">🎨</div>
                <div>
                  <div className="bento-author-name">이수아</div>
                  <div className="bento-author-role">브랜딩 디자이너</div>
                </div>
                <div className="bento-quote-logo"><div className="bento-logo-placeholder">로고 영역</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ENTRY SERVICE — 핵심 진입 서비스 */}
      <section className="entry-section">
        <div className="entry-inner reveal">
          <div className="entry-eyebrow">핵심 진입 서비스</div>
          <h2 className="entry-h2">AI로 만든 홈페이지,<br/>오늘 바로 공개하세요</h2>
          <p className="entry-sub">
            드래그&amp;드롭 한 번으로 배포까지. 5분이면 됩니다.<br/>
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
            <button className="entry-price-btn" onClick={() => setConsultOpen(true)}>배포 교육 신청하기 →</button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="cta-section">
        <div className="cta-inner reveal">
          <div className="section-eyebrow" style={{textAlign:'center'}}>GET STARTED FREE</div>
          <h2 className="cta-h2">지금 바로 시작하세요</h2>
          <p className="cta-sub">지금 AI시대에 맞춘 온라인 마케팅을 시작하세요.<br/>1시간이면 첫 번째 SEO 최적화 웹사이트가 완성됩니다.</p>
          <div className="cta-row">
            <a href="/course2026" className="btn-primary-lg">지금 시작하기 →</a>
          </div>
          <p style={{marginTop:20,fontSize:13,color:'var(--text-muted)'}}>✓ 사업자만 신청가능 · ✓ 12개월 사이트를 한번만 결제 · ✓ 업종별 컨설팅 포함</p>
        </div>
      </div>

      {/* BLOG/NEWS — real featured posts from backend (Phase 7) */}
      <LandingBlogSection />

      {/* FOOTER */}
      <SiteFooter />

      <ConsultationWidget open={consultOpen} onClose={() => setConsultOpen(false)} />

      {newsletterPersona && ReactDOM.createPortal(
        <div
          className="nl-modal-ov"
          onClick={(e) => { if (e.target === e.currentTarget) closeNewsletterModal(); }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="nl-modal-title"
        >
          <div className="nl-modal">
            <button type="button" className="nl-modal-x" onClick={closeNewsletterModal} aria-label="닫기">×</button>
            <div className="nl-modal-icon">🚧</div>
            <h3 id="nl-modal-title" className="nl-modal-title">준비 중입니다</h3>
            <p className="nl-modal-sub">
              {PERSONA_LABEL[newsletterPersona]} 솔루션 페이지를 준비하고 있어요.<br />
              가장 먼저 출시 소식을 받아보시려면 이메일을 남겨주세요.
            </p>
            {newsletterStatus === 'success' ? (
              <div className="nl-modal-success">
                <div className="nl-modal-success-icon">✓</div>
                <p className="nl-modal-success-msg">구독이 완료되었습니다. 출시되면 가장 먼저 알려드릴게요.</p>
                <button type="button" className="nl-modal-btn" onClick={closeNewsletterModal}>닫기</button>
              </div>
            ) : (
              <form onSubmit={submitNewsletter} className="nl-modal-form">
                <input
                  type="email"
                  className="nl-modal-input"
                  placeholder="you@example.com"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  required
                  autoFocus
                  disabled={newsletterStatus === 'submitting'}
                />
                {newsletterError && (
                  <div className="nl-modal-err" role="alert">{newsletterError}</div>
                )}
                <button
                  type="submit"
                  className="nl-modal-btn"
                  disabled={newsletterStatus === 'submitting' || !newsletterEmail.trim()}
                >
                  {newsletterStatus === 'submitting' ? '제출 중…' : '뉴스레터 구독하기'}
                </button>
                <p className="nl-modal-hint">스팸 없이 출시·업데이트 소식만 보내드려요.</p>
              </form>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
