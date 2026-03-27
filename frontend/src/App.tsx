import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { selectSite } from './api';
import { tokenStore } from './auth.js';
import { ForgotPasswordPage, LoginPage, SignupPage } from './auth-pages';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { EducationDrawer } from './components/education/EducationDrawer';
import { BrandPage } from './pages/BrandPage';
import { ProductPage } from './pages/ProductPage';
import { ServicePage } from './pages/ServicePage';
import { StorePage } from './pages/StorePage';
import { SiteManagementPage } from './pages/SiteManagementPage';
import { RoadmapPage } from './pages/RoadmapPage';

const PAGE_TITLES: Record<string, string> = {
  '/brand': '브랜드 관리',
  '/products': '상품 관리',
  '/services': '서비스 관리',
  '/store': '매장 관리',
  '/site': '사이트 관리',
  '/roadmap': '성장 로드맵',
};

function PageTitleProvider({ children, setPageTitle }: { children: React.ReactNode; setPageTitle: (t: string) => void }) {
  const location = useLocation();
  useEffect(() => {
    setPageTitle(PAGE_TITLES[location.pathname] || '대시보드');
  }, [location.pathname, setPageTitle]);
  return <>{children}</>;
}

/* ── Landing page for unauthenticated users ── */
function LandingPage({ authError }: { authError: string }) {
  return (
    <div style={{ maxWidth: 640, margin: '40px auto', fontFamily: 'system-ui, sans-serif', padding: '0 20px' }}>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>AISEO</h1>
      <p style={{ fontSize: 15, color: '#2563eb', marginBottom: 24, fontWeight: 500 }}>
        AI 웹사이트를 SEO 최적화하고, 한 번에 배포하세요. (v2)
      </p>

      {authError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, marginBottom: 16, color: '#dc2626' }}>
          {authError}
        </div>
      )}

      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <p style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>서비스 이용 흐름</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { num: '1', text: '회원가입 및 로그인' },
            { num: '2', text: '내 사이트 주소 선택 (예: my-shop.aiseo.tips)' },
            { num: '3', text: 'AI로 만든 웹사이트 ZIP 파일 업로드' },
            { num: '4', text: 'SEO 자동 검증 (검색엔진 최적화 체크)' },
            { num: '5', text: '원클릭 배포 — 즉시 접속 가능한 나만의 사이트 완성' },
          ].map((item) => (
            <div key={item.num} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                {item.num}
              </span>
              <span style={{ fontSize: 14, color: '#334155' }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: 16, marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: '#1e40af', lineHeight: 1.6 }}>
          AISEO는 AI로 제작한 웹사이트의 SEO 상태를 자동으로 검증하고,
          Google/Naver 검색에 최적화된 상태로 배포해 드립니다.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <a href="/?auth=signup" style={{ background: '#111827', color: '#fff', textDecoration: 'none', padding: '12px 24px', borderRadius: 8, fontWeight: 500, fontSize: 15 }}>
          회원가입
        </a>
        <a href="/?auth=login" style={{ background: '#2563eb', color: '#fff', textDecoration: 'none', padding: '12px 24px', borderRadius: 8, fontWeight: 500, fontSize: 15 }}>
          로그인
        </a>
      </div>
    </div>
  );
}

