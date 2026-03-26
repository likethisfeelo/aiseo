import { useEffect, useRef, useState } from 'react';
import { createUploadUrl, deploySite, getMe, getSiteSettings, saveSiteSettings, selectSite, validateSite } from './mvp-api.js';
import {
  buildLogoutUrl,
  consumeCognitoCallbackTokens,
  tokenStore,
} from './auth.js';
import { ForgotPasswordPage, LoginPage, SignupPage } from './auth-pages';

type Step = 'upload' | 'validate' | 'deploy' | 'done';

interface UploadResult {
  uploadUrl: string;
  objectKey: string;
}

interface CheckItem {
  key?: string;
  reason: string;
  passed: boolean;
}

interface ValidateResult {
  summary: { total: number; passed: number; failed: number };
  checks: CheckItem[];
}

interface DeployResult {
  deployedUrl: string;
  uploadedCount: number;
  invalidationId?: string;
}

interface UserProfile {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
  username: string;
}

const SEO_FIX_GUIDES: Record<string, string> = {
  'index.html': 'ZIP 파일 최상위에 index.html 파일을 포함해 주세요. 이 파일이 사이트의 메인 페이지가 됩니다.',
  'robots.txt': 'ZIP 파일 최상위에 robots.txt 파일을 추가하세요. 내용 예시:\nUser-agent: *\nAllow: /',
  'sitemap.xml': 'ZIP 파일 최상위에 sitemap.xml 파일을 추가하세요. 검색엔진이 사이트 구조를 파악하는 데 필수입니다.',
  'title': 'index.html의 <head> 안에 <title>사이트 제목</title> 태그를 추가하세요.',
  'meta-description': 'index.html의 <head> 안에 <meta name="description" content="사이트 설명"> 태그를 추가하세요.',
};

interface HeadSnippets {
  ga4Id?: string;
  gscMeta?: string;
  googleAdsId?: string;
  naverMeta?: string;
  customHead?: string;
}

function SiteSettingsPanel({ siteId }: { siteId: string }) {
  const [snippets, setSnippets] = useState<HeadSnippets>({});
  const [saving, setSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    getSiteSettings(siteId)
      .then((data: { headSnippets: HeadSnippets }) => setSnippets(data.headSnippets || {}))
      .catch(() => {})
      .finally(() => setLoadingSettings(false));
  }, [siteId]);

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      await saveSiteSettings({ siteId, headSnippets: snippets });
      setMsg('저장되었습니다. 변경사항은 다음 배포 시 반영됩니다.');
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const update = (key: keyof HeadSnippets, value: string) =>
    setSnippets((prev) => ({ ...prev, [key]: value }));

  if (loadingSettings) return <p style={{ fontSize: 13, color: '#666' }}>설정 불러오는 중...</p>;

  const inputStyle = { width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' as const, marginBottom: 8 };
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 } as const;

  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginBottom: 16 }}>
      <h3 style={{ fontSize: 15, marginBottom: 12 }}>마케팅/분석 코드 설정</h3>
      <p style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
        아래 코드를 입력하면 배포 시 사이트의 {'<head>'} 태그에 자동으로 삽입됩니다.
      </p>

      <label style={labelStyle}>GA4 측정 ID</label>
      <input placeholder="G-XXXXXXXXXX" value={snippets.ga4Id || ''} onChange={(e) => update('ga4Id', e.target.value)} style={inputStyle} />

      <label style={labelStyle}>Google Ads 전환 ID</label>
      <input placeholder="AW-XXXXXXXXX" value={snippets.googleAdsId || ''} onChange={(e) => update('googleAdsId', e.target.value)} style={inputStyle} />

      <label style={labelStyle}>Google Search Console 메타 태그</label>
      <input placeholder='<meta name="google-site-verification" content="...">' value={snippets.gscMeta || ''} onChange={(e) => update('gscMeta', e.target.value)} style={inputStyle} />

      <label style={labelStyle}>Naver Webmaster 메타 태그</label>
      <input placeholder='<meta name="naver-site-verification" content="...">' value={snippets.naverMeta || ''} onChange={(e) => update('naverMeta', e.target.value)} style={inputStyle} />

      <label style={labelStyle}>커스텀 {'<head>'} 코드</label>
      <textarea placeholder="기타 삽입할 HTML 코드" value={snippets.customHead || ''} onChange={(e) => update('customHead', e.target.value)} style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} />

      {msg && <p style={{ fontSize: 12, color: msg.includes('실패') ? '#dc2626' : '#065f46', marginBottom: 8 }}>{msg}</p>}

      <button onClick={handleSave} disabled={saving} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13 }}>
        {saving ? '저장 중...' : '설정 저장'}
      </button>
    </div>
  );
}

