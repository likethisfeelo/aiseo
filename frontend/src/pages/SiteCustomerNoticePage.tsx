import type { UserProfile } from '../types';
import { KAKAO_CHAT_URL } from '../constants/contact';
import { APP_ENV } from '../config.js';
import { tokenStore } from '../auth.js';

interface Props {
  user: UserProfile;
  onLogout: () => void;
}

// site-customer 등급(apex 결제 완료) 사용자가 site.aiseo.tips 에 진입했을 때 표시.
// site 의 풀 대시보드는 paid_member 전용이라, site-customer 만 가진 사용자에게는
// "계정·구매 내역은 aiseo.tips 에서 확인" 안내 + apex 포털 진입점만 노출.
// (docs/membership-260602.md §4 의 사이트 도메인 권한 매트릭스)
export function SiteCustomerNoticePage({ user, onLogout }: Props) {
  const apexUrl = APP_ENV === 'prod' ? 'https://aiseo.tips' : 'https://dev.aiseo.tips';
  // ⚠️ TEMP: site → apex 토큰 hash bridge.
  // localStorage 는 origin 분리라 site.aiseo.tips 의 idToken 이 apex 에선
  // 안 보임. P-5 (HttpOnly Domain=.aiseo.tips 쿠키) 가 들어오기 전까지는
  // CTA 클릭 시 URL hash 로 토큰을 한 번 동봉해 apex /account.html 이
  // 자기 origin localStorage 로 옮겨 담도록 함. hash 는 서버 로그엔 안 남지만
  // 브라우저 히스토리에 노출되므로 운영 전 반드시 제거 → 쿠키 SSO 로 대체.
  const idToken = tokenStore.getIdToken();
  const accessToken = tokenStore.getAccessToken();
  const portalUrl = idToken
    ? `${apexUrl}/account.html#it=${encodeURIComponent(idToken)}${accessToken ? `&at=${encodeURIComponent(accessToken)}` : ''}`
    : `${apexUrl}/account.html`;

  return (
    <div className="scn-page">
      <style>{styles}</style>
      <div className="scn-card">
        <div className="scn-logo">AISEO</div>
        <div className="scn-emoji">📚</div>
        <h1 className="scn-title">구매하신 콘텐츠는 AISEO.TIPS 에서 확인하세요</h1>
        <p className="scn-sub">
          이 화면(site.aiseo.tips)은 사이트 직접 관리용 대시보드 전용입니다.<br />
          PDF·구매 콘텐츠·결제 이력은 메인 사이트의 내 계정에서 보실 수 있어요.
        </p>

        <div className="scn-features">
          <div className="scn-feature">
            <span className="scn-feature-icon">📄</span>
            <div>
              <div className="scn-feature-title">구매한 PDF · 콘텐츠</div>
              <div className="scn-feature-desc">결제하신 모든 자료를 모아서 다운로드</div>
            </div>
          </div>
          <div className="scn-feature">
            <span className="scn-feature-icon">🧾</span>
            <div>
              <div className="scn-feature-title">결제 · 환불 내역</div>
              <div className="scn-feature-desc">주문 상태와 영수증을 한 곳에서 관리</div>
            </div>
          </div>
          <div className="scn-feature">
            <span className="scn-feature-icon">📰</span>
            <div>
              <div className="scn-feature-title">멤버 전용 콘텐츠</div>
              <div className="scn-feature-desc">블로그 전체 열람 + 뉴스레터 구독</div>
            </div>
          </div>
        </div>

        <a
          href={portalUrl}
          className="scn-cta-primary"
        >
          AISEO.TIPS 내 계정으로 이동 →
        </a>

        <a
          href={KAKAO_CHAT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="scn-cta-secondary"
        >
          사이트 관리 기능이 필요하신가요? 1:1 상담
        </a>

        <div className="scn-footer">
          <span className="scn-account">
            로그인 계정 · <strong>{user.email || user.username}</strong>
          </span>
          <button type="button" className="scn-logout" onClick={onLogout}>
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = `
.scn-page {
  min-height: 100vh;
  background: linear-gradient(140deg, #f8fafc 0%, #eef2ff 100%);
  display: flex; align-items: center; justify-content: center;
  padding: 32px 20px;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
}
.scn-card {
  width: 100%; max-width: 520px;
  background: #fff; border-radius: 24px;
  padding: 40px 32px 28px;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
  text-align: center;
}
.scn-logo {
  font-size: 12px; font-weight: 800; letter-spacing: 0.18em;
  color: #6366f1; margin-bottom: 18px;
}
.scn-emoji { font-size: 44px; line-height: 1; margin-bottom: 10px; }
.scn-title {
  margin: 0 0 12px; font-size: 22px; font-weight: 800;
  color: #0f172a; letter-spacing: -0.01em; line-height: 1.4;
}
.scn-sub {
  margin: 0 0 28px; font-size: 14px; line-height: 1.7;
  color: #475569;
}
.scn-features {
  display: flex; flex-direction: column; gap: 12px;
  background: #f8fafc; border-radius: 14px;
  padding: 18px 18px 16px;
  margin-bottom: 24px; text-align: left;
}
.scn-feature { display: flex; gap: 12px; align-items: flex-start; }
.scn-feature-icon { font-size: 22px; line-height: 1.4; flex: 0 0 auto; }
.scn-feature-title {
  font-size: 14px; font-weight: 700; color: #0f172a;
  margin-bottom: 2px;
}
.scn-feature-desc { font-size: 12px; color: #64748b; line-height: 1.55; }
.scn-cta-primary {
  display: inline-flex; align-items: center; justify-content: center;
  width: 100%; box-sizing: border-box;
  height: 52px; padding: 0 20px;
  border-radius: 12px; text-decoration: none;
  background: #6366f1; color: #fff;
  font-size: 15px; font-weight: 700;
  transition: transform 0.1s, box-shadow 0.15s, background 0.15s;
}
.scn-cta-primary:hover {
  transform: translateY(-1px);
  background: #4f46e5;
  box-shadow: 0 10px 24px rgba(99, 102, 241, 0.35);
}
.scn-cta-secondary {
  display: block; margin-top: 12px;
  font-size: 13px; color: #64748b;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.scn-cta-secondary:hover { color: #334155; }
.scn-footer {
  margin-top: 28px; padding-top: 18px;
  border-top: 1px solid #e2e8f0;
  display: flex; flex-direction: column; gap: 10px;
  align-items: center;
  font-size: 12px; color: #64748b;
}
.scn-account strong { color: #334155; font-weight: 700; }
.scn-logout {
  border: 1px solid #e2e8f0; background: #fff;
  padding: 8px 18px; border-radius: 8px;
  font: inherit; font-size: 13px; color: #475569;
  cursor: pointer; transition: background 0.15s, border-color 0.15s;
}
.scn-logout:hover { background: #f1f5f9; border-color: #cbd5e1; }
`;
