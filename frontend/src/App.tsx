import { useState, useRef } from 'react';
import { createUploadUrl, validateSite, deploySite } from './mvp-api.js';

type Step = 'upload' | 'validate' | 'deploy' | 'done';

interface UploadResult {
  uploadUrl: string;
  objectKey: string;
}

interface CheckItem {
  rule: string;
  passed: boolean;
  detail?: string;
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

export default function App() {
  const [step, setStep] = useState<Step>('upload');
  const [siteId, setSiteId] = useState('');
  const [objectKey, setObjectKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [validateResult, setValidateResult] = useState<ValidateResult | null>(null);
  const [deployResult, setDeployResult] = useState<DeployResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const resetError = () => setError('');

  const handleUpload = async () => {
    resetError();
    const file = fileRef.current?.files?.[0];
    if (!siteId.trim()) return setError('Site ID를 입력하세요.');
    if (!file) return setError('ZIP 파일을 선택하세요.');
    if (!file.name.endsWith('.zip')) return setError('.zip 파일만 업로드할 수 있습니다.');

    setLoading(true);
    try {
      const data = await createUploadUrl({
        siteId: siteId.trim(),
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
        siteId: siteId.trim(),
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
        siteId: siteId.trim(),
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
    setSiteId('');
    setObjectKey('');
    setUploadResult(null);
    setValidateResult(null);
    setDeployResult(null);
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div style={{ maxWidth: 640, margin: '40px auto', fontFamily: 'system-ui, sans-serif', padding: '0 20px' }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>AISEO Deploy Dashboard</h1>
      <p style={{ color: '#666', marginBottom: 32 }}>
        ZIP 파일을 업로드하고, SEO 검증 후 dev 환경에 배포합니다.
      </p>

      {/* Progress */}
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

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>1. ZIP 파일 업로드</h2>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Site ID</label>
            <input
              type="text"
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              placeholder="my-site"
              style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6, boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>ZIP 파일</label>
            <input type="file" accept=".zip" ref={fileRef} />
          </div>
          <button
            onClick={handleUpload}
            disabled={loading}
            style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', cursor: 'pointer', fontSize: 14 }}
          >
            {loading ? '업로드 중...' : '업로드'}
          </button>
        </div>
      )}

      {/* Step 2: Validate */}
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

      {/* Step 3: Deploy */}
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
                    {c.passed ? '\u2705' : '\u274c'} {c.rule}
                    {c.detail && <span style={{ color: '#666', marginLeft: 8 }}>({c.detail})</span>}
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

      {/* Step 4: Done */}
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
            새로운 사이트 배포
          </button>
        </div>
      )}
    </div>
  );
}
