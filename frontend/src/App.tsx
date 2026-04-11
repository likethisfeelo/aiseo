import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { selectSite, getMe } from './api';
import { tokenStore } from './auth.js';
import { APP_ENV } from './config.js';

const BASE_DOMAIN = APP_ENV === 'prod' ? 'aiseo.tips' : 'dev.${BASE_DOMAIN}';
import { ForgotPasswordPage, LoginPage, SignupPage } from './auth-pages';
import { LandingPage } from './pages/LandingPage';
import type { UserProfile } from './types';
import { PublicSubPage } from './pages/public/PublicSubPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { AdminLayout } from './components/layout/AdminLayout';
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
import { ContentAutomationPage } from './pages/ContentAutomationPage';
import { DomainSettingsPage } from './pages/DomainSettingsPage';
import { AdminSiteListPage } from './pages/admin/AdminSiteListPage';
import { AdminSiteDetailPage } from './pages/admin/AdminSiteDetailPage';
import { MktAdminPage } from './pages/admin/MktAdminPage';
import { CourseInquiryAdminPage } from './pages/admin/CourseInquiryAdminPage';
import { BlogCategoriesAdminPage } from './pages/admin/BlogCategoriesAdminPage';
import { BlogPostsAdminPage } from './pages/admin/BlogPostsAdminPage';
import { BlogPostEditPage } from './pages/admin/BlogPostEditPage';
import { BlogListPage } from './pages/public/BlogListPage';
import { BlogPostPage } from './pages/public/BlogPostPage';

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
  '/domain': '도메인 설정',
  '/admin': '관리자',
  '/admin/blog/posts': '블로그 글 관리',
  '/admin/blog/categories': '블로그 카테고리',
};

function PageTitleProvider({ children, setPageTitle }: { children: React.ReactNode; setPageTitle: (t: string) => void }) {
  const location = useLocation();
  useEffect(() => {
    setPageTitle(PAGE_TITLES[location.pathname] || '대시보드');
  }, [location.pathname, setPageTitle]);
  return <>{children}</>;
}

/**
 * True when the current path belongs to the admin section. Admin routes
 * render under a standalone AdminLayout (no Sidebar/TopBar) so they look
 * visually distinct from the user dashboard.
 */
function isAdminPath(pathname: string): boolean {
  return pathname === '/admin'
    || pathname.startsWith('/admin/')
    || pathname === '/mktadmin';
}

/* LandingPage is now imported from ./pages/LandingPage */