/* ── Site ID Selection (first-time setup) ── */
function SiteIdSetup({ onSiteSelected }: { onSiteSelected: (id: string) => void }) {
  const [siteIdInput, setSiteIdInput] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const siteIdValid = /^[a-z0-9-]{3,63}$/.test(siteIdInput.trim());

  const handleLock = async () => {
    const normalized = siteIdInput.trim();
    if (!normalized || !siteIdValid) return;

    if (!confirming) { setConfirming(true); return; }

    setConfirming(false);
    setLoading(true);
    try {
      const data = await selectSite({ siteId: normalized });
      onSiteSelected(data.siteId);
    } catch (e) {
      setError(e instanceof Error ? e.message : '사이트 주소 확정 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '60px auto', fontFamily: 'system-ui, sans-serif', padding: '0 20px' }}>
      <h2 style={{ fontSize: 20, marginBottom: 8 }}>내 사이트 주소 선택</h2>
      <p style={{ color: '#9a3412', fontSize: 13, marginBottom: 16 }}>한번 확정하면 변경할 수 없습니다. 신중하게 선택해 주세요.</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          value={siteIdInput}
          onChange={(e) => { setSiteIdInput(e.target.value.toLowerCase()); setConfirming(false); }}
          placeholder="my-site"
          style={{ flex: 1, padding: 10, border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
        />
        <button onClick={handleLock} disabled={loading || (!confirming && !siteIdValid)} style={{
          background: confirming ? '#dc2626' : '#ea580c', color: '#fff', border: 'none',
          borderRadius: 6, padding: '10px 20px', cursor: 'pointer', fontSize: 14, whiteSpace: 'nowrap',
        }}>
          {loading ? '확정 중...' : confirming ? '정말 확정' : '주소 확정'}
        </button>
      </div>

      {siteIdInput.trim() && (
        <p style={{ fontSize: 13, color: siteIdValid ? '#065f46' : '#dc2626', margin: '4px 0' }}>
          {siteIdValid ? `https://${siteIdInput.trim()}.aiseo.tips` : '영문 소문자, 숫자, 하이픈(-) 3~63자만 가능합니다.'}
        </p>
      )}

      {confirming && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: 10, marginTop: 8, fontSize: 13, color: '#dc2626' }}>
          <strong>https://{siteIdInput.trim()}.aiseo.tips</strong> 로 확정하시겠습니까? "정말 확정" 버튼을 다시 눌러주세요.
        </div>
      )}

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, marginTop: 12, color: '#dc2626' }}>{error}</div>
      )}
    </div>
  );
}

/* ── Main App ── */
export default function App() {
  const [authPage] = useState<string | null>(
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('auth') : null
  );

  const { user, loading: meLoading, error: authError, handleLoginSuccess, logout } = useAuth();
  const [siteId, setSiteId] = useState('');
  const [pageTitle, setPageTitle] = useState('대시보드');
  const [educationOpen, setEducationOpen] = useState(false);

  // Try to get siteId from user profile or local storage
  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem('aiseo.siteId');
      if (stored) setSiteId(stored);
    }
  }, [user]);

  const handleSiteSelected = (id: string) => {
    setSiteId(id);
    localStorage.setItem('aiseo.siteId', id);
  };

  // Auth pages
  if (authPage === 'login') return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  if (authPage === 'signup') return <SignupPage />;
  if (authPage === 'forgot-password') return <ForgotPasswordPage />;

  // Loading
  if (meLoading) {
    return (
      <div style={{ maxWidth: 640, margin: '40px auto', fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: '60px 20px', color: '#666' }}>
        로그인 상태 확인 중...
      </div>
    );
  }

  // Not logged in
  if (!user) return <LandingPage authError={authError} />;

  // No site selected yet
  if (!siteId) return <SiteIdSetup onSiteSelected={handleSiteSelected} />;

  // Authenticated dashboard
  return (
    <BrowserRouter>
      <PageTitleProvider setPageTitle={setPageTitle}>
        <DashboardLayout
          user={user}
          siteId={siteId}
          siteOnline={true}
          brandCompleteness={30}
          stageProgress={20}
          pageTitle={pageTitle}
          onLogout={logout}
          onToggleEducation={() => setEducationOpen((o) => !o)}
        >
          <Routes>
            <Route path="/brand" element={<BrandPage siteId={siteId} />} />
            <Route path="/products" element={<ProductPage siteId={siteId} />} />
            <Route path="/services" element={<ServicePage siteId={siteId} />} />
            <Route path="/store" element={<StorePage siteId={siteId} />} />
            <Route path="/site" element={<SiteManagementPage siteId={siteId} />} />
            <Route path="/roadmap" element={<RoadmapPage />} />
            <Route path="*" element={<Navigate to="/brand" replace />} />
          </Routes>
        </DashboardLayout>
        <EducationDrawer open={educationOpen} onClose={() => setEducationOpen(false)} />
      </PageTitleProvider>
    </BrowserRouter>
  );
}
