import { useState } from 'react';
import ReactDOM from 'react-dom';
import { submitEventSignup } from '../api';
import type { EventCode, EventHasSite } from '../api';

interface Props {
  open: boolean;
  onClose: () => void;
  eventCode: EventCode;
  /** Where the modal was triggered from (e.g. 'free-block3-primary'). */
  source: string;
}

const TOTAL_STEPS = 4;

const INDUSTRY_OPTIONS = [
  { id: 'pet', label: '반려동물' },
  { id: 'oneday', label: '원데이클래스' },
  { id: 'pt', label: 'PT·운동' },
  { id: 'custom', label: '맞춤제작' },
  { id: 'pro', label: '전문서비스' },
  { id: 'etc', label: '기타' },
];

const HAS_SITE_OPTIONS: { id: EventHasSite; label: string }[] = [
  { id: 'yes', label: '있음' },
  { id: 'no', label: '없음' },
  { id: 'wip', label: '만드는 중' },
];

const EVENT_LABELS: Record<EventCode, string> = {
  EVENT_01_FREE: 'EVENT 01 · 무료 런칭 파트너',
  EVENT_02_PAID: 'EVENT 02 · 검색 전략 + 배포',
  EVENT_03_PAID: 'EVENT 03 · 콘텐츠 기획 + 배포',
  EVENT_04_PAID: 'EVENT 04 · 풀패키지 (첫완성)',
  EVENT_05_PET_PHOTO: 'EVENT 05 · 반려동물 사진작가 특별',
};

// 유료 이벤트별 입금 금액 — 완료 화면 안내 문구에 사용.
const PAID_AMOUNTS: Partial<Record<EventCode, string>> = {
  EVENT_02_PAID: '10만원',
  EVENT_03_PAID: '10만원',
  EVENT_04_PAID: '35만원',
};

const isPaidEvent = (code: EventCode) => code in PAID_AMOUNTS;

