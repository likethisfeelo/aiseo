import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { selectSite, getMe } from './api';
import { tokenStore } from './auth.js';
import { APP_ENV } from './config.js';

const BASE_DOMAIN = APP_ENV === 'prod' ? 'aiseo.tips' : 'dev.${BASE_DOMAIN}';
import { ForgotPasswordPage, LoginPage, SignupPage } from './auth-pages';
import { LandingPage } from './pages/LandingPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { EducationDrawer } from './components/education/EducationDrawer';
import { BrandPage } from './pages/BrandPage';
import { ProductPage } from './pages/ProductPage';
import { ServicePage } from './pages/ServicePage';
import { StorePage } from './pages/StorePage';
import { SiteManagementPage } from './pages/SiteManagementPage';
import { RoadmapPage } from './pages/RoadmapPage';
import { ComingSoonPage } from './pages/ComingSoonPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SeoStatusPage } from './pages/SeoStatusPage';
import { AdminSiteListPage } from './pages/admin/AdminSiteListPage';
import { AdminSiteDetailPage } from './pages/admin/AdminSiteDetailPage';

const PAGE_TITLES: Record<string, string> = {
  '/brand': '브랜드 관리',
  '/products': '상품 관리',
  '/services': '서비스 관리',
  '/store': '매장 관리',
  '/site/upload': '사이트 업로드',
  '/site/seo': 'SEO 검증',
  '/site/deployed': '배포된 사이트',
  '/seo-status': 'SEO 현황',
  '/analytics': '마케팅 분석',
  '/ads': '광고 관리',
  '/content': '콘텐츠 자동화',
  '/roadmap': '성장 로드맵',
  '/admin': '관리자',
};

function PageTitleProvider({ children, setPageTitle }: { children: React.ReactNode; setPageTitle: (t: string) => void }) {
  const location = useLocation();
  useEffect(() => {
    setPageTitle(PAGE_TITLES[location.pathname] || '대시보드');
  }, [location.pathname, setPageTitle]);
  return <>{children}</>;
}

/* LandingPage is now imported from ./pages/LandingPage */

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
          {siteIdValid ? `https://${siteIdInput.trim()}.${BASE_DOMAIN}` : '영문 소문자, 숫자, 하이픈(-) 3~63자만 가능합니다.'}
        </p>
      )}

      {confirming && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: 10, marginTop: 8, fontSize: 13, color: '#dc2626' }}>
          <strong>https://{siteIdInput.trim()}.${BASE_DOMAIN}</strong> 로 확정하시겠습니까? "정말 확정" 버튼을 다시 눌러주세요.
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
  const [authPage, setAuthPage] = useState<string | null>(
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('auth') : null
  );

  const { user, loading: meLoading, error: authError, handleLoginSuccess: _handleLoginSuccess, logout } = useAuth();

  const handleLoginSuccess = async () => {
    await _handleLoginSuccess();
    setAuthPage(null);
  };
  const [siteId, setSiteId] = useState('');
  const [pageTitle, setPageTitle] = useState('대시보드');
  const [educationOpen, setEducationOpen] = useState(false);

  // Get siteId: server first, then localStorage fallback
  useEffect(() => {
    if (!user) return;
    // Try server-side siteId (from /me response)
    getMe().then((data: { siteId?: string }) => {
      if (data.siteId) {
        setSiteId(data.siteId);
        localStorage.setItem('aiseo.siteId', data.siteId);
      } else {
        const stored = localStorage.getItem('aiseo.siteId');
        if (stored) setSiteId(stored);
      }
    }).catch(() => {
      const stored = localStorage.getItem('aiseo.siteId');
      if (stored) setSiteId(stored);
    });
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
            <Route path="/site/upload" element={<SiteManagementPage siteId={siteId} initialFocus="left" />} />
            <Route path="/site/seo" element={<SiteManagementPage siteId={siteId} initialFocus="center" />} />
            <Route path="/site/deployed" element={<SiteManagementPage siteId={siteId} initialFocus="right" />} />
            <Route path="/site" element={<Navigate to="/site/upload" replace />} />
            <Route path="/roadmap" element={<RoadmapPage />} />
            <Route path="/seo-status" element={<SeoStatusPage siteId={siteId} />} />
            <Route path="/analytics" element={<AnalyticsPage siteId={siteId} />} />
            <Route path="/ads" element={<ComingSoonPage title="광고 관리" description="Google Ads, Naver 검색 광고 등 광고 캠페인을 통합 관리하고 ROI를 추적합니다." icon="📢" />} />
            <Route path="/content" element={<ComingSoonPage title="콘텐츠 자동화" description="AI를 활용한 SEO 블로그 글 자동 생성, 리뷰 콘텐츠 발행 등 콘텐츠 마케팅을 자동화합니다." icon="✍️" />} />
            <Route path="/admin" element={<AdminSiteListPage />} />
            <Route path="/admin/site/:siteId" element={<AdminSiteDetailPage />} />
            <Route path="*" element={<Navigate to="/site/upload" replace />} />
          </Routes>
        </DashboardLayout>
        <EducationDrawer open={educationOpen} onClose={() => setEducationOpen(false)} />
      </PageTitleProvider>
    </BrowserRouter>
  );
}
