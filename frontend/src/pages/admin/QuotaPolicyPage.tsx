// Admin page for configuring the global quota policy.
//
// Reads `/admin/quota-policy` on mount and writes the edited doc back
// with PUT. Hard caps are surfaced (read-only) so admins understand
// the ceiling their values get clamped against server-side.
//
// We keep the form deliberately simple — a flat list of numeric fields
// for each of the two modes, a global mode selector, and the optional
// training window + per-user grace period controls. Anything more
// elaborate belongs in a dedicated admin tool.

import { useEffect, useState } from 'react';
import { adminGetQuotaPolicy, adminSaveQuotaPolicy } from '../../api';

interface PolicyValues {
  maxImageMB: number;
  maxImages: number;
  maxSiteZipMB: number;
  maxTotalStorageMB: number;
  monthlyDeploys: number | null;
  monthlyImagePuts: number | null;
  imageResize: { maxWidth: number; quality: number } | false | null;
}

interface QuotaConfigDoc {
  activePolicy: 'training' | 'normal';
  trainingWindow: { startAt: string; endAt: string } | null;
  perUserTrainingDays: number;
  policies: { training: PolicyValues; normal: PolicyValues };
}

interface AdminResponse {
  config: QuotaConfigDoc;
  defaults: QuotaConfigDoc;
  hardCaps: { imageMB: number; storageGB: number; siteZipMB: number };
}

const sectionStyle: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: 16,
  marginBottom: 16,
  background: '#fff',
};

const inputStyle: React.CSSProperties = {
  width: 120,
  padding: '4px 8px',
  border: '1px solid #cbd5e1',
  borderRadius: 6,
  fontSize: 13,
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '6px 0',
  fontSize: 13,
  color: '#334155',
};

function PolicyForm({
  mode,
  values,
  onChange,
}: {
  mode: 'training' | 'normal';
  values: PolicyValues;
  onChange: (next: PolicyValues) => void;
}) {
  const update = (key: keyof PolicyValues, value: number | null) => {
    onChange({ ...values, [key]: value });
  };

  const updateResize = (key: 'maxWidth' | 'quality', value: number) => {
    const current =
      typeof values.imageResize === 'object' && values.imageResize
        ? values.imageResize
        : { maxWidth: 1600, quality: 0.85 };
    onChange({ ...values, imageResize: { ...current, [key]: value } });
  };

  const resizeEnabled = !!values.imageResize;

  return (
    <div style={sectionStyle}>
      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
        {mode === 'training' ? '🟢 Training 정책' : '🔵 Normal 정책'}
      </h3>

      <div style={rowStyle}>
        <span>이미지 1장 최대 (MB)</span>
        <input
          type="number"
          style={inputStyle}
          value={values.maxImageMB}
          onChange={(e) => update('maxImageMB', Number(e.target.value))}
        />
      </div>

      <div style={rowStyle}>
        <span>이미지 총 개수</span>
        <input
          type="number"
          style={inputStyle}
          value={values.maxImages}
          onChange={(e) => update('maxImages', Number(e.target.value))}
        />
      </div>

      <div style={rowStyle}>
        <span>사이트 ZIP 최대 (MB)</span>
        <input
          type="number"
          style={inputStyle}
          value={values.maxSiteZipMB}
          onChange={(e) => update('maxSiteZipMB', Number(e.target.value))}
        />
      </div>

      <div style={rowStyle}>
        <span>사용자 총 저장 (MB)</span>
        <input
          type="number"
          style={inputStyle}
          value={values.maxTotalStorageMB}
          onChange={(e) => update('maxTotalStorageMB', Number(e.target.value))}
        />
      </div>

      <div style={rowStyle}>
        <span>월 재배포 횟수 (빈값 = 무제한)</span>
        <input
          type="number"
          style={inputStyle}
          value={values.monthlyDeploys ?? ''}
          onChange={(e) =>
            update('monthlyDeploys', e.target.value === '' ? null : Number(e.target.value))
          }
        />
      </div>

      <div style={rowStyle}>
        <span>월 이미지 업로드 (빈값 = 무제한)</span>
        <input
          type="number"
          style={inputStyle}
          value={values.monthlyImagePuts ?? ''}
          onChange={(e) =>
            update('monthlyImagePuts', e.target.value === '' ? null : Number(e.target.value))
          }
        />
      </div>

      <div style={{ ...rowStyle, borderTop: '1px dashed #e2e8f0', marginTop: 8, paddingTop: 8 }}>
        <span>자동 리사이즈</span>
        <label style={{ fontSize: 12 }}>
          <input
            type="checkbox"
            checked={resizeEnabled}
            onChange={(e) =>
              onChange({
                ...values,
                imageResize: e.target.checked ? { maxWidth: 1600, quality: 0.85 } : false,
              })
            }
          />{' '}
          활성화
        </label>
      </div>

      {resizeEnabled && typeof values.imageResize === 'object' && values.imageResize && (
        <>
          <div style={rowStyle}>
            <span>리사이즈 최대 너비 (px)</span>
            <input
              type="number"
              style={inputStyle}
              value={values.imageResize.maxWidth}
              onChange={(e) => updateResize('maxWidth', Number(e.target.value))}
            />
          </div>
          <div style={rowStyle}>
            <span>JPEG 품질 (0-1)</span>
            <input
              type="number"
              step="0.05"
              min="0.1"
              max="1"
              style={inputStyle}
              value={values.imageResize.quality}
              onChange={(e) => updateResize('quality', Number(e.target.value))}
            />
          </div>
        </>
      )}
    </div>
  );
}

