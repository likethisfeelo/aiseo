import { useState } from 'react';
import type { HeadSnippets } from '../../types';

// Meta Pixel ID 정상 범위 — Meta 가 발급하는 ID 는 15~16자리 숫자가 표준.
// 보수적으로 14~18 로 잡아 연도/플랫폼 변동에도 동작하게.
const MIN_LEN = 14;
const MAX_LEN = 18;

const isValidId = (s: string) => /^\d+$/.test(s) && s.length >= MIN_LEN && s.length <= MAX_LEN;

const maskId = (id: string) => {
  if (!id) return '';
  if (id.length <= 6) return id;
  return id.slice(0, 4) + '*'.repeat(Math.max(id.length - 8, 4)) + id.slice(-4);
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(10,6,20,0.55)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000, padding: 16,
};
const modalStyle: React.CSSProperties = {
  width: '100%', maxWidth: 460, background: '#fff', borderRadius: 14,
  padding: 24, boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
  maxHeight: 'calc(100vh - 32px)', overflow: 'auto',
};

interface Props {
  snippets: HeadSnippets;
  onChange: (s: HeadSnippets) => void;
  // 선택 사항: 연결/해제 직후 즉시 저장하고 싶을 때 부모의 save 핸들러를 전달.
  // React setState 비동기 때문에, 카드가 직접 next snippets 를 만들어
  // 전달해야 부모가 옛 값을 저장하는 경합 조건을 피할 수 있다.
  onSave?: (next: HeadSnippets) => Promise<unknown> | void;
}

type Step = 'guide' | 'paste';