export default function App() {
  const [authPage, setAuthPage] = useState<string | null>(
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('auth')
      : null
  );
  const [step, setStep] = useState<Step>('upload');
  const [siteIdInput, setSiteIdInput] = useState('');
  const [lockedSiteId, setLockedSiteId] = useState('');
  const [objectKey, setObjectKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [validateResult, setValidateResult] = useState<ValidateResult | null>(null);
  const [deployResult, setDeployResult] = useState<DeployResult | null>(null);
  const [meLoading, setMeLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authError, setAuthError] = useState('');
  const [confirmingSiteId, setConfirmingSiteId] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadMe = async () => {
    const accessToken = tokenStore.getAccessToken();
    if (!accessToken) {
      setMeLoading(false);
      return;
    }

    setAuthError('');
    try {
      const data = await getMe();
      setUser(data.user);
    } catch (err: unknown) {
      console.error('[AISEO] Failed to load user profile:', err);
      tokenStore.clear();
      setAuthError('로그인 상태 확인에 실패했습니다. 다시 로그인해 주세요.');
    } finally {
      setMeLoading(false);
    }
  };

  const handleLoginSuccess = async () => {
    window.history.replaceState({}, document.title, window.location.pathname);
    setAuthPage(null);
    setMeLoading(true);
    setAuthError('');
    await loadMe();
  };

  useEffect(() => {
    consumeCognitoCallbackTokens();
    loadMe();
  }, []);

  const resetError = () => setError('');
  const siteId = lockedSiteId || siteIdInput.trim();

  const siteIdValid = /^[a-z0-9-]{3,63}$/.test(siteIdInput.trim());

  const handleLockSiteId = async () => {
    const normalized = siteIdInput.trim();
    if (!normalized) {
      setError('사이트 주소를 먼저 입력하세요.');
      return;
    }

    if (!/^[a-z0-9-]{3,63}$/.test(normalized)) {
      setError('사이트 주소는 영문 소문자, 숫자, 하이픈(-)만 사용할 수 있으며, 3~63자여야 합니다.');
      return;
    }

    if (!confirmingSiteId) {
      setConfirmingSiteId(true);
      return;
    }

    setConfirmingSiteId(false);
    setLoading(true);
    try {
      const data = await selectSite({ siteId: normalized });
      setLockedSiteId(data.siteId);
      setError('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '사이트 주소 확정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    resetError();
    const file = fileRef.current?.files?.[0];
    if (!lockedSiteId) return setError('사이트 주소를 먼저 확정하세요.');
    if (!file) return setError('ZIP 파일을 선택하세요.');
    if (!file.name.endsWith('.zip')) return setError('.zip 파일만 업로드할 수 있습니다.');

    setLoading(true);
    try {
      const data = await createUploadUrl({
        siteId,
        fileName: file.name,
        fileSize: file.size,
      });
      setUploadResult(data);
      setObjectKey(data.objectKey);

      await fetch(data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/zip' },
        body: file,
      });

      setStep('validate');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '업로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    resetError();
    setLoading(true);
    try {
      const data = await validateSite({
        siteId,
        objectKey,
      });
      setValidateResult(data);
      setStep('deploy');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '검증에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = async () => {
    resetError();
    setLoading(true);
    try {
      const data = await deploySite({
        siteId,
        objectKey,
        env: 'dev',
      });
      setDeployResult(data);
      setStep('done');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '배포에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('upload');
    setObjectKey('');
    setUploadResult(null);
    setValidateResult(null);
    setDeployResult(null);
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  if (authPage === 'login') return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  if (authPage === 'signup') return <SignupPage />;
  if (authPage === 'forgot-password') return <ForgotPasswordPage />;

  if (meLoading) {
    return <div style={{ maxWidth: 640, margin: '40px auto', fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: '60px 20px', color: '#666' }}>로그인 상태 확인 중...</div>;
  }

  /* ── 비로그인 랜딩 페이지 ── */
  if (!user) {
    return (
      <div style={{ maxWidth: 640, margin: '40px auto', fontFamily: 'system-ui, sans-serif', padding: '0 20px' }}>
        <h1 style={{ fontSize: 28, marginBottom: 4 }}>AISEO</h1>
        <p style={{ fontSize: 15, color: '#2563eb', marginBottom: 24, fontWeight: 500 }}>
          AI 웹사이트를 SEO 최적화하고, 한 번에 배포하세요.
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
            AISEO는 AI로 제작한 웹사이트의 SEO(검색엔진 최적화) 상태를 자동으로 검증하고,
            Google/Naver 검색에 최적화된 상태로 배포해 드립니다.
            GA4, Google Ads, 서치콘솔 등 마케팅 코드도 간편하게 연동할 수 있습니다.
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

  /* ── 로그인 후 대시보드 ── */
  const stepLabels = ['업로드', '검증', '배포', '완료'];

  return (
    <div style={{ maxWidth: 640, margin: '40px auto', fontFamily: 'system-ui, sans-serif', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>AISEO</h1>
        <a href={buildLogoutUrl()} style={{ color: '#2563eb', fontSize: 14 }}>로그아웃</a>
      </div>

      <p style={{ color: '#666', marginBottom: 24, fontSize: 14 }}>
        {user.email || user.username}
      </p>

      {/* ── siteId 선택 ── */}
      {!lockedSiteId && (
        <div style={{ background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <strong style={{ fontSize: 15 }}>내 사이트 주소 선택</strong>
          <p style={{ margin: '8px 0', color: '#9a3412', fontSize: 13 }}>
            한번 확정하면 변경할 수 없습니다. 신중하게 선택해 주세요.
          </p>

          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              type="text"
              value={siteIdInput}
              onChange={(e) => { setSiteIdInput(e.target.value.toLowerCase()); setConfirmingSiteId(false); }}
              placeholder="my-site"
              style={{ flex: 1, padding: 8, border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
            />
            <button onClick={handleLockSiteId} disabled={loading || (!confirmingSiteId && !siteIdValid)} style={{ background: confirmingSiteId ? '#dc2626' : '#ea580c', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 14, whiteSpace: 'nowrap' }}>
              {loading ? '확정 중...' : confirmingSiteId ? '정말 확정' : '주소 확정'}
            </button>
          </div>

          {/* 실시간 미리보기 */}
          {siteIdInput.trim() && (
            <p style={{ fontSize: 13, color: siteIdValid ? '#065f46' : '#dc2626', margin: 0 }}>
              {siteIdValid
                ? `https://${siteIdInput.trim()}.aiseo.tips`
                : '영문 소문자, 숫자, 하이픈(-) 3~63자만 가능합니다.'}
            </p>
          )}

          {/* 확정 확인 메시지 */}
          {confirmingSiteId && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: 10, marginTop: 8 }}>
              <p style={{ fontSize: 13, color: '#dc2626', margin: 0, fontWeight: 500 }}>
                <strong>https://{siteIdInput.trim()}.aiseo.tips</strong> 로 확정하시겠습니까?
                <br />확정 후에는 변경할 수 없습니다. "정말 확정" 버튼을 다시 눌러주세요.
              </p>
            </div>
          )}
        </div>
      )}

      {lockedSiteId && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 14 }}>
          내 사이트: <strong><a href={`https://${lockedSiteId}.aiseo.tips`} target="_blank" rel="noopener noreferrer" style={{ color: '#059669' }}>https://{lockedSiteId}.aiseo.tips</a></strong>
        </div>
      )}

      {lockedSiteId && <SiteSettingsPanel siteId={lockedSiteId} />}

      {/* ── 진행 바 (라벨 포함) ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
        {(['upload', 'validate', 'deploy', 'done'] as Step[]).map((s, i) => {
          const active = i <= ['upload', 'validate', 'deploy', 'done'].indexOf(step);
          return (
            <div key={s} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ height: 4, borderRadius: 2, background: active ? '#2563eb' : '#e5e7eb', marginBottom: 4 }} />
              <span style={{ fontSize: 11, color: active ? '#2563eb' : '#9ca3af' }}>{stepLabels[i]}</span>
            </div>
          );
        })}
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, marginBottom: 16, color: '#dc2626' }}>
          {error}
        </div>
      )}

      {step === 'upload' && (
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>1. ZIP 파일 업로드</h2>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
            AI로 만든 웹사이트 파일을 ZIP으로 압축하여 업로드하세요. (최대 50MB)
          </p>
          <div style={{ marginBottom: 16 }}>
            <input type="file" accept=".zip" ref={fileRef} />
          </div>
          <button
            onClick={handleUpload}
            disabled={loading || !lockedSiteId}
            style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', cursor: 'pointer', fontSize: 14 }}
          >
            {loading ? '업로드 중...' : '업로드'}
          </button>
        </div>
      )}

      {step === 'validate' && (
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>2. SEO 검증</h2>
          <p style={{ color: '#666', marginBottom: 12, fontSize: 13 }}>
            업로드 완료. SEO 최적화 상태를 자동으로 검증합니다.
          </p>
          <button
            onClick={handleValidate}
            disabled={loading}
            style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', cursor: 'pointer', fontSize: 14 }}
          >
            {loading ? '검증 중...' : '검증 시작'}
          </button>
        </div>
      )}

      {step === 'deploy' && (
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>3. 배포</h2>
          {validateResult && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontWeight: 500, marginBottom: 8 }}>
                검증 결과: {validateResult.summary.passed}/{validateResult.summary.total} 통과
              </p>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {validateResult.checks.map((c, i) => (
                  <li key={i} style={{ padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div>{c.passed ? '\u2705' : '\u274c'} {c.reason}</div>
                    {/* 실패 항목에 해결 가이드 표시 */}
                    {!c.passed && c.key && SEO_FIX_GUIDES[c.key] && (
                      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: 8, marginTop: 4, fontSize: 12, color: '#92400e', whiteSpace: 'pre-line' }}>
                        {SEO_FIX_GUIDES[c.key]}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              {validateResult.summary.failed > 0 && (
                <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
                  실패 항목이 있어도 배포는 가능하지만, SEO 점수를 높이려면 수정 후 재업로드를 권장합니다.
                </p>
              )}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleDeploy}
              disabled={loading}
              style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', cursor: 'pointer', fontSize: 14 }}
            >
              {loading ? '배포 중...' : 'Dev 환경에 배포'}
            </button>
            <button
              onClick={handleReset}
              style={{ background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: 6, padding: '10px 24px', cursor: 'pointer', fontSize: 14 }}
            >
              수정 후 재업로드
            </button>
          </div>
        </div>
      )}

      {step === 'done' && deployResult && (
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>배포 완료!</h2>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <p><strong>배포 URL:</strong>{' '}
              <a href={deployResult.deployedUrl} target="_blank" rel="noopener noreferrer">
                {deployResult.deployedUrl}
              </a>
            </p>
            <p><strong>업로드된 파일 수:</strong> {deployResult.uploadedCount}</p>
            {deployResult.invalidationId && (
              <p><strong>CloudFront Invalidation:</strong> {deployResult.invalidationId}</p>
            )}
          </div>

          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <p style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>다음 단계</p>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#1e40af', lineHeight: 1.8 }}>
              <li>배포된 사이트가 정상적으로 보이는지 확인하세요.</li>
              <li>Google Search Console에 사이트를 등록하면 검색 노출이 시작됩니다.</li>
              <li>GA4(Google Analytics)를 연동하면 방문자 분석이 가능합니다.</li>
              <li>수정이 필요하면 아래 "다시 시작"으로 재업로드/재배포하세요.</li>
            </ul>
          </div>

          <button
            onClick={handleReset}
            style={{ background: '#6b7280', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', cursor: 'pointer', fontSize: 14 }}
          >
            다시 시작
          </button>
        </div>
      )}
    </div>
  );
}
