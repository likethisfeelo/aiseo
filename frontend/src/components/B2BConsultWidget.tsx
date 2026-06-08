import { useState } from 'react';
import ReactDOM from 'react-dom';
import { submitB2BConsultation } from '../api';

interface Props {
  open: boolean;
  onClose: () => void;
}

const TOTAL_STEPS = 6;

const MARKETING_STATUS_OPTIONS = [
  { id: 'none', label: '거의 안 하고 있음' },
  { id: 'partial', label: '일부 채널만 운영 중' },
  { id: 'outsourced', label: '외주 대행사 진행 중' },
  { id: 'inhouse', label: '내부 마케팅 팀 운영' },
];

// Brand accent (matches src/styles/design-tokens.css --accent / --accent-dark).
const ACCENT = '#8B6FD4';
const ACCENT_SOFT = '#f3eefc';
const ACCENT_DOT = '#C4A8F5';

export function B2BConsultWidget({ open, onClose }: Props) {
  const [step, setStep] = useState(1);
  const [company, setCompany] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [industry, setIndustry] = useState('');
  const [marketingStatus, setMarketingStatus] = useState('');
  const [memo, setMemo] = useState('');
  const [consent, setConsent] = useState(false);
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
      case 1: return company.trim().length > 0 && contactName.trim().length > 0;
      case 2: return phone.replace(/\D/g, '').length >= 10;
      case 3: return industry.trim().length > 0;
      case 4: return marketingStatus !== '';
      case 5: return true; // memo is optional
      case 6: return consent;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await submitB2BConsultation({
        company: company.trim(),
        contactName: contactName.trim(),
        phone,
        industry: industry.trim(),
        marketingStatus,
        memo: memo.trim(),
        consent,
      });
      setDone(true);
    } catch (err) {
      alert('문의 접수 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setCompany('');
    setContactName('');
    setPhone('');
    setIndustry('');
    setMarketingStatus('');
    setMemo('');
    setConsent(false);
    setDone(false);
    onClose();
  };

  const renderStep = () => {
    if (done) {
      return (
        <div style={styles.doneWrap}>
          <div style={styles.doneIcon}>&#10003;</div>
          <div style={styles.doneTitle}>도입 문의가 접수되었습니다!</div>
          <div style={styles.doneSub}>
            {company} {contactName}님, 등록하신 번호로<br />1영업일 내 슬롯 가용 여부와 함께 연락드리겠습니다.
          </div>
          <button style={styles.btnPrimary} onClick={handleClose}>확인</button>
        </div>
      );
    }

    switch (step) {
      case 1:
        return (
          <div>
            <div style={styles.stepTitle}>회사 정보</div>
            <div style={styles.stepDesc}>회사명과 담당자명을 입력해주세요.</div>
            <input
              style={{ ...styles.input, marginBottom: 10 }}
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="회사명 (예: (주)필로)"
              autoFocus
            />
            <input
              style={styles.input}
              value={contactName}
              onChange={e => setContactName(e.target.value)}
              placeholder="담당자명 (예: 홍길동)"
            />
          </div>
        );
      case 2:
        return (
          <div>
            <div style={styles.stepTitle}>연락처</div>
            <div style={styles.stepDesc}>연락 가능한 전화번호를 입력해주세요.</div>
            <input
              style={styles.input}
              value={phone}
              onChange={handlePhoneChange}
              type="tel"
              placeholder="010-0000-0000"
              autoFocus
            />
          </div>
        );
      case 3:
        return (
          <div>
            <div style={styles.stepTitle}>업종</div>
            <div style={styles.stepDesc}>
              업종 소분류 기준으로 중복 없이 최대 50개 슬롯만 운영합니다. 정확한 업종을 알려주시면 빈 슬롯을 우선 확인합니다.
            </div>
            <input
              style={styles.input}
              value={industry}
              onChange={e => setIndustry(e.target.value)}
              placeholder="예: 산업용 자동화 장비 제조"
              autoFocus
            />
          </div>
        );
      case 4:
        return (
          <div>
            <div style={styles.stepTitle}>현재 온라인 마케팅 현황</div>
            <div style={styles.stepDesc}>현재 상황에 가장 가까운 항목을 선택해주세요.</div>
            {MARKETING_STATUS_OPTIONS.map(opt => (
              <div
                key={opt.id}
                style={{
                  ...styles.radioCard,
                  ...(marketingStatus === opt.id ? styles.radioCardSelected : {}),
                }}
                onClick={() => setMarketingStatus(opt.id)}
              >
                <div style={styles.radioCircle}>
                  {marketingStatus === opt.id ? '●' : '○'}
                </div>
                <div style={styles.optionLabel}>{opt.label}</div>
              </div>
            ))}
          </div>
        );
      case 5:
        return (
          <div>
            <div style={styles.stepTitle}>문의 메모 <span style={styles.optional}>(선택)</span></div>
            <div style={styles.stepDesc}>현재 고민이나 목표가 있다면 자유롭게 적어주세요.</div>
            <textarea
              style={styles.textarea}
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="예: 인바운드 문의가 거의 없어 홈페이지부터 점검하고 싶습니다."
              rows={4}
              autoFocus
            />
          </div>
        );
      case 6:
        return (
          <div>
            <div style={styles.stepTitle}>연락 동의</div>
            <div style={styles.stepDesc}>
              입력하신 연락처({phone})로 도입 상담 연락을 드립니다.
            </div>
            <div style={styles.infoBox}>
              <div style={styles.infoItem}>• 1영업일 내 담당자가 연락드립니다.</div>
              <div style={styles.infoItem}>• 슬롯 가용 여부와 예상 전략을 안내드립니다.</div>
              <div style={styles.infoItem}>• 상담 목적 외 연락은 하지 않습니다.</div>
            </div>
            <label style={styles.checkLabel}>
              <input
                type="checkbox"
                checked={consent}
                onChange={e => setConsent(e.target.checked)}
                style={styles.checkbox}
              />
              동의합니다
            </label>
          </div>
        );
      default:
        return null;
    }
  };

  return ReactDOM.createPortal(
    <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) handleClose(); }}>
      <div style={styles.modal}>
        <button style={styles.closeBtn} onClick={handleClose}>&times;</button>

        {!done && (
          <div style={styles.kicker}>B2B 도입 신청</div>
        )}

        {!done && (
          <div style={styles.progressWrap}>
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div
                key={i}
                style={{
                  ...styles.progressDot,
                  ...(i + 1 === step ? styles.progressDotActive : {}),
                  ...(i + 1 < step ? styles.progressDotDone : {}),
                }}
              />
            ))}
          </div>
        )}

        {!done && (
          <div style={styles.stepIndicator}>{step} / {TOTAL_STEPS}</div>
        )}

        <div style={styles.body}>
          {renderStep()}
        </div>

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
                {submitting ? '접수 중...' : '문의 접수'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(10,6,20,.55)', zIndex: 9999,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
  },
  modal: {
    background: '#fff', borderRadius: 16, padding: '28px 28px 20px', width: '100%',
    maxWidth: 440, maxHeight: '90vh', overflowY: 'auto', position: 'relative',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Noto Sans KR', sans-serif",
    color: '#1a1a18',
  },
  closeBtn: {
    position: 'absolute', top: 14, right: 16, background: 'none', border: 'none',
    fontSize: 24, color: '#999', cursor: 'pointer', lineHeight: 1,
  },
  kicker: {
    textAlign: 'center', fontSize: 11, fontWeight: 800, letterSpacing: 2,
    textTransform: 'uppercase', color: ACCENT, marginBottom: 12,
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
    background: ACCENT_DOT,
  },
  stepIndicator: {
    textAlign: 'center', fontSize: 12, color: '#999', marginBottom: 20,
  },
  body: {
    minHeight: 200,
  },
  stepTitle: {
    fontSize: 18, fontWeight: 600, marginBottom: 6,
  },
  optional: {
    fontSize: 13, fontWeight: 400, color: '#999',
  },
  stepDesc: {
    fontSize: 13, color: '#666', marginBottom: 18, lineHeight: 1.5,
  },
  input: {
    width: '100%', padding: '12px 14px', border: '1px solid #e0dfd8', borderRadius: 8,
    fontSize: 14, outline: 'none', boxSizing: 'border-box' as const,
    fontFamily: 'inherit', color: '#1a1a18', transition: 'border-color .15s',
  },
  textarea: {
    width: '100%', padding: '12px 14px', border: '1px solid #e0dfd8', borderRadius: 8,
    fontSize: 14, outline: 'none', boxSizing: 'border-box' as const,
    fontFamily: 'inherit', color: '#1a1a18', resize: 'vertical', lineHeight: 1.6,
  },
  infoBox: {
    background: ACCENT_SOFT, borderRadius: 8, padding: '14px 16px', marginBottom: 16,
  },
  infoItem: {
    fontSize: 13, color: '#444', lineHeight: 1.8,
  },
  checkLabel: {
    display: 'flex', alignItems: 'center', gap: 8, fontSize: 14,
    cursor: 'pointer', color: '#1a1a18', fontWeight: 500,
  },
  checkbox: {
    width: 18, height: 18, cursor: 'pointer', accentColor: ACCENT,
  },
  optionLabel: {
    fontSize: 14, fontWeight: 500, color: '#1a1a18',
  },
  radioCard: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
    border: '1px solid #e0dfd8', borderRadius: 10, marginBottom: 8,
    cursor: 'pointer', transition: 'border-color .15s, background .15s',
  },
  radioCardSelected: {
    borderColor: ACCENT, background: ACCENT_SOFT,
  },
  radioCircle: {
    fontSize: 16, color: ACCENT, flexShrink: 0, width: 20, textAlign: 'center',
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
    width: 56, height: 56, borderRadius: '50%', background: ACCENT, color: '#fff',
    fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 16px',
  },
  doneTitle: {
    fontSize: 18, fontWeight: 600, marginBottom: 8,
  },
  doneSub: {
    fontSize: 14, color: '#666', lineHeight: 1.6, marginBottom: 24,
  },
};