/* ── Site ID Selection (first-time setup) ── */
function SiteIdSetup({ onSiteSelected }: { onSiteSelected: (id: string) => void }) {
  const [siteIdInput, setSiteIdInput] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingSiteId, setExistingSiteId] = useState('');
  const siteIdValid = /^[a-z0-9-]{3,63}$/.test(siteIdInput.trim());

  const handleLock = async () => {
    const normalized = siteIdInput.trim();
    if (!normalized || !siteIdValid) return;

    if (!confirming) { setConfirming(true); return; }

    setConfirming(false);
    setLoading(true);
    setError('');
    setExistingSiteId('');
    try {
      const data = await selectSite({ siteId: normalized });
      if (data.alreadyOwned) {
        setExistingSiteId(data.siteId);
      } else {
        onSiteSelected(data.siteId);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '사이트 주소 확정 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '60px auto', fontFamily: 'system-ui, sans-serif', padding: '0 20px' }}>
      <h2 style={{ fontSize: 20, marginBottom: 8 }}>내 사이트 주소 선택</h2>
      <p style={{ color: '#9a3412', fontSize: 13, marginBottom: 4 }}>한번 확정하면 변경할 수 없습니다. 신중하게 선택해 주세요.</p>
      <p style={{ color: '#64748b', fontSize: 12, marginBottom: 16 }}>이미 사이트를 등록하셨다면 기존 주소를 입력해 보세요.</p>

      {existingSiteId ? (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#166534', marginBottom: 8 }}>
            이미 등록된 사이트 주소가 있습니다
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
            https://{existingSiteId}.{BASE_DOMAIN}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
            새로운 주소를 생성할 수 없습니다. 변경이 필요하시면 로그인 후 도메인 설정에서 변경 요청해 주세요.
          </div>
          <button
            onClick={() => onSiteSelected(existingSiteId)}
            style={{
              background: '#2563eb', color: '#fff', border: 'none',
              borderRadius: 6, padding: '12px 28px', cursor: 'pointer', fontSize: 14, fontWeight: 600,
            }}
          >
            이 주소로 계속하기 →
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              value={siteIdInput}
              onChange={(e) => { setSiteIdInput(e.target.value.toLowerCase()); setConfirming(false); setError(''); }}
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
        </>
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
  const [siteIdLoading, setSiteIdLoading] = useState(true);
  const [siteIdError, setSiteIdError] = useState('');
  const [pageTitle, setPageTitle] = useState('대시보드');
  const [educationOpen, setEducationOpen] = useState(false);

  // Reactive hash state for public sub-page routing
  const [currentHash, setCurrentHash] = useState(
    typeof window !== 'undefined' ? window.location.hash.replace('#', '') : ''
  );
  useEffect(() => {
    const onHashChange = () => setCurrentHash(window.location.hash.replace('#', ''));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Get siteId: server first, then localStorage fallback
  useEffect(() => {
    if (!user) { setSiteIdLoading(false); return; }
    setSiteIdLoading(true);
    setSiteIdError('');
    // Try server-side siteId (from /me response)
    getMe().then((data: { siteId?: string }) => {
      if (data.siteId) {
        setSiteId(data.siteId);
        localStorage.setItem('aiseo.siteId', data.siteId);
      } else {
        // Server returned no siteId — user genuinely has no site
        const stored = localStorage.getItem('aiseo.siteId');
        if (stored) setSiteId(stored);
      }
    }).catch(() => {
      // API failed — use localStorage but show warning if also empty
      const stored = localStorage.getItem('aiseo.siteId');
      if (stored) {
        setSiteId(stored);
      } else {
        setSiteIdError('서버 연결에 실패했습니다. 새로고침하거나 잠시 후 다시 시도해 주세요.');
      }
    }).finally(() => setSiteIdLoading(false));
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

  // Not logged in — /blog uses real router; everything else falls through
  // to legacy hash-based dispatch for public sub-pages.
  if (!user) {
    const subPages: Record<string, string> = {
      'course': '수강안내',
      'support': '지원서비스',
      'events': '이벤트',
    };
    const pageKey = currentHash && subPages[currentHash] ? currentHash : 'landing';
    return (
      <Routes>
        <Route path="/blog" element={<BlogListPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route
          path="*"
          element={
            <div className="page-transition" key={pageKey}>
              {pageKey !== 'landing'
                ? <PublicSubPage pageKey={pageKey} title={subPages[pageKey]} />
                : <LandingPage authError={authError} />}
            </div>
          }
        />
      </Routes>
    );
  }

  // Loading siteId from server
  if (siteIdLoading) {
    return (
      <div style={{ maxWidth: 640, margin: '40px auto', fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: '60px 20px', color: '#666' }}>
        사이트 정보 불러오는 중...
      </div>
    );
  }

  // Server failed and no localStorage — show error, NOT SiteIdSetup
  if (siteIdError && !siteId) {
    return (
      <div style={{ maxWidth: 500, margin: '60px auto', fontFamily: 'system-ui, sans-serif', padding: '0 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ fontSize: 18, marginBottom: 8, color: '#1e293b' }}>서버 연결 실패</h2>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>{siteIdError}</p>
        <button onClick={() => window.location.reload()} style={{
          padding: '10px 24px', borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', fontSize: 14, cursor: 'pointer',
        }}>새로고침</button>
        <div style={{ marginTop: 24, borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>처음 사용하시는 분이라면 아래에서 사이트를 등록하세요.</p>
          <button onClick={() => setSiteIdError('')} style={{
            padding: '8px 20px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', color: '#475569', fontSize: 13, cursor: 'pointer',
          }}>사이트 주소 등록하기</button>
        </div>
      </div>
    );
  }

  // No site selected yet
  if (!siteId) return <SiteIdSetup onSiteSelected={handleSiteSelected} />;

  // Authenticated dashboard
  return (
    <PageTitleProvider setPageTitle={setPageTitle}>
      <AuthenticatedShell
        user={user}
        siteId={siteId}
        pageTitle={pageTitle}
        logout={logout}
        educationOpen={educationOpen}
        setEducationOpen={setEducationOpen}
      />
    </PageTitleProvider>
  );
}

/**
 * Routes-aware shell that picks between two top-level layouts:
 *   - AdminLayout for /admin/* and /mktadmin (standalone, no sidebar)
 *   - DashboardLayout for everything else (sidebar + topbar)
 *
 * Must live inside Router context to use useLocation, and inside
 * PageTitleProvider so pageTitle updates on navigation.
 */
function AuthenticatedShell({
  user,
  siteId,
  pageTitle,
  logout,
  educationOpen,
  setEducationOpen,
}: {
  user: UserProfile;
  siteId: string;
  pageTitle: string;
  logout: () => void;
  educationOpen: boolean;
  setEducationOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const location = useLocation();

  if (isAdminPath(location.pathname)) {
    return (
      <AdminLayout user={user} onLogout={logout}>
        <Routes>
          <Route path="/admin" element={<AdminSiteListPage />} />
          <Route path="/admin/site/:siteId" element={<AdminSiteDetailPage />} />
          <Route path="/mktadmin" element={<MktAdminPage />} />
          <Route path="/admin/course-inquiries" element={<CourseInquiryAdminPage />} />
          <Route path="/admin/blog/posts" element={<BlogPostsAdminPage />} />
          <Route path="/admin/blog/posts/new" element={<BlogPostEditPage />} />
          <Route path="/admin/blog/posts/:slug/edit" element={<BlogPostEditPage />} />
          <Route path="/admin/blog/categories" element={<BlogCategoriesAdminPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </AdminLayout>
    );
  }

  return (
    <>
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
          <Route path="/content" element={<ContentAutomationPage />} />
          <Route path="/domain" element={<DomainSettingsPage siteId={siteId} />} />
          <Route path="*" element={<Navigate to="/site/upload" replace />} />
        </Routes>
      </DashboardLayout>
      <EducationDrawer open={educationOpen} onClose={() => setEducationOpen(false)} />
    </>
  );
}
