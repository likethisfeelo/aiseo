import { useEffect, useRef, useState } from 'react';
import { createUploadUrl, deploySite, getMe, selectSite, validateSite } from './mvp-api.js';
import {
  buildLoginUrl,
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

export default function App() {
  const authPage =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('auth')
      : null;
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
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    consumeCognitoCallbackTokens();

    const loadMe = async () => {
      const accessToken = tokenStore.getAccessToken();
      if (!accessToken) {
        setMeLoading(false);
        return;
      }

      try {
        const data = await getMe();
        setUser(data.user);
      } catch {
        tokenStore.clear();
      } finally {
        setMeLoading(false);
      }
    };

    loadMe();
  }, []);

  const resetError = () => setError('');
  const siteId = lockedSiteId || siteIdInput.trim();

  const handleLockSiteId = async () => {
    const normalized = siteIdInput.trim();
    if (!normalized) {
      setError('사이트 주소(siteId)를 먼저 입력하세요.');
      return;
    }

    if (!/^[a-z0-9-]+$/.test(normalized)) {
      setError('siteId는 영문 소문자, 숫자, 하이픈(-)만 사용할 수 있습니다.');
      return;
    }

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
    if (!lockedSiteId) return setError('사이트 주소를 먼저 확정하세요. 확정 후에는 수정할 수 없습니다.');
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
      setError(err instanceof Error ? err.message : 'Upload failed');
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
      setError(err instanceof Error ? err.message : 'Validation failed');
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
      setError(err instanceof Error ? err.message : 'Deploy failed');
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

  if (authPage === 'login') return <LoginPage />;
  if (authPage === 'signup') return <SignupPage />;
  if (authPage === 'forgot-password') return <ForgotPasswordPage />;

  if (meLoading) {
    return <div style={{ maxWidth: 640, margin: '40px auto' }}>로그인 상태 확인 중...</div>;
  }

  if (!user) {
    return (
      <div style={{ maxWidth: 640, margin: '40px auto', fontFamily: 'system-ui, sans-serif', padding: '0 20px' }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>AISEO</h1>
        <p style={{ color: '#666', marginBottom: 24 }}>
          원래 서비스 흐름으로 진행하려면 회원가입 후 로그인하세요.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <a href="/?auth=signup" style={{ background: '#111827', color: '#fff', textDecoration: 'none', padding: '10px 16px', borderRadius: 8 }}>
            회원가입
          </a>
          <a href="/?auth=login" style={{ background: '#2563eb', color: '#fff', textDecoration: 'none', padding: '10px 16px', borderRadius: 8 }}>
            로그인
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: '40px auto', fontFamily: 'system-ui, sans-serif', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>AISEO Deploy Dashboard</h1>
        <a href={buildLogoutUrl()} style={{ color: '#2563eb' }}>로그아웃</a>
      </div>

      <p style={{ color: '#666', marginBottom: 8 }}>
        로그인 사용자: <strong>{user.email || user.username}</strong>
      </p>
      <p style={{ color: '#666', marginBottom: 24 }}>
        회원가입 → 로그인(Cognito) → ZIP 업로드 → SEO 검증 → 배포
      </p>

      {!lockedSiteId && (
        <div style={{ background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 8, padding: 12, marginBottom: 16 }}>
          <strong>사이트 주소 확정</strong>
          <p style={{ margin: '8px 0', color: '#9a3412' }}>siteId를 확정하면 계정 기준으로 수정할 수 없습니다.</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={siteIdInput}
              onChange={(e) => setSiteIdInput(e.target.value)}
              placeholder="my-site"
              style={{ flex: 1, padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }}
            />
            <button onClick={handleLockSiteId} disabled={loading} style={{ background: '#ea580c', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 12px' }}>
              {loading ? '확정 중...' : '주소 확정'}
            </button>
          </div>
        </div>
      )}

      {lockedSiteId && (
        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8, padding: 12, marginBottom: 16 }}>
          확정된 사이트 주소: <strong>{lockedSiteId}</strong>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['upload', 'validate', 'deploy', 'done'] as Step[]).map((s, i) => (
          <div
            key={s}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background:
                i <= ['upload', 'validate', 'deploy', 'done'].indexOf(step)
                  ? '#2563eb'
                  : '#e5e7eb',
            }}
          />
        ))}
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, marginBottom: 16, color: '#dc2626' }}>
          {error}
        </div>
      )}

      {step === 'upload' && (
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>1. ZIP 파일 업로드</h2>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>ZIP 파일</label>
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
          <p style={{ color: '#666', marginBottom: 12 }}>
            업로드 완료: <code>{uploadResult?.objectKey}</code>
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
                  <li key={i} style={{ padding: '4px 0' }}>
                    {c.passed ? '\u2705' : '\u274c'} {c.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button
            onClick={handleDeploy}
            disabled={loading}
            style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', cursor: 'pointer', fontSize: 14 }}
          >
            {loading ? '배포 중...' : 'Dev 환경에 배포'}
          </button>
        </div>
      )}

      {step === 'done' && deployResult && (
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>배포 완료!</h2>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 16 }}>
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
          <button
            onClick={handleReset}
            style={{ marginTop: 16, background: '#6b7280', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', cursor: 'pointer', fontSize: 14 }}
          >
            다시 시작
          </button>
        </div>
      )}
    </div>
  );
}