export function MetaPixelConnectCard({ snippets, onChange, onSave }: Props) {
  const connectedId = (snippets.metaPixelId || '').replace(/[^0-9]/g, '');
  const isConnected = isValidId(connectedId);

  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<Step>('guide');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const open = () => {
    setDraft('');
    setErr('');
    setStep('guide');
    setModalOpen(true);
  };
  const close = () => {
    if (busy) return;
    setModalOpen(false);
  };

  const handleConnect = async () => {
    const digits = draft.replace(/[^0-9]/g, '');
    if (!isValidId(digits)) {
      setErr(`숫자 ${MIN_LEN}~${MAX_LEN}자리만 입력 가능합니다.`);
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const next = { ...snippets, metaPixelId: digits };
      onChange(next);
      if (onSave) await onSave(next);
      setModalOpen(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : '연결 실패');
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Meta Pixel 연결을 해제할까요? 다음 배포 시 사이트에서 Pixel 코드가 제거됩니다.')) return;
    const next = { ...snippets, metaPixelId: '' };
    onChange(next);
    if (onSave) {
      try { await onSave(next); } catch { /* 부모 메시지에서 표시 */ }
    }
  };

  return (
    <div style={{
      padding: 18, borderRadius: 10, background: '#fff',
      border: '1px solid var(--border)', marginBottom: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: isConnected ? 12 : 6 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: 'linear-gradient(135deg, #1877F2 0%, #4267B2 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 800, fontSize: 18, flexShrink: 0,
        }}>f</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Meta Pixel</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            Facebook · Instagram 광고 성과 추적
          </div>
        </div>
        {isConnected && (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100,
            background: 'var(--success-soft)', color: 'var(--success-dark)',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
            연결됨
          </span>
        )}
      </div>

      {isConnected ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', borderRadius: 8, background: 'var(--bg-soft)',
          border: '1px solid var(--border)',
        }}>
          <code style={{
            fontFamily: 'monospace', fontSize: 13, color: 'var(--text-primary)',
            letterSpacing: '0.05em', flex: 1,
          }}>{maskId(connectedId)}</code>
          <button
            onClick={open}
            style={{
              padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
              border: '1px solid var(--border-strong)', background: '#fff',
              color: 'var(--text-secondary)', cursor: 'pointer',
            }}
          >ID 변경</button>
          <button
            onClick={handleDisconnect}
            style={{
              padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
              border: '1px solid var(--danger-soft)', background: '#fff',
              color: 'var(--danger)', cursor: 'pointer',
            }}
          >연결 해제</button>
        </div>
      ) : (
        <button
          onClick={open}
          style={{
            width: '100%', padding: '12px 16px', borderRadius: 8,
            border: 'none', background: '#1877F2', color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'background .15s, transform .1s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#0c64d6'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#1877F2'; }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Meta Pixel 연결하기
        </button>
      )}

      {modalOpen && (
        <div style={overlayStyle} onClick={close}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            {step === 'guide' && (
              <>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Meta Pixel ID 찾기
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 18, lineHeight: 1.7 }}>
                  Meta Business Suite 에서 픽셀 ID(15~16자리 숫자)를 복사한 뒤 다음 단계에서 붙여넣으세요.
                </div>
                <ol style={{ paddingLeft: 0, listStyle: 'none', marginBottom: 18 }}>
                  {[
                    ['business.facebook.com 접속', 'Meta Business Suite 로그인'],
                    ['모든 도구 → 이벤트 매니저', '왼쪽 사이드바에서 데이터 소스 선택'],
                    ['픽셀 클릭 → 설정 → 픽셀 ID 복사', '15~16자리 숫자를 그대로 복사'],
                  ].map(([title, desc], i) => (
                    <li key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-soft)' }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: '50%', background: 'var(--primary-soft)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: 'var(--primary)', flexShrink: 0,
                      }}>{i + 1}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{desc}</div>
                      </div>
                    </li>
                  ))}
                </ol>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
                  <a
                    href="https://business.facebook.com/events_manager"
                    target="_blank" rel="noopener noreferrer"
                    style={{
                      padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      border: '1px solid var(--border-strong)', background: '#fff',
                      color: 'var(--text-primary)', textDecoration: 'none',
                    }}
                  >이벤트 매니저 열기 ↗</a>
                  <button
                    onClick={() => setStep('paste')}
                    style={{
                      padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                      border: 'none', background: '#1877F2', color: '#fff', cursor: 'pointer',
                    }}
                  >다음 →</button>
                </div>
              </>
            )}
            {step === 'paste' && (
              <>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Pixel ID 붙여넣기
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 18, lineHeight: 1.7 }}>
                  복사한 숫자 ID 를 그대로 붙여넣으세요. 자동으로 숫자만 추출됩니다.
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  value={draft}
                  onChange={(e) => {
                    setErr('');
                    setDraft(e.target.value.replace(/[^0-9]/g, ''));
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleConnect(); }}
                  placeholder="예: 123456789012345"
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 8,
                    border: `1.5px solid ${err ? 'var(--danger)' : isValidId(draft) ? 'var(--success)' : 'var(--border-strong)'}`,
                    fontSize: 16, fontFamily: 'monospace', letterSpacing: '0.05em',
                    color: 'var(--text-primary)', outline: 'none', marginBottom: 8, boxSizing: 'border-box',
                  }}
                />
                <div style={{ fontSize: 12, marginBottom: 18, color: err ? 'var(--danger)' : 'var(--text-secondary)', minHeight: 18 }}>
                  {err
                    ? `✗ ${err}`
                    : draft.length === 0
                      ? `${MIN_LEN}~${MAX_LEN}자리 숫자`
                      : isValidId(draft)
                        ? '✓ 올바른 형식'
                        : `${draft.length}자리 — 더 입력해 주세요`}
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setStep('guide')}
                    disabled={busy}
                    style={{
                      padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      border: '1px solid var(--border-strong)', background: '#fff',
                      color: 'var(--text-secondary)', cursor: busy ? 'wait' : 'pointer',
                    }}
                  >← 이전</button>
                  <button
                    onClick={handleConnect}
                    disabled={busy || !isValidId(draft)}
                    style={{
                      padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                      border: 'none', cursor: busy || !isValidId(draft) ? 'not-allowed' : 'pointer',
                      background: busy || !isValidId(draft) ? 'var(--border-strong)' : '#1877F2',
                      color: '#fff', opacity: busy ? 0.7 : 1,
                    }}
                  >{busy ? '연결 중...' : '연결'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