export function QuotaPolicyPage() {
  const [loaded, setLoaded] = useState<AdminResponse | null>(null);
  const [config, setConfig] = useState<QuotaConfigDoc | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = (await adminGetQuotaPolicy()) as AdminResponse;
        setLoaded(res);
        setConfig(res.config);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load quota policy');
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const res = (await adminSaveQuotaPolicy(config as unknown as Record<string, unknown>)) as AdminResponse;
      setLoaded(res);
      setConfig(res.config);
      setMessage('정책을 저장했습니다.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save quota policy');
    } finally {
      setSaving(false);
    }
  };

  if (!loaded || !config) {
    return <div style={{ padding: 24 }}>{error || '불러오는 중...'}</div>;
  }

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>쿼터 정책 관리</h2>

      <div style={sectionStyle}>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
          <strong>하드캡</strong> (환경변수로 고정, 화면 값은 항상 이 상한에 맞춰 클램핑됨)
        </p>
        <div style={rowStyle}>
          <span>이미지 1장</span>
          <span>{loaded.hardCaps.imageMB} MB</span>
        </div>
        <div style={rowStyle}>
          <span>사용자 총 저장</span>
          <span>{loaded.hardCaps.storageGB} GB</span>
        </div>
        <div style={rowStyle}>
          <span>사이트 ZIP</span>
          <span>{loaded.hardCaps.siteZipMB} MB</span>
        </div>
      </div>

      <div style={sectionStyle}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>⚙ 전역 설정</h3>

        <div style={rowStyle}>
          <span>활성 정책</span>
          <select
            style={{ ...inputStyle, width: 160 }}
            value={config.activePolicy}
            onChange={(e) =>
              setConfig({ ...config, activePolicy: e.target.value as 'training' | 'normal' })
            }
          >
            <option value="normal">🔵 Normal (기본)</option>
            <option value="training">🟢 Training (교육/이벤트)</option>
          </select>
        </div>

        <div style={rowStyle}>
          <span>신규 가입자 자동 Training 기간 (일)</span>
          <input
            type="number"
            style={inputStyle}
            value={config.perUserTrainingDays}
            onChange={(e) =>
              setConfig({ ...config, perUserTrainingDays: Number(e.target.value) })
            }
          />
        </div>

        <div style={{ ...rowStyle, borderTop: '1px dashed #e2e8f0', marginTop: 8, paddingTop: 8 }}>
          <span>전역 Training 기간 설정</span>
          <label style={{ fontSize: 12 }}>
            <input
              type="checkbox"
              checked={!!config.trainingWindow}
              onChange={(e) =>
                setConfig({
                  ...config,
                  trainingWindow: e.target.checked
                    ? {
                        startAt: new Date().toISOString(),
                        endAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
                      }
                    : null,
                })
              }
            />{' '}
            사용
          </label>
        </div>

        {config.trainingWindow && (
          <>
            <div style={rowStyle}>
              <span>시작 (ISO)</span>
              <input
                type="text"
                style={{ ...inputStyle, width: 260 }}
                value={config.trainingWindow.startAt}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    trainingWindow: { ...config.trainingWindow!, startAt: e.target.value },
                  })
                }
              />
            </div>
            <div style={rowStyle}>
              <span>종료 (ISO)</span>
              <input
                type="text"
                style={{ ...inputStyle, width: 260 }}
                value={config.trainingWindow.endAt}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    trainingWindow: { ...config.trainingWindow!, endAt: e.target.value },
                  })
                }
              />
            </div>
          </>
        )}
      </div>

      <PolicyForm
        mode="training"
        values={config.policies.training}
        onChange={(next) =>
          setConfig({ ...config, policies: { ...config.policies, training: next } })
        }
      />

      <PolicyForm
        mode="normal"
        values={config.policies.normal}
        onChange={(next) =>
          setConfig({ ...config, policies: { ...config.policies, normal: next } })
        }
      />

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '8px 20px',
            fontSize: 14,
            fontWeight: 600,
            background: '#4f46e5',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? '저장 중...' : '저장'}
        </button>
        {message && <span style={{ color: '#16a34a', fontSize: 13 }}>{message}</span>}
        {error && <span style={{ color: '#dc2626', fontSize: 13 }}>{error}</span>}
      </div>
    </div>
  );
}
