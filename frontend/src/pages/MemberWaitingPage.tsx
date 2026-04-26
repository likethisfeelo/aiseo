import type { UserProfile } from '../types';
import { KAKAO_CHAT_URL } from '../constants/contact';

interface Props {
  user: UserProfile;
  onLogout: () => void;
}

export function MemberWaitingPage({ user, onLogout }: Props) {
  return (
    <div className="mw-page">
      <style>{styles}</style>
      <div className="mw-card">
        <div className="mw-logo">AISEO</div>
        <div className="mw-emoji">🚧</div>
        <h1 className="mw-title">유료 회원 전환 후 이용 가능합니다</h1>
        <p className="mw-sub">
          AISEO에 가입해주셔서 감사합니다.<br />
          서비스는 유료 회원으로 등급 변경 후 이용하실 수 있어요.
        </p>

        <div className="mw-features">
          <div className="mw-feature">
            <span className="mw-feature-icon">🤖</span>
            <div>
              <div className="mw-feature-title">AI 홈페이지 자동 제작</div>
              <div className="mw-feature-desc">업종·키워드만 입력하면 SEO 최적화된 사이트가 완성</div>
            </div>
          </div>
          <div className="mw-feature">
            <span className="mw-feature-icon">🔍</span>
            <div>
              <div className="mw-feature-title">검색 노출 자동 점검</div>
              <div className="mw-feature-desc">메타·구조·랭킹을 매주 자동으로 분석해 리포트로 알림</div>
            </div>
          </div>
          <div className="mw-feature">
            <span className="mw-feature-icon">📈</span>
            <div>
              <div className="mw-feature-title">유입·전환 데이터 통합</div>
              <div className="mw-feature-desc">GA·Search Console·네이버 데이터를 한 곳에서 확인</div>
            </div>
          </div>
        </div>

        <a
          href={KAKAO_CHAT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mw-cta"
        >
          <span className="mw-cta-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.48 3 2 6.58 2 11c0 2.74 1.74 5.16 4.4 6.62l-1.06 3.92c-.1.36.27.65.59.46l4.62-2.78c.47.06.94.1 1.45.1 5.52 0 10-3.58 10-8 0-4.42-4.48-8-10-8z"/></svg>
          </span>
          카카오톡으로 1:1 상담하기
        </a>
        <p className="mw-hint">유료 회원 전환 안내를 받으실 수 있습니다.</p>

        <div className="mw-footer">
          <span className="mw-account">
            로그인 계정 · <strong>{user.email || user.username}</strong>
          </span>
          <button type="button" className="mw-logout" onClick={onLogout}>
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = `
.mw-page {
  min-height: 100vh;
  background: linear-gradient(140deg, #f8fafc 0%, #eef2ff 100%);
  display: flex; align-items: center; justify-content: center;
  padding: 32px 20px;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
}
.mw-card {
  width: 100%; max-width: 520px;
  background: #fff; border-radius: 24px;
  padding: 40px 32px 28px;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
  text-align: center;
}
.mw-logo {
  font-size: 12px; font-weight: 800; letter-spacing: 0.18em;
  color: #6366f1; margin-bottom: 18px;
}
.mw-emoji { font-size: 44px; line-height: 1; margin-bottom: 10px; }
.mw-title {
  margin: 0 0 12px; font-size: 22px; font-weight: 800;
  color: #0f172a; letter-spacing: -0.01em; line-height: 1.4;
}
.mw-sub {
  margin: 0 0 28px; font-size: 14px; line-height: 1.7;
  color: #475569;
}
.mw-features {
  display: flex; flex-direction: column; gap: 12px;
  background: #f8fafc; border-radius: 14px;
  padding: 18px 18px 16px;
  margin-bottom: 24px; text-align: left;
}
.mw-feature { display: flex; gap: 12px; align-items: flex-start; }
.mw-feature-icon { font-size: 22px; line-height: 1.4; flex: 0 0 auto; }
.mw-feature-title {
  font-size: 14px; font-weight: 700; color: #0f172a;
  margin-bottom: 2px;
}
.mw-feature-desc { font-size: 12px; color: #64748b; line-height: 1.55; }
.mw-cta {
  display: inline-flex; align-items: center; justify-content: center;
  gap: 8px; width: 100%; box-sizing: border-box;
  height: 52px; padding: 0 20px;
  border-radius: 12px; text-decoration: none;
  background: #FEE500; color: #181600;
  font-size: 15px; font-weight: 700;
  transition: transform 0.1s, box-shadow 0.15s;
}
.mw-cta:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(254, 229, 0, 0.45);
}
.mw-cta-icon { display: inline-flex; }
.mw-hint {
  margin: 10px 0 0; font-size: 12px; color: #94a3b8;
}
.mw-footer {
  margin-top: 28px; padding-top: 18px;
  border-top: 1px solid #e2e8f0;
  display: flex; flex-direction: column; gap: 10px;
  align-items: center;
  font-size: 12px; color: #64748b;
}
.mw-account strong { color: #334155; font-weight: 700; }
.mw-logout {
  border: 1px solid #e2e8f0; background: #fff;
  padding: 8px 18px; border-radius: 8px;
  font: inherit; font-size: 13px; color: #475569;
  cursor: pointer; transition: background 0.15s, border-color 0.15s;
}
.mw-logout:hover { background: #f1f5f9; border-color: #cbd5e1; }
`;