export function EventSignupModal({ open, onClose, eventCode, source }: Props) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [industry, setIndustry] = useState('');
  const [region, setRegion] = useState('');
  const [hasSite, setHasSite] = useState<EventHasSite | ''>('');
  const [concern, setConcern] = useState('');
  const [kakaoConsent, setKakaoConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!open) return null;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
    let formatted = digits;
    if (digits.length > 7) {
      formatted = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
    } else if (digits.length > 3) {
      formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }
    setPhone(formatted);
  };

  const canNext = (): boolean => {
    switch (step) {
      case 1: return name.trim().length > 0 && phone.replace(/\D/g, '').length >= 10;
      case 2: return industry !== '' && region.trim().length > 0 && hasSite !== '';
      case 3: return concern.trim().length > 0;
      case 4: return kakaoConsent;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await submitEventSignup({
        eventCode,
        name: name.trim(),
        phone,
        industry: INDUSTRY_OPTIONS.find(o => o.id === industry)?.label || industry,
        region: region.trim(),
        hasSite: (hasSite || undefined) as EventHasSite | undefined,
        concern: concern.trim(),
        kakaoConsent,
        source,
      });
      setDone(true);
    } catch {
      alert('신청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setName(''); setPhone(''); setIndustry(''); setRegion('');
    setHasSite(''); setConcern(''); setKakaoConsent(false); setDone(false);
    onClose();
  };

  const renderStep = () => {
    if (done) {
      const paidNote = isPaidEvent(eventCode)
        ? `입금 안내(${PAID_AMOUNTS[eventCode]})도 함께 보내드립니다.`
        : '선착순 3팀 자격 검토 후 안내드립니다.';
      return (
        <div style={styles.doneWrap}>
          <div style={styles.doneIcon}>&#10003;</div>
          <div style={styles.doneTitle}>신청이 접수되었습니다!</div>
          <div style={styles.doneSub}>
            {name}님, {EVENT_LABELS[eventCode]} 신청 감사합니다.<br />
            등록하신 번호의 카카오톡으로 1영업일 내 연락드립니다.<br />
            <span style={{ color: '#185fa5', fontWeight: 500 }}>{paidNote}</span>
          </div>
          <button style={styles.btnPrimary} onClick={handleClose}>확인</button>
        </div>
      );
    }

    switch (step) {
      case 1:
        return (
          <div>
            <div style={styles.stepTitle}>이름과 연락처</div>
            <div style={styles.stepDesc}>카카오톡 가능한 번호로 1영업일 내 연락드립니다.</div>
            <input
              style={{ ...styles.input, marginBottom: 10 }}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="이름 또는 회사명 (예: 홍길동)"
              autoFocus
            />
            <input
              style={styles.input}
              value={phone}
              onChange={handlePhoneChange}
              type="tel"
              placeholder="010-0000-0000"
            />
          </div>
        );
      case 2:
        return (
          <div>
            <div style={styles.stepTitle}>업종 · 지역 · 현재 상황</div>
            <div style={styles.stepDesc}>맞춤 안내를 위해 기본 정보를 확인합니다.</div>
            <div style={styles.fieldLabel}>업종</div>
            <div style={styles.chipRow}>
              {INDUSTRY_OPTIONS.map(o => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setIndustry(o.id)}
                  style={{
                    ...styles.chip,
                    ...(industry === o.id ? styles.chipSelected : {}),
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>

            <div style={{ ...styles.fieldLabel, marginTop: 16 }}>지역</div>
            <input
              style={styles.input}
              value={region}
              onChange={e => setRegion(e.target.value)}
              placeholder="예: 서울 / 천안 / 세종"
            />

            <div style={{ ...styles.fieldLabel, marginTop: 16 }}>홈페이지 유무</div>
            <div style={styles.chipRow}>
              {HAS_SITE_OPTIONS.map(o => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setHasSite(o.id)}
                  style={{
                    ...styles.chip,
                    ...(hasSite === o.id ? styles.chipSelected : {}),
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div>
            <div style={styles.stepTitle}>지금 가장 큰 고민 (한 줄)</div>
            <div style={styles.stepDesc}>
              {isPaidEvent(eventCode)
                ? '시작점을 정확히 잡기 위해 짧게 알려주세요.'
                : '자격 검토에 활용됩니다. 자세할 필요 없이 한 줄이면 충분합니다.'}
            </div>
            <textarea
              style={{ ...styles.input, minHeight: 90, resize: 'vertical' }}
              value={concern}
              onChange={e => setConcern(e.target.value.slice(0, 500))}
              placeholder="예: 검색에서 안 나옵니다 / 콘텐츠를 어떻게 시작할지 모르겠어요"
              autoFocus
              rows={3}
            />
            <div style={styles.charCount}>{concern.length} / 500</div>
          </div>
        );
      case 4: {
        const summary = [
          `${EVENT_LABELS[eventCode]}`,
          `이름 · ${name}`,
          `연락처 · ${phone}`,
          `업종 · ${INDUSTRY_OPTIONS.find(o => o.id === industry)?.label || '-'}`,
          `지역 · ${region}`,
          `홈페이지 · ${HAS_SITE_OPTIONS.find(o => o.id === hasSite)?.label || '-'}`,
        ];
        return (
          <div>
            <div style={styles.stepTitle}>마지막으로 확인해주세요</div>
            <div style={styles.stepDesc}>아래 내용으로 신청을 접수합니다.</div>
            <div style={styles.infoBox}>
              {summary.map((line, i) => (
                <div key={i} style={styles.infoItem}>· {line}</div>
              ))}
            </div>
            <label style={styles.checkLabel}>
              <input
                type="checkbox"
                style={styles.checkbox}
                checked={kakaoConsent}
                onChange={e => setKakaoConsent(e.target.checked)}
              />
              카카오톡으로 안내 연락을 받는 데 동의합니다.
            </label>
          </div>
        );
      }
      default:
        return null;
    }
  };

  return ReactDOM.createPortal(
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={handleClose} aria-label="닫기">&times;</button>

        {!done && (
          <>
            <div style={styles.progressWrap}>
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    ...styles.progressDot,
                    ...(i + 1 < step ? styles.progressDotDone : {}),
                    ...(i + 1 === step ? styles.progressDotActive : {}),
                  }}
                />
              ))}
            </div>
            <div style={styles.stepIndicator}>{step} / {TOTAL_STEPS}</div>
          </>
        )}

        <div style={styles.body}>{renderStep()}</div>

        {!done && (
          <div style={styles.footer}>
            {step > 1 && (
              <button style={styles.btnSecondary} onClick={() => setStep(s => s - 1)}>
                이전
              </button>
            )}
            <div style={{ flex: 1 }} />
            {step < TOTAL_STEPS ? (
              <button
                style={{ ...styles.btnPrimary, ...(canNext() ? {} : styles.btnDisabled) }}
                disabled={!canNext()}
                onClick={() => setStep(s => s + 1)}
              >
                다음
              </button>
            ) : (
              <button
                style={{ ...styles.btnPrimary, ...(canNext() && !submitting ? {} : styles.btnDisabled) }}
                disabled={!canNext() || submitting}
                onClick={handleSubmit}
              >
                {submitting ? '신청 중...' : '신청 완료'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 9999,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
  },
  modal: {
    background: '#fff', borderRadius: 16, padding: '28px 28px 20px', width: '100%',
    maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', position: 'relative',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Noto Sans KR', sans-serif",
    color: '#1a1a18',
  },
  closeBtn: {
    position: 'absolute', top: 14, right: 16, background: 'none', border: 'none',
    fontSize: 24, color: '#999', cursor: 'pointer', lineHeight: 1,
  },
  progressWrap: {
    display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 8,
  },
  progressDot: {
    width: 28, height: 4, borderRadius: 2, background: '#e0dfd8', transition: 'background .2s',
  },
  progressDotActive: {
    background: '#1a1a18',
  },
  progressDotDone: {
    background: '#185fa5',
  },
  stepIndicator: {
    textAlign: 'center', fontSize: 12, color: '#999', marginBottom: 20,
  },
  body: {
    minHeight: 220,
  },
  stepTitle: {
    fontSize: 18, fontWeight: 600, marginBottom: 6,
  },
  stepDesc: {
    fontSize: 13, color: '#666', marginBottom: 18, lineHeight: 1.5,
  },
  fieldLabel: {
    fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 8,
  },
  input: {
    width: '100%', padding: '12px 14px', border: '1px solid #e0dfd8', borderRadius: 8,
    fontSize: 14, outline: 'none', boxSizing: 'border-box' as const,
    fontFamily: 'inherit', color: '#1a1a18', transition: 'border-color .15s',
  },
  charCount: {
    fontSize: 11, color: '#999', textAlign: 'right' as const, marginTop: 6,
  },
  chipRow: {
    display: 'flex', flexWrap: 'wrap', gap: 8,
  },
  chip: {
    padding: '8px 14px', border: '1px solid #e0dfd8', borderRadius: 100,
    fontSize: 13, background: '#fff', color: '#444', cursor: 'pointer',
    transition: 'border-color .15s, background .15s, color .15s',
    fontFamily: 'inherit',
  },
  chipSelected: {
    borderColor: '#185fa5', background: '#f0f5fb', color: '#185fa5', fontWeight: 600,
  },
  infoBox: {
    background: '#f8f7f4', borderRadius: 8, padding: '14px 16px', marginBottom: 16,
  },
  infoItem: {
    fontSize: 13, color: '#444', lineHeight: 1.8,
  },
  checkLabel: {
    display: 'flex', alignItems: 'center', gap: 8, fontSize: 14,
    cursor: 'pointer', color: '#1a1a18', fontWeight: 500,
  },
  checkbox: {
    width: 18, height: 18, cursor: 'pointer', accentColor: '#185fa5',
  },
  footer: {
    display: 'flex', alignItems: 'center', gap: 10, marginTop: 24, paddingTop: 16,
    borderTop: '1px solid #e0dfd8',
  },
  btnPrimary: {
    background: '#1a1a18', color: '#fff', border: 'none', borderRadius: 8,
    padding: '11px 28px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
    fontFamily: 'inherit', transition: 'opacity .15s',
  },
  btnSecondary: {
    background: '#f4f4f2', color: '#1a1a18', border: '1px solid #e0dfd8', borderRadius: 8,
    padding: '11px 24px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
    fontFamily: 'inherit', transition: 'opacity .15s',
  },
  btnDisabled: {
    opacity: 0.4, cursor: 'default',
  },
  doneWrap: {
    textAlign: 'center', padding: '20px 0',
  },
  doneIcon: {
    width: 56, height: 56, borderRadius: '50%', background: '#185fa5', color: '#fff',
    fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 16px',
  },
  doneTitle: {
    fontSize: 18, fontWeight: 600, marginBottom: 8,
  },
  doneSub: {
    fontSize: 14, color: '#666', lineHeight: 1.7, marginBottom: 24,
  },
};
