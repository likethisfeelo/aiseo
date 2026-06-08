// ============================================================
// SiteFooter — the full marketing-site footer.
// ------------------------------------------------------------
// Extracted from LandingPage so site.aiseo.tips and every
// /events2026 page render an identical footer. Relies on the
// .footer-* / .hero-bg rules in landing.css, which every page that
// uses this component already imports.
// ============================================================

import { KAKAO_CHANNEL_URL, KAKAO_CHAT_URL } from '../constants/contact';

export function SiteFooter() {
  return (
    <footer>
      <div className="hero-bg" style={{ position: 'absolute', inset: 0, zIndex: 0 }}></div>
      <div className="footer-inner">
        <div className="footer-cta">
          <div className="footer-cta-label">지금 시작하세요</div>
          <h2>온라인마케팅의 시작<br /><span>AISEO.TIPS</span></h2>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/course2026#diagnosis" className="btn-primary-lg" style={{ fontSize: 16, padding: '16px 36px' }}>서비스 신청하기 →</a>
            <a
              href={KAKAO_CHAT_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.75)', textDecoration: 'none', padding: '16px 28px', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 12, backdropFilter: 'blur(8px)' }}
            >
              1:1 상담문의
            </a>
          </div>
        </div>
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo">AISEO</div>
            <p>시작부터 분석까지 AISEO에서 모두 함께 시작하세요.</p>
          </div>
          <div className="footer-col">
            <h5>제품</h5>
            <a href="#">AI 웹빌더</a>
            <a href="#">SEO 자동화</a>
            <a href="#">콘텐츠 생성</a>
            <a href="#">성과 분석</a>
            <a href="#">요금제</a>
          </div>
          <div className="footer-col">
            <h5>리소스</h5>
            <a href="#">블로그</a>
            <a href="#">가이드</a>
            <a href="#">성공 사례</a>
            <a href="#">도움말</a>
            <a href="#">API</a>
          </div>
          <div className="footer-col">
            <h5>회사</h5>
            <a href="#">소개</a>
            <a href="#">채용</a>
            <a href="#">파트너</a>
            <a href="#">문의</a>
          </div>
        </div>
        <div className="footer-mobile">
          <div className="footer-logo" style={{ marginBottom: 4 }}>AISEO</div>
          <p className="footer-mobile-desc">AI로 만들고, 검색에서 찾히는 비즈니스.</p>
          <details className="footer-acc">
            <summary>제품</summary>
            <div className="footer-acc-links">
              <a href="#">AI 웹빌더</a><a href="#">SEO 자동화</a>
              <a href="#">콘텐츠 생성</a><a href="#">요금제</a>
            </div>
          </details>
          <details className="footer-acc">
            <summary>리소스</summary>
            <div className="footer-acc-links">
              <a href="#">블로그</a><a href="#">가이드</a>
              <a href="#">성공 사례</a><a href="#">도움말</a>
            </div>
          </details>
          <details className="footer-acc">
            <summary>회사</summary>
            <div className="footer-acc-links">
              <a href="#">소개</a><a href="#">채용</a>
              <a href="#">파트너</a><a href="#">문의</a>
            </div>
          </details>
        </div>
        <div className="footer-sns">
          <a
            href={KAKAO_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-sns-link footer-sns-kakao"
            aria-label="카카오톡 채널"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 3C6.48 3 2 6.58 2 11c0 2.74 1.74 5.16 4.4 6.62l-1.06 3.92c-.1.36.27.65.59.46l4.62-2.78c.47.06.94.1 1.45.1 5.52 0 10-3.58 10-8 0-4.42-4.48-8-10-8z" />
            </svg>
            <span>카카오톡 채널</span>
          </a>
        </div>
        <div className="footer-bottom">
          <span>&copy; 2026 AISEO. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 24 }}>
            <a href="#">개인정보처리방침</a>
            <a href="#">이용약관</a>
            <a href="#">쿠키 정책</a>
          </div>
        </div>
        <div className="footer-legal">
          크리다 · 사업자등록번호 231-88-03647 · 충청남도 천안시 서북구 월봉로 126, 9층 901호 C27(쌍용동, 대림프라자) · 개인정보책임자 김경진 <a href="mailto:jin@k-rida.com">jin@k-rida.com</a>
        </div>
      </div>
    </footer>
  );
}
