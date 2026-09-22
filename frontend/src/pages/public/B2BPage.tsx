import { useEffect, useState } from 'react';
import '../landing.css';
import './b2b.css';
import { useSubPageNav } from './useSubPageNav';
import { SiteFooter } from '../../components/SiteFooter';
import { B2BConsultWidget } from '../../components/B2BConsultWidget';

export function B2BPage() {
  useSubPageNav();
  const [consultOpen, setConsultOpen] = useState(false);

  // Scroll-reveal — mirrors LandingPage so sections fade up into view
  // the same way the rest of the marketing site does.
  useEffect(() => {
    const reveals = document.querySelectorAll('.b2bpage .reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const openWidget = () => {
    // Close the mobile menu if it's open before showing the modal.
    document.getElementById('navMobileMenu')?.classList.remove('open');
    document.getElementById('navHamburger')?.classList.remove('open');
    document.body.style.overflow = '';
    setConsultOpen(true);
  };

  return (
    <>
      <title>B2B 성과 기반 인바운드 마케팅 | AISEO</title>
      <meta
        name="description"
        content="성과가 나야 잔금을 냅니다. 온라인 마케팅에 손대지 못한 기업을 위한 풀서비스 — 현황 진단·SEO·분석 세팅까지 구축하고, 2년 내 인바운드 매출이 발생하면 잔금을 정산합니다. 업종 소분류 기준 50개 슬롯 한정."
      />
      <link rel="canonical" href="https://b2b.aiseo.tips/" />

      {/* ── NAV (shared AISEO chrome) ── */}
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
                <a href="/events2026/snap" role="menuitem">사진스냅 이벤트</a>
                <a href="/events2026/pet" role="menuitem">반려동물 서비스 이벤트</a>
              </div>
            </div>
            <a href="/blog">블로그</a>
          </div>
          <div className="nav-cta">
            <button type="button" className="btn-primary" onClick={openWidget}>도입 문의</button>
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
          <a href="/events2026/snap" className="nmm-link nmm-sublink">└ 사진스냅 이벤트</a>
          <a href="/events2026/pet" className="nmm-link nmm-sublink">└ 반려동물 서비스 이벤트</a>
          <a href="/blog" className="nmm-link">블로그</a>
        </nav>
        <div className="nmm-cta">
          <button type="button" className="nmm-btn-primary" onClick={openWidget}>도입 문의</button>
        </div>
      </div>

      <div className="b2bpage">
        {/* ── HERO ── */}
        <section className="b2b-hero">
          <div className="hero-bg"></div>
          <div className="hero-grid-line"></div>
          <div className="b2b-hero-inner">
            <div>
              <div className="hero-tag">B2B 성과 기반 인바운드 마케팅</div>
              <h1>성과가 나야<br /><em>잔금</em>을 냅니다</h1>
              <p className="b2b-hero-sub">
                기술력은 있지만 온라인 마케팅에 신경 쓸 여력이 없는 기업을 위한 풀서비스입니다.
                인바운드 매출이 실제로 발생해야 잔금을 정산합니다.
              </p>
              <div className="b2b-hero-features">
                <div className="b2b-hero-feat">온라인 마케팅 현황 진단 &amp; 전략 수립</div>
                <div className="b2b-hero-feat">홈페이지 SEO · 검색 노출 최적화</div>
                <div className="b2b-hero-feat">GA4 · 서치콘솔 · 광고 세팅 전체 구축</div>
                <div className="b2b-hero-feat">월간 데이터 리뷰 &amp; 개선 피드백</div>
                <div className="b2b-hero-feat">2년 내 인바운드 매출 발생 시 잔금 정산</div>
              </div>
              <div className="hero-cta-row">
                <a className="b2b-btn-primary" href="#offer">오퍼 구조 확인하기 ↓</a>
                <button type="button" className="b2b-btn-ghost" onClick={openWidget}>바로 문의하기</button>
              </div>
            </div>
            <div className="hero-art">
              <img
                src="/images/principle-5-hand.png"
                alt="이리데센트 프리즘을 향해 뻗은 손 — 성과 기반 마케팅 파트너십"
              />
            </div>
          </div>
        </section>

        {/* ── OFFER ── */}
        <section className="offer-section" id="offer">
          <div className="offer-section-inner reveal">
            <div className="offer-section-header">
              <div className="eyebrow">Pricing Structure</div>
              <h2 className="offer-section-title">B2B 성과 기반 오퍼 구조</h2>
            </div>
            <div className="offer-box">
              <div className="offer-row">
                <span className="offer-label">선납금 (착수 시)</span>
                <span className="offer-value">500만원</span>
              </div>
              <div className="offer-row">
                <span className="offer-label">잔금 (성과 발생 시)</span>
                <span className="offer-value">1,500만원</span>
              </div>
              <div className="offer-row">
                <span className="offer-label">총 서비스 비용</span>
                <span className="offer-value small">2,000만원</span>
              </div>
              <div className="offer-note">
                * 잔금은 인바운드 매출이 실제로 발생한 경우에만 청구됩니다.<br />
                * 2년 내 성과 미달 시 잔금 청구 없이 프로젝트가 종료됩니다.<br />
                * 업종 소분류 기준 중복 없이 최대 50개 슬롯 한정 운영합니다.
              </div>
              <button type="button" className="b2b-btn-primary offer-cta" onClick={openWidget}>도입 문의하기 →</button>
            </div>
          </div>
        </section>

        {/* ── WHY ── */}
        <section className="b2b-why">
          <div className="b2b-why-inner reveal">
            <div className="b2b-why-header">
              <div className="eyebrow">Why AISEO</div>
              <div className="b2b-why-title">왜 AISEO인가</div>
            </div>
            <div className="why-cards">
              <div className="why-card">
                <div className="why-card-num">01</div>
                <div className="why-card-title">성과 없으면 잔금 없음</div>
                <div className="why-card-desc">인바운드 매출이 실제로 발생해야 잔금을 정산합니다. 성과가 나지 않으면 선납금만으로 프로젝트가 종료됩니다. 리스크는 우리가 먼저 집니다.</div>
              </div>
              <div className="why-card">
                <div className="why-card-num">02</div>
                <div className="why-card-title">업종 독점 슬롯 운영</div>
                <div className="why-card-desc">업종 소분류 기준으로 중복 없이 최대 50개 슬롯만 운영합니다. 동일 업종 내 경쟁사를 동시에 맡지 않아 이해충돌 없이 집중할 수 있습니다.</div>
              </div>
              <div className="why-card">
                <div className="why-card-num">03</div>
                <div className="why-card-title">데이터 중심 의사결정</div>
                <div className="why-card-desc">GA4, 서치콘솔, 광고 매니저 데이터를 기반으로 전략을 세우고 성과를 측정합니다. 감이 아닌 숫자로 이야기합니다.</div>
              </div>
              <div className="why-card">
                <div className="why-card-num">04</div>
                <div className="why-card-title">원리에 맞는 기술 작업</div>
                <div className="why-card-desc">꼼수나 트릭 없이 검색엔진 원칙에 맞는 방식으로만 작업합니다. SEO에서 AEO(AI 검색)까지, 지금 효과 있는 방식만 적용합니다.</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STRUCTURE ── */}
        <section className="b2b-structure" id="b2b-structure">
          <div className="b2b-structure-inner reveal">
            <div className="b2b-structure-header">
              <div className="eyebrow">How It Works</div>
              <div className="b2b-structure-title">3단계 성과 기반 구조</div>
            </div>
            <div className="flow-steps">
              <div className="flow-step">
                <div className="flow-step-num">Step 01</div>
                <div className="flow-step-title">선납 · 착수</div>
                <div className="flow-step-amount">500만원</div>
                <div className="flow-step-desc">현황 진단, 전략 수립, 홈페이지 SEO 최적화, GA4 · 서치콘솔 · 광고 세팅 전체 구축까지 완료합니다.</div>
              </div>
              <div className="flow-step">
                <div className="flow-step-num">Step 02</div>
                <div className="flow-step-title">운영 · 최적화</div>
                <div className="flow-step-amount">0원</div>
                <div className="flow-step-desc">월간 데이터 리뷰, 검색 노출 개선, 콘텐츠 업데이트, 광고 최적화를 지속합니다. 추가 비용 없습니다.</div>
              </div>
              <div className="flow-step">
                <div className="flow-step-num">Step 03</div>
                <div className="flow-step-title">성과 발생 · 잔금</div>
                <div className="flow-step-amount">1,500만원</div>
                <div className="flow-step-desc">인바운드 매출이 실제로 발생하면 잔금을 정산합니다. 2년 내 성과 미달 시 잔금 청구 없이 종료됩니다.</div>
              </div>
            </div>

            <div className="risk-box">
              <div className="risk-icon">🛡️</div>
              <div className="risk-content">
                <div className="risk-title">리스크 리버설 — 성과 없으면 잔금 없음</div>
                <div className="risk-desc">2년 내 인바운드 매출이 발생하지 않으면 <strong>잔금 1,500만원은 청구되지 않습니다.</strong> 선납금 500만원으로 현황 진단, 전략 수립, SEO 최적화, 분석 도구 세팅까지 완료되므로, 성과가 나지 않더라도 기본 인프라는 그대로 남습니다.</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── ELIGIBILITY ── */}
        <section className="b2b-eligibility">
          <div className="b2b-eligibility-inner reveal">
            <div className="b2b-eligibility-header">
              <div className="eyebrow">Eligibility</div>
              <div className="b2b-eligibility-title">이런 기업에 적합합니다</div>
            </div>
            <div className="elig-cards">
              <div className="elig-card yes">
                <div className="elig-card-label yes">적합</div>
                <div className="elig-card-title">이런 기업이라면<br />함께할 수 있습니다</div>
                <div className="elig-list">
                  <div className="elig-item">기술력·제품력은 있지만 온라인 마케팅에 손을 못 대고 있는 기업</div>
                  <div className="elig-item">영업 중심으로 운영 중이나 온라인 인바운드 채널이 약한 곳</div>
                  <div className="elig-item">B2B 제조업, 전문 서비스업 등 고객 단가가 높은 업종</div>
                  <div className="elig-item">데이터 기반으로 의사결정하려는 의지가 있는 대표님</div>
                  <div className="elig-item">2년 이상 장기적 관점에서 온라인 채널을 구축하려는 기업</div>
                </div>
              </div>
              <div className="elig-card no">
                <div className="elig-card-label no">부적합</div>
                <div className="elig-card-title">이런 경우에는<br />맞지 않을 수 있습니다</div>
                <div className="elig-list">
                  <div className="elig-item">단기간에 폭발적인 매출 성장을 기대하는 경우</div>
                  <div className="elig-item">이미 온라인 마케팅 팀이 잘 운영되고 있는 기업</div>
                  <div className="elig-item">광고비만 태우면 바로 매출이 나길 원하는 경우</div>
                  <div className="elig-item">마케팅 과정에 전혀 관여하고 싶지 않은 경우</div>
                  <div className="elig-item">제품·서비스 자체의 경쟁력이 아직 검증되지 않은 초기 단계</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="b2b-final-cta">
          <div className="b2b-final-cta-bg"></div>
          <div className="b2b-final-cta-inner reveal">
            <div className="eyebrow" style={{ justifyContent: 'center' }}>지금 시작하기</div>
            <h2>성과가 증명될 때까지<br />리스크는 우리가 집니다</h2>
            <p>업종과 현재 상황을 알려주시면 슬롯 가용 여부와 예상 전략을 안내드립니다. 업종 소분류 기준 50개 한정이므로 빈 슬롯 확인이 우선입니다.</p>
            <div className="cta-btn-row">
              <button type="button" className="b2b-btn-primary" onClick={openWidget}>도입 문의하기 →</button>
              <a className="b2b-btn-ghost" href="/">AISEO 홈 보기</a>
            </div>
          </div>
        </section>

        <SiteFooter />
      </div>

      <B2BConsultWidget open={consultOpen} onClose={() => setConsultOpen(false)} />
    </>
  );
}
