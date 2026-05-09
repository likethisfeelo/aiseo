import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import type { DeployResult } from '../../types';

export type DeployPhase = 'confirm' | 'progress' | 'done' | 'error';

interface Props {
  open: boolean;
  phase: DeployPhase;
  siteId: string;
  uploadedFileName: string;
  validatePassed?: number;
  validateTotal?: number;
  result?: DeployResult | null;
  errorMessage?: string;
  onConfirm: () => void;
  onClose: () => void;
}

const PROGRESS_STEPS = [
  'ZIP 검증 · 추출',
  'S3 업로드',
  'CloudFront 캐시 무효화',
  '라이브 반영',
];

export function DeployConfirmModal({
  open,
  phase,
  siteId,
  uploadedFileName,
  validatePassed,
  validateTotal,
  result,
  errorMessage,
  onConfirm,
  onClose,
}: Props) {
  // Drive a fake-but-monotonic step indicator while the deploy API is
  // in flight. We can't get real backend progress, so we walk forward
  // on a timer and pin at the last step until phase flips to done.
  const [progressStep, setProgressStep] = useState(0);

  useEffect(() => {
    if (phase !== 'progress') {
      setProgressStep(0);
      return;
    }
    setProgressStep(0);
    const t1 = setTimeout(() => setProgressStep(1), 600);
    const t2 = setTimeout(() => setProgressStep(2), 1800);
    const t3 = setTimeout(() => setProgressStep(3), 3600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [phase]);

  if (!open) return null;

  const targetUrl = `https://${siteId}.aiseo.tips`;
  const blockClose = phase === 'progress';

  const handleOverlayClick = () => {
    if (!blockClose) onClose();
  };

  return ReactDOM.createPortal(
    <div style={styles.overlay} onClick={handleOverlayClick}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {!blockClose && (
          <button style={styles.closeBtn} onClick={onClose} aria-label="닫기">
            &times;
          </button>
        )}

        {phase === 'confirm' && (
          <>
            <div style={styles.title}>프로덕션 배포 확인</div>
            <div style={styles.warning}>
              아래 라이브 사이트가 즉시 새 ZIP 의 내용으로 덮어써집니다.
            </div>
            <div style={styles.urlBox}>
              <div style={styles.urlLabel}>대상</div>
              <div style={styles.urlValue}>{targetUrl}</div>
            </div>
            <dl style={styles.factGrid}>
              <dt style={styles.factKey}>업로드 파일</dt>
              <dd style={styles.factVal}>{uploadedFileName || '—'}</dd>
              {typeof validatePassed === 'number' && typeof validateTotal === 'number' && (
                <>
                  <dt style={styles.factKey}>검증 통과</dt>
                  <dd style={styles.factVal}>
                    {validatePassed} / {validateTotal}
                  </dd>
                </>
              )}
            </dl>
            <div style={styles.footer}>
              <button style={styles.btnSecondary} onClick={onClose}>
                취소
              </button>
              <button style={styles.btnPrimary} onClick={onConfirm}>
                🚀 배포 실행
              </button>
            </div>
          </>
        )}

        {phase === 'progress' && (
          <>
            <div style={styles.title}>배포 중...</div>
            <div style={styles.subtitle}>
              잠시만 기다려 주세요. 이 창을 닫지 마세요.
            </div>
            <ol style={styles.steps}>
              {PROGRESS_STEPS.map((label, i) => {
                const state =
                  i < progressStep ? 'done' : i === progressStep ? 'active' : 'idle';
                return (
                  <li key={label} style={styles.stepRow}>
                    <span
                      style={{
                        ...styles.stepDot,
                        ...(state === 'done' ? styles.stepDotDone : {}),
                        ...(state === 'active' ? styles.stepDotActive : {}),
                      }}
                    >
                      {state === 'done' ? '✓' : state === 'active' ? '' : ''}
                    </span>
                    <span
                      style={{
                        ...styles.stepLabel,
                        ...(state === 'idle' ? styles.stepLabelIdle : {}),
                        ...(state === 'active' ? styles.stepLabelActive : {}),
                      }}
                    >
                      {label}
                      {state === 'active' && <span style={styles.spinner} />}
                    </span>
                  </li>
                );
              })}
            </ol>
          </>
        )}

        {phase === 'done' && (
          <>
            <div style={styles.doneIcon}>✓</div>
            <div style={styles.title}>배포 완료</div>
            <div style={styles.subtitle}>
              CDN 캐시 갱신은 보통 30~60초 정도 소요됩니다.
            </div>
            <a
              href={result?.deployedUrl || targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.urlBoxLink}
            >
              <div style={styles.urlLabel}>라이브 URL</div>
              <div style={styles.urlValue}>{result?.deployedUrl || targetUrl}</div>
            </a>
            {result && (
              <dl style={styles.factGrid}>
                <dt style={styles.factKey}>업로드 파일 수</dt>
                <dd style={styles.factVal}>{result.uploadedCount}개</dd>
                {result.invalidationId && (
                  <>
                    <dt style={styles.factKey}>Invalidation</dt>
                    <dd style={styles.factVal}>{result.invalidationId}</dd>
                  </>
                )}
              </dl>
            )}
            <div style={styles.footer}>
              <button style={styles.btnSecondary} onClick={onClose}>
                닫기
              </button>
              <button
                style={styles.btnPrimary}
                onClick={() => window.open(result?.deployedUrl || targetUrl, '_blank')}
              >
                새 탭에서 열기
              </button>
            </div>
          </>
        )}

        {phase === 'error' && (
          <>
            <div style={styles.errorIcon}>!</div>
            <div style={styles.title}>배포 실패</div>
            <div style={styles.errorBox}>
              {errorMessage || '알 수 없는 오류가 발생했습니다.'}
            </div>
            <div style={styles.footer}>
              <button style={styles.btnSecondary} onClick={onClose}>
                닫기
              </button>
              <button style={styles.btnPrimary} onClick={onConfirm}>
                다시 시도
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 9999,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
  },
  modal: {
    background: '#fff', borderRadius: 16, padding: '28px 28px 20px', width: '100%',
    maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', position: 'relative',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Noto Sans KR', sans-serif",
    color: '#1a1a18', boxShadow: '0 20px 60px rgba(0,0,0,.18)',
  },
  closeBtn: {
    position: 'absolute', top: 12, right: 16, background: 'none', border: 'none',
    fontSize: 24, lineHeight: 1, cursor: 'pointer', color: '#888',
  },
  title: {
    fontSize: 18, fontWeight: 700, marginBottom: 8, marginTop: 4,
  },
  subtitle: {
    fontSize: 13, color: '#666', marginBottom: 16,
  },
  warning: {
    fontSize: 13, color: '#7a3a00', background: '#fff7ed',
    border: '1px solid #fdba74', borderRadius: 8, padding: '10px 12px', marginBottom: 16,
  },
  urlBox: {
    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8,
    padding: '10px 12px', marginBottom: 14,
  },
  urlBoxLink: {
    display: 'block', background: '#f0f9ff', border: '1px solid #bae6fd',
    borderRadius: 8, padding: '10px 12px', marginBottom: 14, textDecoration: 'none',
  },
  urlLabel: {
    fontSize: 11, color: '#64748b', marginBottom: 2, fontWeight: 600,
    letterSpacing: '0.04em', textTransform: 'uppercase',
  },
  urlValue: {
    fontSize: 14, color: '#0369a1', wordBreak: 'break-all', fontWeight: 600,
  },
  factGrid: {
    display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 16px',
    margin: '0 0 16px', padding: 0,
  },
  factKey: {
    fontSize: 12, color: '#64748b', fontWeight: 500, margin: 0,
  },
  factVal: {
    fontSize: 13, color: '#1a1a18', fontWeight: 600, margin: 0, wordBreak: 'break-all',
  },
  footer: {
    display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8,
  },
  btnPrimary: {
    padding: '10px 18px', borderRadius: 8, border: 'none', background: '#16a34a',
    color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
  btnSecondary: {
    padding: '10px 18px', borderRadius: 8, border: '1px solid #cbd5e1',
    background: '#fff', color: '#475569', fontSize: 14, fontWeight: 500, cursor: 'pointer',
  },
  steps: {
    listStyle: 'none', padding: 0, margin: '8px 0 16px',
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  stepRow: {
    display: 'flex', alignItems: 'center', gap: 12,
  },
  stepDot: {
    width: 22, height: 22, borderRadius: '50%', background: '#e2e8f0',
    color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, flexShrink: 0,
  },
  stepDotDone: { background: '#16a34a' },
  stepDotActive: {
    background: '#fff', border: '2px solid #16a34a',
  },
  stepLabel: {
    fontSize: 14, color: '#1a1a18', display: 'inline-flex', alignItems: 'center', gap: 8,
  },
  stepLabelIdle: { color: '#94a3b8' },
  stepLabelActive: { fontWeight: 600 },
  spinner: {
    display: 'inline-block', width: 12, height: 12, borderRadius: '50%',
    border: '2px solid #cbd5e1', borderTopColor: '#16a34a',
    animation: 'aiseo-deploy-spin 0.8s linear infinite',
  },
  doneIcon: {
    width: 48, height: 48, borderRadius: '50%', background: '#16a34a', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 28, fontWeight: 700, marginBottom: 12,
  },
  errorIcon: {
    width: 48, height: 48, borderRadius: '50%', background: '#dc2626', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 28, fontWeight: 700, marginBottom: 12,
  },
  errorBox: {
    fontSize: 13, color: '#7f1d1d', background: '#fef2f2',
    border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', marginBottom: 16,
    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
  },
};

// Inject keyframes once at module load. Inline-style spinners can't
// declare animations, so we hand the keyframe to a stylesheet.
if (typeof document !== 'undefined' && !document.getElementById('aiseo-deploy-spin')) {
  const styleEl = document.createElement('style');
  styleEl.id = 'aiseo-deploy-spin';
  styleEl.textContent = '@keyframes aiseo-deploy-spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(styleEl);
}
